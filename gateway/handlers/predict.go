package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"math"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"
	"time"
)

var allowedMIME = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
}

// Clinical metadata fields sent alongside the image.
var requiredFields = []string{"age", "sex", "fitzpatrick", "location", "diameter"}

// OOD thresholds — must match frontend constants
const (
	confidenceThreshold = 0.35
	entropyThreshold    = 2.5
)

type ErrorResponse struct {
	Error   string `json:"error"`
	Details string `json:"details,omitempty"`
}

// Minimal struct to parse inference response for OOD check.
type inferenceResponse struct {
	Confidence    float64            `json:"confidence"`
	Probabilities map[string]float64 `json:"probabilities"`
}

func computeEntropy(probs map[string]float64) float64 {
	entropy := 0.0
	for _, p := range probs {
		if p > 0 {
			entropy -= p * math.Log2(p)
		}
	}
	return entropy
}

func Predict(inferenceURL string, maxUploadBytes int64) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// ── Parse multipart form ──
		if err := r.ParseMultipartForm(maxUploadBytes); err != nil {
			writeError(w, http.StatusBadRequest, "invalid multipart form", err.Error())
			return
		}
		defer r.MultipartForm.RemoveAll()

		// ── Validate image ──
		file, header, err := r.FormFile("image")
		if err != nil {
			writeError(w, http.StatusBadRequest, "missing 'image' field", err.Error())
			return
		}
		defer file.Close()

		if header.Size > maxUploadBytes {
			writeError(w, http.StatusRequestEntityTooLarge,
				fmt.Sprintf("image exceeds %dMB limit", maxUploadBytes/(1024*1024)), "")
			return
		}

		mime := header.Header.Get("Content-Type")
		if !allowedMIME[mime] {
			writeError(w, http.StatusUnsupportedMediaType,
				fmt.Sprintf("unsupported image type: %s (accepted: JPEG, PNG)", mime), "")
			return
		}

		// ── Validate clinical metadata ──
		missing := []string{}
		for _, f := range requiredFields {
			if r.FormValue(f) == "" {
				missing = append(missing, f)
			}
		}
		if len(missing) > 0 {
			writeError(w, http.StatusBadRequest,
				"missing required fields: "+strings.Join(missing, ", "), "")
			return
		}

		// Validate age is numeric
		if _, err := strconv.Atoi(r.FormValue("age")); err != nil {
			writeError(w, http.StatusBadRequest, "age must be a number", "")
			return
		}

		// ── Forward to inference service ──
		respBody, statusCode, err := forwardToInference(inferenceURL, file, header, r)
		if err != nil {
			slog.Error("inference forward failed", "error", err)
			writeError(w, http.StatusBadGateway, "inference service unavailable", err.Error())
			return
		}

		// ── OOD check on successful response ──
		if statusCode == http.StatusOK {
			var result inferenceResponse
			if err := json.Unmarshal(respBody, &result); err == nil {
				entropy := computeEntropy(result.Probabilities)
				if result.Confidence < confidenceThreshold || entropy > entropyThreshold {
					slog.Warn("OOD image rejected",
						"confidence", result.Confidence,
						"entropy", entropy,
					)
					writeError(w, http.StatusUnprocessableEntity,
						"Image does not appear to be a dermoscopic skin lesion. Please upload a close-up photo of a skin lesion.",
						fmt.Sprintf("confidence=%.3f (threshold=%.2f), entropy=%.3f (threshold=%.2f)",
							result.Confidence, confidenceThreshold, entropy, entropyThreshold),
					)
					return
				}
			}
		}

		slog.Info("prediction complete",
			"latency_ms", time.Since(start).Milliseconds(),
			"inference_status", statusCode,
		)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		w.Write(respBody)
	}
}

func forwardToInference(baseURL string, file multipart.File, header *multipart.FileHeader, r *http.Request) ([]byte, int, error) {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Write image
	part, err := writer.CreateFormFile("image", header.Filename)
	if err != nil {
		return nil, 0, fmt.Errorf("create form file: %w", err)
	}
	if _, err := io.Copy(part, file); err != nil {
		return nil, 0, fmt.Errorf("copy image: %w", err)
	}

	// Write clinical metadata fields
	fields := []string{"age", "sex", "fitzpatrick", "location", "diameter",
		"itch", "grew", "hurt", "changed", "bleed", "elevation"}
	for _, f := range fields {
		if val := r.FormValue(f); val != "" {
			writer.WriteField(f, val)
		}
	}

	writer.Close()

	// Send to inference
	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequest("POST", baseURL+"/predict", &buf)
	if err != nil {
		return nil, 0, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := client.Do(req)
	if err != nil {
		return nil, 0, fmt.Errorf("inference request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, 0, fmt.Errorf("read response: %w", err)
	}

	return body, resp.StatusCode, nil
}

func writeError(w http.ResponseWriter, status int, msg, details string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ErrorResponse{Error: msg, Details: details})
}

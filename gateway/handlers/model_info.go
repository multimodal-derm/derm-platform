package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"time"
)

type ModelInfoResponse struct {
	Architecture string   `json:"architecture"`
	Classes      []string `json:"classes"`
	VisionModel  string   `json:"vision_model"`
	TextModel    string   `json:"text_model"`
	ABCDDim      int      `json:"abcd_dim"`
	Version      string   `json:"version"`
}

// ModelInfo returns model metadata. If the inference service is reachable,
// it proxies the response; otherwise it returns a static fallback.
func ModelInfo(inferenceURL string) http.HandlerFunc {
	fallback := ModelInfoResponse{
		Architecture: "Cross-Attention Fusion + Late Fusion MLP",
		Classes:      []string{"ACK", "BCC", "MEL", "NEV", "SCC", "SEK"},
		VisionModel:  "google/medsiglip-448",
		TextModel:    "medicalai/ClinicalBERT",
		ABCDDim:      14,
		Version:      "1.0.0",
	}

	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Try inference service first
		client := &http.Client{Timeout: 5 * time.Second}
		resp, err := client.Get(inferenceURL + "/model/info")
		if err == nil && resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			body, _ := io.ReadAll(resp.Body)
			w.Write(body)
			return
		}

		// Fallback to static info
		json.NewEncoder(w).Encode(fallback)
	}
}

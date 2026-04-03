package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type HealthResponse struct {
	Status    string           `json:"status"`
	Gateway   string           `json:"gateway"`
	Inference *InferenceHealth `json:"inference"`
	Timestamp string           `json:"timestamp"`
}

type InferenceHealth struct {
	Status  string `json:"status"`
	Latency string `json:"latency_ms,omitempty"`
	Error   string `json:"error,omitempty"`
}

func Health(inferenceURL string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		resp := HealthResponse{
			Gateway:   "healthy",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		}

		// Check inference service
		infHealth := checkInference(inferenceURL)
		resp.Inference = infHealth

		if infHealth.Status == "healthy" {
			resp.Status = "healthy"
		} else {
			resp.Status = "degraded"
		}

		w.Header().Set("Content-Type", "application/json")
		if resp.Status != "healthy" {
			w.WriteHeader(http.StatusServiceUnavailable)
		}
		json.NewEncoder(w).Encode(resp)
	}
}

func checkInference(baseURL string) *InferenceHealth {
	client := &http.Client{Timeout: 5 * time.Second}
	start := time.Now()

	resp, err := client.Get(baseURL + "/health")
	latency := time.Since(start).Milliseconds()

	if err != nil {
		return &InferenceHealth{
			Status: "unhealthy",
			Error:  fmt.Sprintf("connection failed: %v", err),
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return &InferenceHealth{
			Status: "unhealthy",
			Error:  fmt.Sprintf("unexpected status: %d", resp.StatusCode),
		}
	}

	return &InferenceHealth{
		Status:  "healthy",
		Latency: fmt.Sprintf("%d", latency),
	}
}

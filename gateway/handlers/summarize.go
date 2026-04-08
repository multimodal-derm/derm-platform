package handlers

import (
	"bytes"
	"io"
	"log/slog"
	"net/http"
	"time"
)

func Summarize(ragURL string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		body, err := io.ReadAll(r.Body)
		if err != nil {
			writeError(w, http.StatusBadRequest, "failed to read request body", err.Error())
			return
		}
		defer r.Body.Close()

		// Forward JSON body to RAG service
		client := &http.Client{Timeout: 120 * time.Second}
		req, err := http.NewRequest("POST", ragURL+"/summarize", bytes.NewReader(body))
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create request", err.Error())
			return
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			slog.Error("RAG service request failed", "error", err)
			writeError(w, http.StatusBadGateway, "RAG service unavailable", err.Error())
			return
		}
		defer resp.Body.Close()

		respBody, err := io.ReadAll(resp.Body)
		if err != nil {
			writeError(w, http.StatusBadGateway, "failed to read RAG response", err.Error())
			return
		}

		slog.Info("summary complete",
			"latency_ms", time.Since(start).Milliseconds(),
			"rag_status", resp.StatusCode,
		)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(resp.StatusCode)
		w.Write(respBody)
	}
}

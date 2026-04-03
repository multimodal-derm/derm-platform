package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/multimodal-derm/derm-platform/gateway/config"
	"github.com/multimodal-derm/derm-platform/gateway/handlers"
	"github.com/multimodal-derm/derm-platform/gateway/middleware"
)

func main() {
	// Structured JSON logging
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})))

	cfg := config.Load()
	maxBytes := cfg.MaxUploadSizeMB * 1024 * 1024

	slog.Info("starting gateway",
		"port", cfg.Port,
		"inference_url", cfg.InferenceURL,
		"max_upload_mb", cfg.MaxUploadSizeMB,
	)

	// ── Routes ──
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/v1/predict", handlers.Predict(cfg.InferenceURL, maxBytes))
	mux.HandleFunc("GET /api/v1/health", handlers.Health(cfg.InferenceURL))
	mux.HandleFunc("GET /api/v1/model/info", handlers.ModelInfo(cfg.InferenceURL))

	// ── Middleware chain ──
	var handler http.Handler = mux
	handler = middleware.CORS(cfg.AllowedOrigins)(handler)
	handler = middleware.Logger(handler)

	// ── Server ──
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// ── Graceful shutdown ──
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		sig := <-sigCh
		slog.Info("shutdown signal received", "signal", sig)

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			slog.Error("shutdown error", "error", err)
		}
	}()

	fmt.Printf("\n  🩺 derm-platform gateway\n")
	fmt.Printf("  ────────────────────────\n")
	fmt.Printf("  http://localhost:%s/api/v1/health\n", cfg.Port)
	fmt.Printf("  http://localhost:%s/api/v1/predict\n\n", cfg.Port)

	if err := srv.ListenAndServe(); err != http.ErrServerClosed {
		slog.Error("server error", "error", err)
		os.Exit(1)
	}

	slog.Info("gateway stopped")
}

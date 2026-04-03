package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port            string
	InferenceURL    string
	AllowedOrigins  string
	MaxUploadSizeMB int64
}

func Load() *Config {
	return &Config{
		Port:            getEnv("GATEWAY_PORT", "8080"),
		InferenceURL:    getEnv("INFERENCE_URL", "http://localhost:8081"),
		AllowedOrigins:  getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
		MaxUploadSizeMB: getEnvInt("MAX_UPLOAD_SIZE_MB", 10),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func getEnvInt(key string, fallback int64) int64 {
	if val := os.Getenv(key); val != "" {
		if n, err := strconv.ParseInt(val, 10, 64); err == nil {
			return n
		}
	}
	return fallback
}

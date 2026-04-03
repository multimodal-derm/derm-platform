.PHONY: up down build gateway inference logs clean

# Start all services
up:
	docker compose up --build

# Start in background
up-d:
	docker compose up --build -d

# Stop services
down:
	docker compose down

# Build only
build:
	docker compose build

# Run gateway locally (no Docker)
gateway:
	cd gateway && go run main.go

# Run inference locally (no Docker)
inference:
	cd inference && uvicorn main:app --port 8081 --reload

# View logs
logs:
	docker compose logs -f

# Clean up
clean:
	docker compose down -v --rmi local

.PHONY: up down build gateway inference frontend logs clean

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

# Run frontend locally (no Docker)
frontend:
	cd frontend && npm run dev

# View logs
logs:
	docker compose logs -f

# Clean up
clean:
	docker compose down -v --rmi local

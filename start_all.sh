#!/bin/bash

# Start Cheque Information Extractor application (backend and frontend)
echo "Starting Cheque Information Extractor application..."

# Ensure logs directory exists (volume may override Docker-created path)
mkdir -p logs

# Start FastAPI server with Gunicorn
echo "Starting FastAPI server..."
nohup gunicorn src.web.backend.api:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --log-level info > logs/gunicorn.log 2>&1 &

# Start Celery worker
echo "Starting Celery worker..."
nohup celery -A src.web.backend.celery_worker worker --concurrency=4 --loglevel=info > logs/celery.log 2>&1 &

# Wait a few seconds for backend to start
echo "Waiting for backend services to initialize..."
sleep 5

# Start the frontend server
echo "Starting frontend server..."
python3 main.py
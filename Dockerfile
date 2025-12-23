FROM python:3.13-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc g++ curl libgl1 libglib2.0-0 libsm6 libxext6 \
    libxrender-dev libgomp1 libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy requirements and install dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -e . \
    && pip cache purge

# Set environment variables
ENV TRANSFORMERS_CACHE=/app/.cache/transformers \
    HF_HOME=/app/.cache/huggingface \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Create directories
RUN mkdir -p /app/.cache/transformers /app/.cache/huggingface logs

# Download models BEFORE copying code and creating user
RUN python -c "from transformers import TrOCRProcessor, VisionEncoderDecoderModel; \
    print('Downloading TrOCR processor...'); \
    processor = TrOCRProcessor.from_pretrained('microsoft/trocr-base-printed', cache_dir='/app/.cache/transformers', use_fast=True); \
    print('Downloading TrOCR model...'); \
    model = VisionEncoderDecoderModel.from_pretrained('microsoft/trocr-base-printed', cache_dir='/app/.cache/transformers'); \
    print('Models downloaded successfully!')"

# Copy application code
COPY . .

# Make start script executable
RUN chmod +x start_all.sh

# Create non-root user and fix ALL permissions
RUN useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["./start_all.sh"]
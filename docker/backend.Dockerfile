# Backend Dockerfile for ClubHub API
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Create static directories
RUN mkdir -p static/qr_codes static/event_posters static/profile_images

# Expose port
EXPOSE 5000

# Run the application
CMD ["python", "run.py"]


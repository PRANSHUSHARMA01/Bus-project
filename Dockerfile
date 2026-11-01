# ==============================================================================
# Stage 1: Build Frontend (Static Export)
# ==============================================================================
FROM node:22-alpine AS frontend-builder
WORKDIR /build

# Copy dependency manifests
COPY frontend/package.json frontend/package*.json ./
RUN npm install

# Copy frontend source and build static export (outputs to /build/out)
COPY frontend/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ==============================================================================
# Stage 2: Production Python Backend (Serves API + Static Frontend from same origin)
# ==============================================================================
FROM python:3.12-slim AS runner

# Create dedicated non-root user for security
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/sh -m appuser

WORKDIR /app

# Minimal runtime packages (curl for healthcheck, libpq for PostgreSQL)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY backend/ ./

# Copy compiled static output from Stage 1
COPY --from=frontend-builder /build/out ./static

# Fix permissions for non-root user
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

ENV PORT=8000 \
    HOST=0.0.0.0 \
    PYTHONUNBUFFERED=1

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--proxy-headers", "--forwarded-allow-ips=*"]

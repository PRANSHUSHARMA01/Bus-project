# ==============================================================================
# Production Single-Server Dockerfile for Smart Public Bus (pranshusharma.tech)
# Architecture: FastAPI serves built Next.js static export + API + WebSockets
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Next.js Static Export
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend dependency manifests
COPY frontend/package.json frontend/package-lock.json* ./

# Install dependencies cleanly
RUN npm ci --prefer-offline --no-audit

# Copy frontend source files
COPY frontend/ ./

# Disable telemetry and build static export (outputs to /app/frontend/out)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Python Runtime
# ------------------------------------------------------------------------------
FROM python:3.12-slim AS runner

# Prevent Python from writing .pyc and buffer stdout
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    APP_ENV=production

WORKDIR /app

# Install security updates and curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python production dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ ./backend/

# Copy built frontend assets into FastAPI's static serving directory
COPY --from=frontend-builder /app/frontend/out/ ./backend/static/

# Ensure persistent data directory exists
RUN mkdir -p /app/backend/data

# Security Hardening: Create non-root system user
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -s /bin/sh -m appuser && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

# Docker healthcheck querying FastAPI /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

WORKDIR /app/backend

# Launch production Uvicorn server with standard ASGI loop
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--proxy-headers", "--forwarded-allow-ips", "*"]

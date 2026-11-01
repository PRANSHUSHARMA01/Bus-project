# Single-Server AWS Production Deployment Runbook
**Smart Public Bus Tracking · pranshusharma.tech**
*Team Qubits · Production Release 2.1*

---

## 1. System Architecture (Single-Origin Deployable Unit)

The application runs as **one deployable unit** on a single AWS EC2 instance without third-party backend hosting (no Vercel, no Supabase, no external auth services).

```
                      HTTPS:443
   [Passenger Browser / Mobile App]
                  │
                  ▼
   [Nginx / Caddy Reverse Proxy]
      ├── TLS 1.3 Termination (Let's Encrypt)
      ├── Security Headers (HSTS, CSP, Permissions-Policy)
      ├── Static Gzip Compression
      └── WebSocket Upgrades (/ws)
                  │
                  ▼ HTTP:8000 (Internal)
   [FastAPI Production Server (Uvicorn)]
      ├── Static SPA Engine  ──► Serves backend/static/ (Next.js 16 Static Export)
      ├── REST API (/api/v1) ──► Routing, Fares, Safe Stops, Helplines, Legal
      ├── Auth Engine        ──► Cryptographic OTPs & HttpOnly JWT Cookie Sessions
      ├── Real-Time WS (/ws) ──► Live AIS-140 GPS Telemetry & SOS Broadcasts
      └── Persistence Layer  ──► Persistent SQLite Database (backend/data/app.db)
```

---

## 2. Infrastructure Prerequisites

| Component | Specification |
|---|---|
| **Cloud Provider** | AWS (Amazon Web Services) |
| **Instance Type** | `t3.micro` (1 GB RAM, AWS Free Tier) or `t3.small` (2 GB RAM) |
| **Operating System**| Ubuntu 22.04 LTS or 24.04 LTS (x86_64) |
| **Storage** | 20 GB gp3 SSD Volume |
| **Security Group** | Ports `22` (SSH), `80` (HTTP), `443` (HTTPS) |
| **Domain** | `pranshusharma.tech` (A Record pointing to EC2 Elastic IP) |

---

## 3. Deployment Method A: Docker & Docker Compose (Recommended)

### Step 1: Clone Repository on EC2
```bash
git clone https://github.com/PRANSHUSHARMA01/Bus-project.git /home/ubuntu/bus-project
cd /home/ubuntu/bus-project
```

### Step 2: Configure Environment
Create `.env` file in project root:
```bash
cat <<EOF > .env
APP_ENV=production
PORT=8000
JWT_SECRET=$(openssl rand -hex 32)
CORS_ORIGINS=https://pranshusharma.tech,http://localhost:8000
EOF
```

### Step 3: Launch Multi-Stage Build & Run
```bash
docker compose up -d --build
```
This triggers the multi-stage build:
1. `node:20-alpine` runs `npm run build` to export static HTML/JS/CSS assets.
2. `python:3.12-slim` installs dependencies and bundles FastAPI + static assets.
3. Automatically launches container with health checks enabled.

### Step 4: Verify Container Health
```bash
docker compose ps
curl -I http://localhost:8000/health
```

---

## 4. Deployment Method B: Native Systemd & Nginx

If deploying directly on bare Ubuntu without Docker:

### Step 1: Run Automated Deployment Script
```bash
chmod +x scripts/deploy_ec2.sh
./scripts/deploy_ec2.sh
```

### Step 2: Acquire Free SSL Certificate via Certbot
```bash
sudo certbot --nginx -d pranshusharma.tech -d www.pranshusharma.tech
```
Certbot automatically installs cron job for auto-renewals every 60 days.

### Step 3: Check Service Status
```bash
sudo systemctl status smart-bus.service
sudo journalctl -u smart-bus.service -f
```

---

## 5. Automated SQLite Database Backups

Add a daily cron job to back up the database safely without downtime:
```bash
sudo crontab -e
```
Add the following line (backs up daily at 03:00 AM UTC):
```bash
0 3 * * * sqlite3 /home/ubuntu/bus-project/backend/data/app.db ".backup '/home/ubuntu/bus-project/backend/data/app_backup_$(date +\%F).db'"
```

---

## 6. Zero-Downtime Rolling Updates

When pushing code changes to GitHub `origin main`:
```bash
cd /home/ubuntu/bus-project
git pull origin main
cd frontend && npm run build && cd ..
cp -r frontend/out/* backend/static/
sudo systemctl restart smart-bus.service
```
Service restart takes under 1.2 seconds with no data loss.

# Domain & Deployment Guide: pranshusharma.tech

This guide provides the complete setup for running **Smart Public Bus Tracking** in production on `pranshusharma.tech`, with the **Next.js frontend on Vercel** and the **FastAPI backend on AWS EC2** behind Caddy with automatic TLS.

---

## 1. Architecture Topology

```
                              ┌─────────────────────────────────────────┐
                              │ DNS Registrar / Cloudflare DNS          │
                              │ (pranshusharma.tech)                    │
                              └────────────────────┬────────────────────┘
                                                   │
                   ┌───────────────────────────────┴───────────────────────────────┐
                   │                                                               │
                   ▼                                                               ▼
       [ pranshusharma.tech ]                                          [ api.pranshusharma.tech ]
       [ www.pranshusharma.tech ]                                                  │
                   │                                                               │
                   ▼                                                               ▼
        ┌───────────────────────┐                                       ┌──────────────────────┐
        │   Vercel Edge Network │                                       │     AWS EC2 (EIP)    │
        │   (Next.js Frontend)  │                                       │                      │
        │   Automatic SSL/TLS   │                                       │ ┌──────────────────┐ │
        └───────────────────────┘                                       │ │ Caddy (TLS 443)  │ │
                                                                        │ └────────┬─────────┘ │
                                                                        │          │ :8000     │
                                                                        │ ┌────────▼─────────┐ │
                                                                        │ │ FastAPI Uvicorn  │ │
                                                                        │ └──────────────────┘ │
                                                                        │ ┌──────────────────┐ │
                                                                        │ │ Simulator Daemon │ │
                                                                        │ └──────────────────┘ │
                                                                        └──────────────────────┘
```

---

## 2. DNS Records Configuration

Add these DNS records at your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.).

> **Important**: If using Cloudflare, set Proxy status to **DNS Only** (gray cloud) for `api` so that Caddy can complete the Let's Encrypt HTTP-01 challenge directly.

| Type | Name | Target / Value | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` | `76.76.21.21` | Auto / 300 | Vercel Apex Domain |
| **CNAME** | `www` | `cname.vercel-dns.com` | Auto / 300 | Vercel WWW Subdomain |
| **A** | `api` | `<YOUR_AWS_ELASTIC_IP>` | Auto / 300 | AWS EC2 Backend API |
| **CNAME** | `resend._domainkey` | `resend._domainkey.pranshusharma.tech` | Auto | Resend DKIM Email signing |
| **TXT** | `@` | `v=spf1 include:amazonses.com ~all` | Auto | SPF Record for OTP emails |
| **TXT** | `_dmarc` | `v=DMARC1; p=none;` | Auto | DMARC Record for email inboxing |

---

## 3. Frontend Deployment on Vercel

1. Log into [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Import the GitHub repository: `PRANSHUSHARMA01/Bus-project`.
3. Configure the Project:
   * **Root Directory**: `frontend`
   * **Framework Preset**: Next.js
   * **Build Command**: `next build`
   * **Output Directory**: `.next`
4. Add **Environment Variables**:
   ```ini
   NEXT_PUBLIC_API_URL=https://api.pranshusharma.tech
   NEXT_PUBLIC_BACKEND_URL=https://api.pranshusharma.tech
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```
5. Click **Deploy**.
6. Once deployed, navigate to **Settings** → **Domains**:
   * Add `pranshusharma.tech`.
   * Add `www.pranshusharma.tech` (select "Redirect to pranshusharma.tech").
   * Vercel will verify the DNS A and CNAME records and issue an SSL certificate in ~60 seconds.

---

## 4. Backend Deployment on AWS EC2

### A. Instance & Elastic IP
1. Launch an EC2 instance:
   * **AMI**: Ubuntu 24.04 LTS (x86_64)
   * **Instance Type**: `t3.small` or `t3.medium` (2 vCPU, 2-4 GB RAM recommended for 193 live simulated buses)
   * **Storage**: 20 GB gp3
2. Allocate an **Elastic IP** in the AWS VPC console and associate it with the EC2 instance.
3. Configure **Security Group** Inbound Rules:
   * `SSH` (port 22): Your IP address
   * `HTTP` (port 80): `0.0.0.0/0` (required for ACME certificate validation)
   * `HTTPS` (port 443): `0.0.0.0/0`

### B. Server Provisioning Script
SSH into the EC2 instance and run:

```bash
# 1. System updates & package installation
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y python3-pip python3-venv git debian-keyring debian-archive-keyring apt-transport-https curl

# 2. Install Caddy Web Server
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install caddy -y

# 3. Clone Repository
cd /home/ubuntu
git clone https://github.com/PRANSHUSHARMA01/Bus-project.git
cd Bus-project/backend

# 4. Setup Python Virtual Environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### C. Systemd Services for Automatic Start & Restart

1. **FastAPI Backend Service (`/etc/systemd/system/smartbus-api.service`)**:
```ini
[Unit]
Description=Smart Bus FastAPI Backend Server
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/Bus-project/backend
ExecStart=/home/ubuntu/Bus-project/backend/venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5
Environment="ALLOWED_ORIGINS=https://pranshusharma.tech,https://www.pranshusharma.tech"
Environment="SUPABASE_URL=https://<your-project>.supabase.co"
Environment="SUPABASE_JWT_SECRET=<your-supabase-jwt-secret>"

[Install]
WantedBy=multi-user.target
```

2. **Bus Fleet Simulator Service (`/etc/systemd/system/smartbus-sim.service`)**:
```ini
[Unit]
Description=Smart Bus Dense Fleet Simulator
After=smartbus-api.service

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/Bus-project/backend
ExecStart=/home/ubuntu/Bus-project/backend/venv/bin/python simulator.py --api http://127.0.0.1:8000 --hour 9
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

3. **Caddy Reverse Proxy (`/etc/caddy/Caddyfile`)**:
```bash
sudo cp /home/ubuntu/Bus-project/backend/Caddyfile /etc/caddy/Caddyfile
sudo systemctl daemon-reload
sudo systemctl enable --now smartbus-api smartbus-sim caddy
```

---

## 5. Supabase Auth Production Settings

1. In **Supabase Dashboard** → **Authentication** → **URL Configuration**:
   * **Site URL**: `https://pranshusharma.tech`
   * **Redirect URLs**:
     * `https://pranshusharma.tech/**`
     * `https://www.pranshusharma.tech/**`
     * `http://localhost:3000/**` (for local development)
2. In **Providers** → **Google**:
   * Ensure `https://pranshusharma.tech` is added under Authorized Javascript Origins in Google Cloud Console.

---

## 6. Verification Commands

Run these terminal commands to verify end-to-end connectivity and SSL certificates:

```bash
# 1. Verify Vercel DNS Resolution
dig +short A pranshusharma.tech
# Output should return: 76.76.21.21

# 2. Verify EC2 Backend DNS Resolution
dig +short A api.pranshusharma.tech
# Output should return: <YOUR_AWS_ELASTIC_IP>

# 3. Test Backend Health & SSL Certificate
curl -I https://api.pranshusharma.tech/health
# Expected: HTTP/2 200 OK, strict-transport-security, server: Caddy

# 4. Test Live Fleet Endpoint
curl https://api.pranshusharma.tech/buses/live | jq 'length'
# Expected: 193 (live active buses)

# 5. Test Multi-Bus Trip Planner
curl "https://api.pranshusharma.tech/v1/trips/plan?from_stop_id=35&to_stop_id=6" | jq '.options[0].route_name'
```

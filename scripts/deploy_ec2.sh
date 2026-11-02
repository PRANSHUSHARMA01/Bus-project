#!/usr/bin/env bash
# ==============================================================================
# Single-Server Deployment Script for AWS EC2 (Ubuntu 22.04 / 24.04 LTS)
# Target Domain: https://pranshusharma.tech
# Application: Smart Public Bus Tracking (FastAPI + Next.js Single-Origin)
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo " Starting Smart Public Bus Production Single-Server Deploy"
echo " Target Domain: https://pranshusharma.tech"
echo "=========================================================="

APP_DIR="/home/ubuntu/bus-project"

# 1. Update OS packages
echo "--> Updating system packages..."
sudo apt-get update -y
sudo apt-get install -y git curl ufw ca-certificates gnupg python3 python3-pip python3-venv nginx certbot python3-certbot-nginx

# 2. Install Node.js 20 LTS (for building frontend static export)
if ! command -v node &> /dev/null; then
    echo "--> Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 3. Setup Python virtual environment
echo "--> Setting up Python 3 virtual environment..."
cd "$APP_DIR"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

# 4. Build Next.js frontend static export
echo "--> Building frontend Next.js static export..."
cd "$APP_DIR/frontend"
npm ci --prefer-offline
npm run build

# 5. Sync frontend/out static files to backend/static/
echo "--> Synchronizing static assets into backend/static/..."
cd "$APP_DIR"
mkdir -p backend/static
cp -r frontend/out/* backend/static/

# 6. Ensure persistent database directory
mkdir -p backend/data
sudo chown -R ubuntu:ubuntu "$APP_DIR"

# 7. Install and enable systemd services
echo "--> Installing systemd services (Backend API & Fleet Simulator)..."
sudo cp systemd/smart-bus.service /etc/systemd/system/smart-bus.service
sudo cp systemd/smart-bus-sim.service /etc/systemd/system/smart-bus-sim.service
sudo systemctl daemon-reload
sudo systemctl enable smart-bus.service smart-bus-sim.service
sudo systemctl restart smart-bus.service smart-bus-sim.service

# 8. Setup Nginx Reverse Proxy
echo "--> Configuring Nginx reverse proxy..."
if [ ! -f /etc/letsencrypt/live/pranshusharma.tech/fullchain.pem ]; then
    echo "--> Creating initial bootstrap certificate for Nginx startup..."
    sudo mkdir -p /etc/letsencrypt/live/pranshusharma.tech
    sudo openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
        -keyout /etc/letsencrypt/live/pranshusharma.tech/privkey.pem \
        -out /etc/letsencrypt/live/pranshusharma.tech/fullchain.pem \
        -subj "/CN=pranshusharma.tech"
fi
sudo cp nginx/smart-bus.conf /etc/nginx/sites-available/smart-bus.conf
sudo ln -sf /etc/nginx/sites-available/smart-bus.conf /etc/nginx/sites-enabled/smart-bus.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 9. Configure UFW Firewall
echo "--> Configuring firewall (SSH, HTTP, HTTPS)..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 10. Issue Let's Encrypt SSL certificate (if DNS points to this EC2 instance)
echo "--> Testing Let's Encrypt SSL certificate acquisition..."
echo "To issue SSL certificate, run:"
echo "sudo certbot --nginx -d pranshusharma.tech -d www.pranshusharma.tech"

echo "=========================================================="
echo " DEPLOYMENT COMPLETE! Status check:"
sudo systemctl status smart-bus.service --no-pager
echo "=========================================================="

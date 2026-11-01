#!/usr/bin/env bash
# ==============================================================================
# Idempotent AWS EC2 Setup Script for Smart Public Bus Tracking Backend
# OS: Ubuntu 22.04 LTS / 24.04 LTS (x86_64 or ARM64 / Graviton)
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo " Starting Smart Bus Tracking AWS EC2 Production Setup"
echo "=========================================================="

# 1. Update system packages
echo "--> Updating apt packages..."
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release ufw git

# 2. Configure Firewall (UFW)
echo "--> Hardening firewall (UFW)..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP (Caddy Let\'s Encrypt)'
sudo ufw allow 443/tcp comment 'HTTPS'
echo "y" | sudo ufw enable

# 3. Install Docker Engine if not present
if ! command -v docker &> /dev/null; then
    echo "--> Installing Docker Engine..."
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker "$USER"
    echo "Docker installed successfully."
else
    echo "--> Docker is already installed."
fi

# 4. Ensure environment configuration exists
if [ ! -f .env ]; then
    if [ -f backend/.env.example ]; then
        echo "--> Creating .env from backend/.env.example..."
        cp backend/.env.example .env
        echo "[WARNING] Please edit .env with your actual SUPABASE_URL and SUPABASE_JWT_SECRET!"
    fi
fi

# 5. Start Production Stack
echo "--> Launching Docker Compose production containers..."
sudo docker compose -f docker-compose.prod.yml up -d --build

echo "=========================================================="
echo " Deployment Complete!"
echo " Containers running:"
sudo docker compose -f docker-compose.prod.yml ps
echo "=========================================================="

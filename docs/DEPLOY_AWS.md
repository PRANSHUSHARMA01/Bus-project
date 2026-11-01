# Production AWS Single-Server Deployment Guide
**Smart Public Bus Tracking — Team Qubits**  
**Target Domain:** `https://pranshusharma.tech`  
**AWS Region:** `ap-south-1` (Mumbai — DPDP Act 2023 India Data Residency Compliant)

---

## 1. Architecture Overview

```
                                  INTERNET
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
           DNS: pranshusharma.tech           DNS: www.pranshusharma.tech
                    │                                 │
                    └────────────────┬────────────────┘
                                     │ (Ports 80 & 443)
                             Elastic IP (EIP)
                                     │
           ┌─────────────────────────▼──────────────────────────┐
           │                     AWS EC2                        │
           │           (Ubuntu 24.04 LTS, t3.small)             │
           │                                                    │
           │   ┌────────────────────────────────────────────┐   │
           │   │         Caddy Reverse Proxy (:80, :443)    │   │
           │   │  - Auto Let's Encrypt TLS Certificate      │   │
           │   │  - HTTP -> HTTPS 301 Redirect              │   │
           │   │  - www -> apex redirect                    │   │
           │   │  - HSTS, CSP, X-Frame-Options headers      │   │
           │   │  - zstd & gzip compression                 │   │
           │   └─────────────────────┬──────────────────────┘   │
           │                         │ proxy (:8000)            │
           │                         ▼                          │
           │   ┌────────────────────────────────────────────┐   │
           │   │      FastAPI Application (Non-root user)   │   │
           │   │  - /api/v1/* (REST API)                    │   │
           │   │  - /ws (Realtime WebSocket)                │   │
           │   │  - /health & /ready                        │   │
           │   │  - / (Serves Static Next.js Frontend)      │   │
           │   │  - SPA Fallback (/activity, /t/*)          │   │
           │   └───────────────┬────────────────────────────┘   │
           │                   │                                │
           │     ┌─────────────┴─────────────┐                  │
           │     ▼                           ▼                  │
           │ ┌───────────────┐       ┌──────────────────────┐   │
           │ │ PostgreSQL 16 │       │ Simulator Background │   │
           │ │ (EBS Volume)  │       │ Container            │   │
           │ └───────┬───────┘       └──────────────────────┘   │
           │         │ Nightly encrypted pg_dump                │
           │         ▼                                          │
           │ ┌───────────────┐                                  │
           │ │ S3 Backup Cron│ ───> AWS S3 Bucket (AES-256)     │
           │ └───────────────┘                                  │
           └────────────────────────────────────────────────────┘
```

**Key Advantages:**
1. **Single Origin:** Zero CORS configuration required in production.
2. **First-Party Cookies:** Refresh and access tokens are `httpOnly`, `Secure`, and `SameSite=Lax`.
3. **No Third-Party Services:** No Vercel, no Supabase, no external vendor lock-in. Everything is self-hosted on your AWS account.
4. **Zero SSH Keys Needed:** Remote management is securely handled via **AWS Systems Manager (SSM) Session Manager**, keeping Port 22 completely closed.

---

## 2. Domain & DNS Configuration (`pranshusharma.tech`)

### Option A: Keeping DNS at your Registrar (Namecheap, GoDaddy, Hostinger, Porkbun)
Once your AWS Elastic IP is allocated (e.g., `13.235.X.X`):
1. Log into your registrar's DNS Management dashboard for `pranshusharma.tech`.
2. Add or edit the following DNS records:
   | Type | Host / Name | Value / Target | TTL | Purpose |
   | :--- | :--- | :--- | :--- | :--- |
   | **A** | `@` (or blank) | `<YOUR_ELASTIC_IP>` | `300` (5 min) | Points apex domain to EC2 Elastic IP |
   | **CNAME** | `www` | `pranshusharma.tech.` | `300` (5 min) | Aliases www to apex (Caddy will redirect) |
3. Allow 5–15 minutes for DNS propagation.

### Option B: Delegating to AWS Route 53
1. Open the **Route 53 Console** -> **Hosted Zones** -> **Create Hosted Zone**.
2. Enter Domain Name: `pranshusharma.tech` -> Public Hosted Zone.
3. Copy the 4 NS records provided by Route 53 (e.g. `ns-xxx.awsdns-xx.com`).
4. Update the Custom Nameservers at your registrar to these 4 AWS NS addresses.
5. In Route 53, create an **A record** for apex pointing to your Elastic IP.

---

## 3. Step-by-Step AWS Console Provisioning

### Step 3.1: Region Selection
- Open the AWS Console and set the region in the top-right navbar to **Asia Pacific (Mumbai) `ap-south-1`**.

### Step 3.2: Create S3 Backup Bucket
1. Go to **S3** -> **Create bucket**.
2. Bucket name: `smartbus-backups-pranshusharma.tech`.
3. Region: `ap-south-1`.
4. Leave **Block all public access** enabled.
5. Under **Default encryption**, choose **Server-side encryption with Amazon S3 managed keys (SSE-S3)**.
6. Click **Create bucket**.
7. In the bucket details -> **Management** tab -> **Lifecycle rules** -> **Create lifecycle rule**:
   - Rule name: `DeleteBackupsAfter30Days`
   - Filter: Apply to all objects
   - Actions: Check **Expire current versions of objects** -> `30` days.
   - Click **Save**.

### Step 3.3: Create IAM Role for EC2
1. Go to **IAM** -> **Roles** -> **Create role**.
2. Trusted entity type: **AWS service** -> Use case: **EC2**.
3. Attach policies:
   - `AmazonSSMManagedInstanceCore` (Allows connecting via browser with no SSH port 22)
   - `CloudWatchAgentServerPolicy` (CloudWatch metrics & logging)
4. Add Inline Policy for S3 Backups & SES sending:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
         "Resource": [
           "arn:aws:s3:::smartbus-backups-pranshusharma.tech",
           "arn:aws:s3:::smartbus-backups-pranshusharma.tech/*"
         ]
       },
       {
         "Effect": "Allow",
         "Action": ["ses:SendEmail", "ses:SendRawEmail"],
         "Resource": "*"
       }
     ]
   }
   ```
5. Name the role: `smartbus-ec2-role` -> **Create role**.

### Step 3.4: Create Security Group
1. Go to **EC2** -> **Security Groups** -> **Create security group**.
2. Name: `smartbus-web-sg`, Description: `Allow inbound HTTP and HTTPS`.
3. Inbound Rules:
   - **Type: HTTP** | Port: `80` | Source: `0.0.0.0/0` (Anywhere-IPv4)
   - **Type: HTTPS** | Port: `443` | Source: `0.0.0.0/0` (Anywhere-IPv4)
   *(Port 22 SSH is intentionally kept closed — AWS SSM is used instead for zero-attack-surface security)*.
4. Click **Create security group**.

### Step 3.5: Launch EC2 Instance
1. Go to **EC2** -> **Instances** -> **Launch instances**.
2. Name: `smartbus-production`.
3. OS: **Ubuntu Server 24.04 LTS (HVM), SSD Volume Type** (64-bit x86).
4. Instance Type: `t3.small` (2 vCPU, 2 GiB RAM) — or `t3.micro` for initial testing.
5. Key pair: Choose **Proceed without a key pair** (we use SSM Session Manager).
6. Network settings:
   - Select existing security group: `smartbus-web-sg`.
7. Configure storage:
   - `30 GiB` gp3 root volume (Encrypted: Yes).
8. Advanced details:
   - **IAM instance profile**: `smartbus-ec2-role`.
   - **User data** (optional automation):
     ```bash
     #!/bin/bash
     apt-get update && apt-get install -y ca-certificates curl gnupg
     install -m 0755 -d /etc/apt/keyrings
     curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
     chmod a+r /etc/apt/keyrings/docker.gpg
     echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
     apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
     systemctl enable docker && systemctl start docker
     mkdir -p /opt/smartbus /var/lib/smartbus/postgres_data
     ```
9. Click **Launch instance**.

### Step 3.6: Allocate & Associate Elastic IP
1. Go to **EC2** -> **Network & Security** -> **Elastic IPs**.
2. Click **Allocate Elastic IP address** -> Region: `ap-south-1` -> **Allocate**.
3. Select the allocated Elastic IP -> **Actions** -> **Associate Elastic IP address**.
4. Choose Instance: Select `smartbus-production` -> Click **Associate**.
5. Note the Public IPv4 address and update your DNS A Record at your registrar.

---

## 4. Deploying the Application on EC2

### Step 4.1: Connect to Instance via AWS SSM
1. In the EC2 console, select `smartbus-production`.
2. Click **Connect** -> Choose **Session Manager** -> Click **Connect**.
3. Switch to root user:
   ```bash
   sudo su -
   cd /opt/smartbus
   ```

### Step 4.2: Clone Repository & Configure Environment
```bash
git clone https://github.com/PRANSHUSHARMA01/Bus-project.git /opt/smartbus
cd /opt/smartbus

# Create production environment file
cp .env.example .env
nano .env # update POSTGRES_PASSWORD, JWT_SECRET, SERVER_PEPPER
```

### Step 4.3: Launch with Docker Compose
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Step 4.4: Verify Automatic TLS & Endpoints
Check container status:
```bash
docker compose -f docker-compose.prod.yml ps
```
Check Caddy certificate issuance:
```bash
docker compose -f docker-compose.prod.yml logs caddy
```
Test health endpoint locally and over HTTPS:
```bash
curl -I http://localhost:8000/health
curl -I https://pranshusharma.tech/health
curl -I https://pranshusharma.tech/api/v1/health
```

---

## 5. Upgrade Path to Amazon RDS PostgreSQL

For massive production scale, the internal Docker PostgreSQL can be migrated to **Amazon RDS for PostgreSQL** in under 5 minutes without changing a single line of application code:
1. Go to **RDS** -> **Create database** -> PostgreSQL 16.
2. Select Multi-AZ deployment for 99.99% availability.
3. Choose instance size (e.g. `db.t4g.medium`).
4. Set VPC Security Group to allow inbound port 5432 from `smartbus-web-sg`.
5. Update `DATABASE_URL` in `/opt/smartbus/.env`:
   ```env
   DATABASE_URL=postgresql://smartbus_admin:<PASSWORD>@<RDS_ENDPOINT>:5432/smartbus_db
   ```
6. In `docker-compose.prod.yml`, comment out the `db` service and re-run:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
7. Run Alembic migrations:
   ```bash
   docker exec -it smartbus-app alembic upgrade head
   ```

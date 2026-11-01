# Production Deployment Guide: AWS EC2 + Supabase + Vercel

This guide walks through deploying the **Smart Public Bus Tracking** stack completely on free-tier / low-cost infrastructure:
- **Frontend:** Vercel (Free tier, edge global CDN)
- **Backend API:** AWS EC2 (`t4g.small` or `t3.micro` free-tier eligible) with Caddy & Docker
- **Database & Auth:** Supabase (Free tier PostgreSQL + GoTrue Auth)
- **Domain & SSL:** DuckDNS (Free dynamic DNS) + Caddy (Automatic Let's Encrypt TLS)

---

## 1. Supabase Setup (Database + Auth)

1. Sign up at [supabase.com](https://supabase.com) and create a new organization/project:
   - **Name:** `delhi-smart-bus`
   - **Region:** `ap-south-1` (Mumbai, India) for lowest latency
2. Under **Project Settings -> API**:
   - Copy **Project URL** (e.g. `https://xyz.supabase.co`)
   - Copy **anon public API key**
   - Copy **JWT Secret** (under API -> JWT Settings)
3. Under **Database -> Connection Pooling**:
   - Copy the PostgreSQL connection URI (port 6543, pooler mode)
4. Execute initial database schema:
   - In Supabase dashboard, open the **SQL Editor**.
   - Paste the contents of [`backend/migrations/001_initial_schema.sql`](../backend/migrations/001_initial_schema.sql) and click **Run**.
   - All tables, indexes, and Row Level Security (RLS) policies are now active.

---

## 2. AWS EC2 Provisioning (Backend)

1. In AWS Management Console, launch an EC2 instance:
   - **AMI:** Ubuntu Server 24.04 LTS (HVM), SSD Volume Type
   - **Architecture:** `arm64` (Graviton2/3) or `x86_64`
   - **Instance Type:** `t4g.small` (free tier eligible for 750 hrs/month) or `t3.micro`
   - **Key Pair:** Select or create your SSH key pair (.pem)
   - **Network Security Group:**
     - Inbound rules:
       - Port 22 (SSH) from your IP
       - Port 80 (HTTP) from `0.0.0.0/0`
       - Port 443 (HTTPS) from `0.0.0.0/0`
2. Connect to your instance via SSH:
   ```bash
   ssh -i your-key.pem ubuntu@<ec2-public-ip>
   ```
3. Clone this repository on the EC2 instance:
   ```bash
   git clone https://github.com/PRANSHUSHARMA01/Bus-project.git
   cd Bus-project
   ```
4. Set up your free domain with [DuckDNS](https://www.duckdns.org):
   - Create a free subdomain: `delhibus.duckdns.org`
   - Point the A-record to your EC2 public IP.
5. Create your `.env` file on EC2:
   ```bash
   nano .env
   ```
   Add the following values:
   ```env
   DOMAIN=delhibus.duckdns.org
   ALLOWED_ORIGINS=https://smart-bus-tracking.vercel.app,http://localhost:3000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_JWT_SECRET=your-32-char-jwt-secret
   SUPABASE_DB_URL=postgresql://postgres.your-id:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```
6. Run the automated provisioning script:
   ```bash
   chmod +x deploy/aws-setup.sh
   ./deploy/aws-setup.sh
   ```
   Caddy will automatically provision a valid Let's Encrypt TLS certificate for your domain.

---

## 3. Vercel Deployment (Frontend)

1. Push your latest code to your GitHub repository:
   ```bash
   git push origin main
   ```
2. In [Vercel](https://vercel.com):
   - Click **Add New Project** and import `PRANSHUSHARMA01/Bus-project`.
   - **Root Directory:** select `frontend`.
   - **Framework Preset:** Next.js.
3. Configure Environment Variables in Vercel:
   | Variable | Value | Description |
   |---|---|---|
   | `NEXT_PUBLIC_BACKEND_URL` | `https://delhibus.duckdns.org` | Your live backend API |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase anon public key |
4. Click **Deploy**. Vercel will build and distribute your frontend globally across edge nodes.

---

## 4. Verification Checklist

- [x] Backend health endpoint: `curl https://delhibus.duckdns.org/health` returns `{"status":"ok"}`.
- [x] Security headers: `curl -I https://delhibus.duckdns.org/health` includes `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`.
- [x] Nearest stops: `curl https://delhibus.duckdns.org/v1/stops/nearest?lat=28.5245&lng=77.1855` returns top 5 stops.
- [x] Frontend PWA: Open frontend URL on mobile, tap "Add to Home Screen".

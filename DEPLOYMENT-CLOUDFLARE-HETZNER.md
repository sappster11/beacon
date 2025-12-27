# Beacon Deployment - Cloudflare + Hetzner VPS

This guide covers deploying Beacon using:
- **Frontend**: Cloudflare Pages
- **Backend + Database**: Your Hetzner VPS

## Benefits of This Setup
- ✅ **Cost-effective**: Use your existing Hetzner VPS (~$5/month)
- ✅ **Fast**: Cloudflare's global CDN
- ✅ **Full control**: Own your data and infrastructure
- ✅ **Scalable**: Easy to upgrade VPS as needed

---

## Part 1: GitHub Setup (Different Account)

### Option A: Use SSH Keys for Different Account

```bash
# Generate new SSH key for your work/different account
ssh-keygen -t ed25519 -C "your-work-email@company.com" -f ~/.ssh/id_ed25519_work

# Add to SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519_work

# Copy public key
cat ~/.ssh/id_ed25519_work.pub
# Copy this and add to GitHub: Settings → SSH Keys
```

### Configure Git for This Repo
```bash
cd /Users/jacob/beacon

# Set user for this repository only
git config user.name "Your Work Name"
git config user.email "your-work-email@company.com"

# Create new remote with SSH
git remote remove origin  # if exists
git remote add origin git@github.com-work:YOUR_USERNAME/beacon.git
```

### Update SSH Config
Create/edit `~/.ssh/config`:
```
# Personal GitHub
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519

# Work/Different GitHub Account
Host github.com-work
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_work
```

### Push to Your Different Account
```bash
# Create repo on your different GitHub account first
# Then push:
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## Part 2: Hetzner VPS Setup

### Prerequisites
- Hetzner VPS with Ubuntu 22.04 or 24.04
- Root or sudo access
- Domain name pointing to your VPS (e.g., api.yourcompany.com)

### Step 1: Connect to Your VPS
```bash
ssh root@your-vps-ip
```

### Step 2: Install Docker & Docker Compose
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

### Step 3: Install Nginx
```bash
apt install nginx certbot python3-certbot-nginx -y
```

### Step 4: Clone Your Repository
```bash
# Create app directory
mkdir -p /opt/beacon
cd /opt/beacon

# Clone your repo (use your different account)
git clone https://github.com/YOUR_USERNAME/beacon.git .

# Or if using SSH:
git clone git@github.com:YOUR_USERNAME/beacon.git .
```

### Step 5: Set Up Environment Variables
```bash
cd /opt/beacon/backend

# Create production .env file
cat > .env << 'EOF'
DATABASE_URL="postgresql://beacon:SECURE_PASSWORD_HERE@postgres:5432/beacon"
JWT_SECRET="GENERATE_RANDOM_STRING_HERE"
ENCRYPTION_KEY="GENERATE_RANDOM_STRING_HERE"
PORT=3001
NODE_ENV=production
FRONTEND_URL="https://your-frontend.pages.dev"
EOF

# Generate secure secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Use output for JWT_SECRET and ENCRYPTION_KEY
```

### Step 6: Create Docker Compose File
The file is already created at `/Users/jacob/beacon/docker-compose.yml` (see below)

### Step 7: Start Services
```bash
cd /opt/beacon

# Build and start containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### Step 8: Run Database Migrations
```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# (Optional) Seed with test data
docker-compose exec backend npx ts-node prisma/seed.ts

# OR clear all data for production
docker-compose exec backend npm run clear:data
```

### Step 9: Configure Nginx
The configuration is at `/opt/beacon/nginx.conf` (see below)

```bash
# Copy nginx config to sites-available
cp /opt/beacon/nginx.conf /etc/nginx/sites-available/beacon

# Enable site
ln -s /etc/nginx/sites-available/beacon /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

### Step 10: Set Up SSL with Let's Encrypt
```bash
# Get SSL certificate (replace with your domain)
certbot --nginx -d api.yourcompany.com

# Auto-renewal is set up automatically
# Test renewal
certbot renew --dry-run
```

### Step 11: Configure Firewall
```bash
# Allow SSH, HTTP, HTTPS
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

---

## Part 3: Cloudflare Pages Deployment

### Step 1: Push Frontend to GitHub
Your code is already ready. Just ensure it's pushed:
```bash
git add .
git commit -m "Ready for Cloudflare deployment"
git push origin main
```

### Step 2: Connect Different GitHub Account to Cloudflare

1. **Log in to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Navigate to "Workers & Pages"

2. **Create New Pages Project**
   - Click "Create application" → "Pages"
   - Click "Connect to Git"
   - Choose "GitHub" and authorize with your **different GitHub account**
   - Select your `beacon` repository

3. **Configure Build Settings**
   - **Project name**: `beacon` (or your preferred name)
   - **Production branch**: `main`
   - **Framework preset**: None (we'll configure manually)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `frontend`

4. **Add Environment Variables**
   - Click "Add variable"
   - **Key**: `VITE_API_URL`
   - **Value**: `https://api.yourcompany.com/api` (your Hetzner backend URL)

5. **Deploy**
   - Click "Save and Deploy"
   - Wait for build to complete (~2 minutes)
   - Your site will be live at `https://beacon-xxx.pages.dev`

### Step 3: Add Custom Domain (Optional)
1. In Cloudflare Pages, go to your project
2. Click "Custom domains"
3. Add your domain (e.g., `app.yourcompany.com`)
4. Cloudflare auto-configures DNS

### Step 4: Update Backend CORS
Update your Hetzner VPS backend environment:
```bash
ssh root@your-vps-ip
cd /opt/beacon/backend

# Edit .env
nano .env
# Change FRONTEND_URL to your Cloudflare Pages URL

# Restart backend
docker-compose restart backend
```

---

## Part 4: Deployment Updates

### Updating Backend (Hetzner VPS)
```bash
ssh root@your-vps-ip
cd /opt/beacon

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run any new migrations
docker-compose exec backend npx prisma migrate deploy
```

### Updating Frontend (Cloudflare Pages)
Just push to GitHub:
```bash
git add .
git commit -m "Update frontend"
git push origin main
```
Cloudflare auto-deploys on every push!

---

## Monitoring & Maintenance

### View Backend Logs
```bash
ssh root@your-vps-ip
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U beacon beacon > backup_$(date +%Y%m%d).sql

# Restore from backup
docker-compose exec -T postgres psql -U beacon beacon < backup_20240101.sql
```

### System Updates
```bash
# Update system packages
apt update && apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

---

## Troubleshooting

### Backend not accessible
```bash
# Check if containers are running
docker-compose ps

# Check backend logs
docker-compose logs backend

# Check nginx
systemctl status nginx
nginx -t
```

### Database connection issues
```bash
# Check postgres container
docker-compose logs postgres

# Connect to database
docker-compose exec postgres psql -U beacon beacon
```

### Frontend can't reach backend
- Verify `VITE_API_URL` in Cloudflare Pages environment variables
- Check CORS: `FRONTEND_URL` in backend `.env`
- Check SSL certificate is valid
- Check nginx is running and configured correctly

### SSL Certificate Issues
```bash
# Check certificate status
certbot certificates

# Renew manually
certbot renew

# Check nginx SSL config
nginx -t
```

---

## Cost Breakdown

**Monthly Costs:**
- Hetzner VPS (CPX11): ~$5/month (2 vCPU, 2GB RAM, 40GB SSD)
- Cloudflare Pages: $0 (Free tier, unlimited requests)
- Domain: ~$10-15/year

**Total: ~$5/month** 🎉

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong DATABASE_URL password
- [ ] Generate unique JWT_SECRET and ENCRYPTION_KEY
- [ ] Enable UFW firewall
- [ ] Set up SSL certificates
- [ ] Keep system updated
- [ ] Regular database backups
- [ ] Monitor logs for suspicious activity

---

## Need Help?

Check these first:
1. Backend logs: `docker-compose logs backend`
2. Nginx logs: `tail -f /var/log/nginx/error.log`
3. Postgres logs: `docker-compose logs postgres`
4. Cloudflare Pages build logs (in dashboard)

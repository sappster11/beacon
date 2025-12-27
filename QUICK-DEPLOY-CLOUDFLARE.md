# Quick Deploy - Cloudflare + Hetzner

## 🚀 30-Minute Deployment Guide

### Prerequisites Checklist
- [ ] Hetzner VPS (Ubuntu 22.04/24.04)
- [ ] Domain name
- [ ] GitHub account (can be different from your current one)
- [ ] Cloudflare account

---

## Step 1: GitHub Setup (5 min)

### Use Different GitHub Account
```bash
cd /Users/jacob/beacon

# Configure Git for this repo with different account
git config user.name "Your Work Name"
git config user.email "work@company.com"

# Generate new SSH key for work account
ssh-keygen -t ed25519 -C "work@company.com" -f ~/.ssh/id_ed25519_work
ssh-add ~/.ssh/id_ed25519_work

# Copy public key and add to GitHub
cat ~/.ssh/id_ed25519_work.pub
```

Add this to `~/.ssh/config`:
```
Host github.com-work
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_work
```

Push to your work GitHub:
```bash
# Create repo on GitHub first, then:
git remote add origin git@github.com-work:YOUR_USERNAME/beacon.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## Step 2: Hetzner VPS Setup (15 min)

### SSH into your VPS
```bash
ssh root@YOUR_VPS_IP
```

### One-Command Setup
```bash
# Install everything
curl -fsSL https://get.docker.com | sh && \
apt install -y docker-compose nginx certbot python3-certbot-nginx git && \
mkdir -p /opt/beacon && \
cd /opt/beacon
```

### Clone and Configure
```bash
# Clone your repo (use your work account)
git clone https://github.com/YOUR_USERNAME/beacon.git .

# Generate secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
DB_PASSWORD=$(openssl rand -base64 32)

# Create .env file
cat > .env << EOF
POSTGRES_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
FRONTEND_URL=https://beacon-TEMP.pages.dev
EOF

# Show secrets (save these!)
echo "=== SAVE THESE SECRETS ==="
cat .env
echo "=========================="
```

### Start Services
```bash
# Start containers
docker-compose up -d

# Wait for health checks
sleep 30

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Check status
docker-compose ps
```

### Configure Nginx
```bash
# Update domain in nginx.conf
sed -i 's/api.yourcompany.com/api.YOUR-DOMAIN.com/g' nginx.conf

# Copy to nginx
cp nginx.conf /etc/nginx/sites-available/beacon
ln -s /etc/nginx/sites-available/beacon /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test and reload
nginx -t && systemctl reload nginx

# Get SSL certificate
certbot --nginx -d api.YOUR-DOMAIN.com

# Enable firewall
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw --force enable
```

**✅ Backend is live at: `https://api.YOUR-DOMAIN.com/api/health`**

---

## Step 3: Cloudflare Pages (10 min)

### Deploy Frontend

1. **Go to Cloudflare Dashboard**
   - https://dash.cloudflare.com
   - Click "Workers & Pages"

2. **Create Pages Project**
   - Click "Create application" → "Pages" → "Connect to Git"
   - Authorize your **work GitHub account**
   - Select `beacon` repository

3. **Configure Build**
   ```
   Framework preset: None
   Build command: npm run build
   Build output directory: dist
   Root directory: frontend
   ```

4. **Add Environment Variable**
   ```
   VITE_API_URL = https://api.YOUR-DOMAIN.com/api
   ```

5. **Deploy**
   - Click "Save and Deploy"
   - Copy your Cloudflare Pages URL (e.g., `https://beacon-abc.pages.dev`)

**✅ Frontend is live at your Cloudflare URL!**

---

## Step 4: Connect Frontend & Backend (2 min)

### Update Backend CORS
```bash
ssh root@YOUR_VPS_IP
cd /opt/beacon

# Update FRONTEND_URL
nano .env
# Change: FRONTEND_URL=https://your-actual-cloudflare-url.pages.dev

# Restart backend
docker-compose restart backend
```

**✅ Everything connected!**

---

## Step 5: Test & Create Admin User

### Test the site
Visit your Cloudflare Pages URL and you should see the landing page.

### Option A: Use test data
```bash
ssh root@YOUR_VPS_IP
docker-compose exec backend npx ts-node prisma/seed.ts
```
Login with: `admin@beacon.com` / `password123`

### Option B: Clean production start
```bash
ssh root@YOUR_VPS_IP
docker-compose exec backend npm run clear:data

# Then create admin via database
docker-compose exec postgres psql -U beacon beacon
```

```sql
-- In psql, create your admin user:
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'your@email.com',
  crypt('your-password', gen_salt('bf')),  -- Use bcrypt
  'Your Name',
  'SUPER_ADMIN',
  NOW(),
  NOW()
);
\q
```

Or hash password first:
```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

---

## 🎉 You're Live!

**Frontend**: Your Cloudflare Pages URL
**Backend**: https://api.YOUR-DOMAIN.com

### Next Steps
- [ ] Change default passwords if using test data
- [ ] Add custom domain to Cloudflare Pages
- [ ] Set up database backups
- [ ] Import real employee data

---

## Updates & Maintenance

### Update Frontend
```bash
# Just push to GitHub
git add .
git commit -m "Update"
git push origin main
# Cloudflare auto-deploys!
```

### Update Backend
```bash
ssh root@YOUR_VPS_IP
cd /opt/beacon
git pull origin main
docker-compose up -d --build
docker-compose exec backend npx prisma migrate deploy
```

### View Logs
```bash
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Backup Database
```bash
docker-compose exec postgres pg_dump -U beacon beacon > backup.sql
```

---

## Costs

**Monthly:**
- Hetzner VPS CPX11: €4.51 (~$5)
- Cloudflare Pages: €0 (Free)
- **Total: ~$5/month** 🎉

---

## Troubleshooting

**Can't access backend:**
```bash
docker-compose ps  # Check if running
docker-compose logs backend  # Check logs
systemctl status nginx  # Check nginx
```

**Frontend can't connect:**
- Check `VITE_API_URL` in Cloudflare Pages env vars
- Check `FRONTEND_URL` in backend `.env`
- Check browser console for CORS errors

**SSL issues:**
```bash
certbot certificates  # Check status
certbot renew  # Renew manually
```

Need help? Check the full guide: `DEPLOYMENT-CLOUDFLARE-HETZNER.md`

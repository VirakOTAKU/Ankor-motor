# Deployment Guide - Angkor Auto

This guide covers deploying your Angkor Auto app to different platforms.

## Environment Variables

Create a `.env` file in your project root (copy from `.env.example`):

```
PORT=3000
NODE_ENV=production
DATABASE_PATH=./cars.db
API_CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=your_super_secret_key
```

### Variable Explanations

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `DATABASE_PATH` | Path to SQLite database | `./cars.db` |
| `API_CORS_ORIGIN` | Allowed CORS origins | `*` |
| `JWT_SECRET` | Secret for future auth (not yet used) | none |

## Deployment Options

### Option 1: Heroku

1. **Install Heroku CLI:**
```bash
npm install -g heroku
```

2. **Login to Heroku:**
```bash
heroku login
```

3. **Create app:**
```bash
heroku create your-app-name
```

4. **Set environment variables:**
```bash
heroku config:set PORT=3000
heroku config:set NODE_ENV=production
heroku config:set DATABASE_PATH=./cars.db
```

5. **Deploy:**
```bash
git push heroku main
```

6. **View logs:**
```bash
heroku logs --tail
```

### Option 2: Railway.app (Easiest)

1. **Go to:** https://railway.app
2. **Sign up** with GitHub
3. **Click "New Project"** → **Deploy from GitHub repo**
4. **Select your repository**
5. **Set environment variables** in dashboard:
   - `PORT=3000`
   - `NODE_ENV=production`
   - `DATABASE_PATH=./cars.db`
6. **Deploy automatically on push**

### Option 3: DigitalOcean App Platform

1. **Go to:** https://www.digitalocean.com/products/app-platform
2. **Connect GitHub**
3. **Select repository**
4. **Create App** → Set environment variables
5. **Deploy**

### Option 4: AWS (Elastic Beanstalk)

1. **Install AWS CLI:**
```bash
pip install awsebcli
```

2. **Initialize:**
```bash
eb init -p node.js-18 angkor-auto --region us-east-1
```

3. **Create environment:**
```bash
eb create angkor-auto-env
```

4. **Set environment variables:**
```bash
eb setenv PORT=3000 NODE_ENV=production
```

5. **Deploy:**
```bash
eb deploy
```

### Option 5: VPS (Ubuntu Server)

1. **SSH into server:**
```bash
ssh user@your_server_ip
```

2. **Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Clone repository:**
```bash
git clone https://github.com/your-username/angkor-auto.git
cd angkor-auto
```

4. **Install dependencies:**
```bash
npm install
```

5. **Seed database:**
```bash
npm run seed
```

6. **Create `.env` file:**
```bash
nano .env
```
Add your environment variables

7. **Install PM2 (process manager):**
```bash
sudo npm install -g pm2
```

8. **Start app:**
```bash
pm2 start server.js --name "angkor-auto"
pm2 startup
pm2 save
```

9. **Setup Nginx reverse proxy:**
```bash
sudo apt-get install nginx
```

Create `/etc/nginx/sites-available/angkor-auto`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/angkor-auto /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

10. **Setup SSL (Let's Encrypt):**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Database Persistence

### Important: Don't lose your database!

**For cloud deployments:**
- Railway.app: Uses persistent volumes by default
- Heroku: Uses ephemeral file system (data lost on restart!)
- DigitalOcean: Supports persistent volumes
- AWS: Configure RDS for production

**For production, consider migrating to PostgreSQL or MongoDB:**
```bash
npm install pg  # or npm install mongodb
```

Then update `server.js` to use PostgreSQL instead.

## Monitoring

### Check application health:
```bash
curl https://yourdomain.com/health
```

### View logs:
- **Heroku:** `heroku logs --tail`
- **Railway:** Dashboard → Logs
- **VPS with PM2:** `pm2 logs angkor-auto`

## Quick Deployment Summary

| Platform | Difficulty | Cost | Speed |
|----------|-----------|------|-------|
| Heroku | Easy | Free tier (limited) | 5 min |
| Railway | Very Easy | ~$5-10/mo | 5 min |
| DigitalOcean | Medium | $5+/mo | 10 min |
| AWS | Hard | Variable | 15 min |
| VPS (Ubuntu) | Hard | $5+/mo | 30 min |

**Recommendation:** Use **Railway.app** for easiest, fastest deployment!

## After Deployment

1. Update your frontend API endpoint if needed (currently uses relative `/api/cars`)
2. Test admin dashboard at `/` → Profile → Dashboard
3. Add car images via URLs
4. Share your live URL with customers!

## Troubleshooting

**App won't start:**
```bash
npm install
npm run seed
npm start
```

**Database errors:**
- Ensure `cars.db` exists or run `npm run seed`
- Check database permissions on server

**Port conflicts:**
```bash
# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On Linux
lsof -i :3000
kill -9 <PID>
```

**CORS errors:**
Update `.env`:
```
API_CORS_ORIGIN=https://yourdomain.com
```

## Support

For deployment issues, check:
- Platform-specific docs
- PM2 logs: `pm2 logs`
- Node logs: `npm start` (to see errors)

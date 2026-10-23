# 🚀 TIKA Deployment Guide

Panduan lengkap untuk deploy TIKA AI Chatbot di production environment.

## 📋 Pre-deployment Checklist

### ✅ Frontend
- [ ] Build frontend berhasil (`npm run build`)
- [ ] TikaChatbot terintegrasi di Layout dan DashboardLayout
- [ ] Logo "new logo 2.png" tersedia di public/images
- [ ] TikaContext dan TikaProvider berfungsi
- [ ] Debug panel tidak muncul di production (check `import.meta.env.PROD`)

### ✅ Backend
- [ ] TikaController dan routes terdaftar
- [ ] Logging channel 'tika' dikonfigurasi
- [ ] Rate limiting berfungsi
- [ ] Expert model accessible
- [ ] Database connection stable

### ✅ Configuration
- [ ] Environment variables set
- [ ] CORS headers configured
- [ ] Log directory writable
- [ ] File permissions correct

## 🔧 Environment Configuration

### Frontend (.env atau Vite config)
```env
VITE_API_URL=https://yourdomain.com/api
VITE_APP_ENV=production
```

### Backend (.env)
```env
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=info
FRONTEND_URL=https://yourdomain.com

# CORS configuration
SANCTUM_STATEFUL_DOMAINS=yourdomain.com
SESSION_DOMAIN=.yourdomain.com
```

## 📁 File Permissions

Pastikan direktori log dapat ditulis oleh web server:
```bash
chmod 775 storage/logs/
chown -R www-data:www-data storage/logs/
```

## 🚀 Deployment Steps

### 1. Backend Deployment

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
composer install --no-dev --optimize-autoloader

# 3. Clear and cache config
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 4. Run migrations (if any)
php artisan migrate --force

# 5. Set permissions
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 2. Frontend Deployment

```bash
# 1. Install dependencies
npm ci

# 2. Build for production
npm run build

# 3. Deploy dist/ folder to web server
rsync -av dist/ user@server:/path/to/webroot/

# Or if using same server:
cp -r dist/* /var/www/html/
```

### 3. Web Server Configuration

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/html;
    index index.html;

    # Frontend routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API routes
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # TIKA specific rate limiting
    location /api/tika/chat {
        limit_req zone=tika_chat burst=5 nodelay;
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Rate limiting zone
http {
    limit_req_zone $binary_remote_addr zone=tika_chat:10m rate=15r/m;
}
```

#### Apache Configuration
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/html

    # SPA routing
    <Directory /var/www/html>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # API proxy
    ProxyPass /api http://localhost:8000/api
    ProxyPassReverse /api http://localhost:8000/api
</VirtualHost>
```

## 🔍 Health Check

### 1. Backend Health Check
```bash
# Check routes
php artisan route:list --path=tika

# Test basic endpoint
curl -X GET https://yourdomain.com/api/tika/test

# Test chat endpoint
curl -X POST https://yourdomain.com/api/tika/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello TIKA","session_id":"health_check","context":{}}'
```

### 2. Frontend Health Check
- Akses https://yourdomain.com
- Chat button terlihat di pojok kanan bawah
- Klik button → panel chat terbuka
- Ketik pesan → respon dari backend

### 3. Log Check
```bash
# Check TIKA logs
tail -f storage/logs/tika-$(date +%Y-%m-%d).log

# Check Laravel logs
tail -f storage/logs/laravel-$(date +%Y-%m-%d).log
```

## 🔒 Production Security

### 1. Rate Limiting
Pastikan rate limiting aktif:
- API: 15 req/min per IP
- Frontend: 10 msg/min per user
- Web server: Additional layer (Nginx/Apache)

### 2. Input Validation
- Maksimal 500 karakter per message
- Session ID validation
- XSS protection enabled

### 3. Logging Security
- Log rotation enabled (14 hari)
- Log file permissions (644)
- Sensitive data tidak di-log

### 4. CORS Configuration
```php
// config/cors.php
'paths' => ['api/*'],
'allowed_methods' => ['GET', 'POST'],
'allowed_origins' => [env('FRONTEND_URL')],
'allowed_headers' => ['Content-Type', 'Authorization'],
```

## 📊 Monitoring

### 1. Log Monitoring
Setup log monitoring untuk:
- Error rate > 5%
- Response time > 2s
- Rate limit violations
- Unusual traffic patterns

### 2. Performance Monitoring
Monitor:
- API response times
- Chat panel load times
- Expert search performance
- Database query times

### 3. Business Metrics
Track:
- Total conversations
- Expert search queries
- Popular intents
- User engagement

## 🐛 Troubleshooting

### Chat Button Tidak Muncul
```bash
# Check console errors
# Verify TikaChatbot import
# Check TikaProvider wrapping
# Verify build includes components
```

### API 500 Errors
```bash
# Check Laravel logs
tail -f storage/logs/laravel-*.log

# Check database connection
php artisan tinker
>>> \App\Models\Expert::count()

# Check permissions
ls -la storage/logs/
```

### Rate Limiting Issues
```bash
# Check current limits
grep -r "rate" app/Http/Controllers/Api/TikaController.php

# Test rate limit
for i in {1..20}; do curl -X POST ...; done
```

### Expert Search No Results
```bash
# Check database
php artisan tinker
>>> \App\Models\Expert::where('profile_status', 'aktif')->where('verified', true)->count()

# Check field mappings
>>> \App\Models\Expert::where('field', 'like', '%lingkungan%')->count()
```

## 📈 Performance Optimization

### 1. Database
- Index pada `field`, `kriteria`, `profile_status`
- Database connection pooling
- Query optimization

### 2. Caching
```php
// Cache expert search results
Cache::remember("experts_search_{$keyword}", 300, function() {
    // Search logic
});
```

### 3. Frontend
- Lazy load TIKA components
- Debounce message input
- Optimize bundle size

### 4. Server
- Enable gzip compression
- Set proper cache headers
- CDN for static assets

## 🔄 Backup & Recovery

### 1. Database Backup
```bash
# Backup expert data
mysqldump -u user -p database experts > experts_backup.sql

# Backup logs
tar -czf tika_logs_$(date +%Y%m%d).tar.gz storage/logs/tika-*.log
```

### 2. Configuration Backup
```bash
# Backup configurations
tar -czf tika_config_backup.tar.gz \
    app/Http/Controllers/Api/TikaController.php \
    config/logging.php \
    routes/api.php
```

## 📞 Support

Untuk troubleshooting lanjutan:
1. Check Laravel logs dan TIKA logs
2. Verify database connectivity dan expert data
3. Test API endpoints secara manual
4. Monitor server resources (CPU, Memory)
5. Check network connectivity dan CORS

---

🎉 **Selamat! TIKA siap melayani pengguna TenagaAhli.com**
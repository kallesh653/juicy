# How to Update Server After Code Changes

## Quick Update Guide

Follow these steps whenever you make changes to the frontend code and want to deploy them to the live server.

---

## Step 1: Build the Frontend

Open terminal in the frontend folder and run the build command:

```bash
cd "e:\colddrink application final\colddrink1.2\frontend"
npm run build
```

**Wait for build to complete.** You'll see a message like:
```
✓ built in 7m 32s
```

---

## Step 2: Create Deployment Package

Create a tarball (compressed archive) of the built files:

```bash
tar -czf dist-update.tar.gz -C dist .
```

---

## Step 3: Upload to VPS

Upload the package to your server:

```bash
scp -o StrictHostKeyChecking=no dist-update.tar.gz root@72.61.238.39:/root/
```

---

## Step 4: Deploy to Live Server

Connect to server and deploy the files:

```bash
ssh -o StrictHostKeyChecking=no root@72.61.238.39 "cd /root && tar -xzf dist-update.tar.gz && rm -rf /var/www/juicy/* && mkdir -p /var/www/juicy && tar -xzf dist-update.tar.gz -C /var/www/juicy && echo 'Deployment Complete'"
```

---

## Step 5: Update Service Worker Cache (IMPORTANT!)

This ensures users see the new changes immediately without needing to clear browser cache:

```bash
ssh -o StrictHostKeyChecking=no root@72.61.238.39 "sed -i 's/juicy-pos-v[0-9]*/juicy-pos-v$(date +%s)/g' /var/www/juicy/sw.js && systemctl reload nginx && echo 'Cache updated and nginx reloaded'"
```

---

## All-in-One Command (Recommended)

Run all steps at once:

```bash
cd "e:\colddrink application final\colddrink1.2\frontend" && npm run build && tar -czf dist-update.tar.gz -C dist . && scp -o StrictHostKeyChecking=no dist-update.tar.gz root@72.61.238.39:/root/ && ssh -o StrictHostKeyChecking=no root@72.61.238.39 "cd /root && tar -xzf dist-update.tar.gz && rm -rf /var/www/juicy/* && mkdir -p /var/www/juicy && tar -xzf dist-update.tar.gz -C /var/www/juicy && sed -i 's/juicy-pos-v[0-9]*/juicy-pos-v$(date +%s)/g' /var/www/juicy/sw.js && systemctl reload nginx && echo '=== DEPLOYMENT COMPLETE ===' && ls -lh /var/www/juicy/assets/*.js | tail -1"
```

---

## Verify Deployment

After deployment, check your live site:

1. Open: https://juicy.gentime.in
2. Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac) to hard refresh
3. On mobile: Clear browser cache or open in incognito mode

---

## Troubleshooting

### Build Fails with "EBUSY: resource busy or locked"

**Solution:** Close all programs that might be using the dist folder (browsers, file explorers, editors), then try again.

### Changes Not Visible After Deployment

**Solution:** Make sure you ran Step 5 (Update Service Worker Cache). If still not visible:

```bash
ssh -o StrictHostKeyChecking=no root@72.61.238.39 "sed -i 's/juicy-pos-v[0-9]*/juicy-pos-v$(date +%s)/g' /var/www/juicy/sw.js && systemctl reload nginx"
```

Then clear browser cache: `Ctrl+Shift+Delete` → Select "Cached images and files" → Clear

### Check What's Currently Deployed

```bash
ssh -o StrictHostKeyChecking=no root@72.61.238.39 "ls -lh /var/www/juicy/assets/ && cat /var/www/juicy/sw.js | grep CACHE_NAME"
```

---

## Server Details

- **Frontend URL:** https://juicy.gentime.in
- **Backend URL:** https://juicyapi.gentime.in
- **Server IP:** 72.61.238.39
- **Deploy Path:** /var/www/juicy/
- **User:** root

---

## Important Notes

1. Always run Step 5 (service worker cache update) after deployment
2. The build process takes 5-10 minutes - be patient
3. If users still see old version, they need to clear browser cache
4. Service worker cache version updates automatically with timestamp
5. Nginx is configured to not cache JS/CSS files for immediate updates

---

## Quick Reference

**Frontend Build:** `npm run build` (in frontend folder)
**Create Package:** `tar -czf dist-update.tar.gz -C dist .`
**Upload:** `scp dist-update.tar.gz root@72.61.238.39:/root/`
**Deploy:** Extract to `/var/www/juicy/`
**Clear Cache:** Update service worker version and reload nginx

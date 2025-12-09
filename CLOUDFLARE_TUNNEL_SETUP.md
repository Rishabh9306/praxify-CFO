# Cloudflare Tunnel Setup - Complete Guide

## ✅ Setup Complete!

Your backend is now accessible at: **https://api.praxifi.com**

## Tunnel Details

- **Tunnel ID**: `74d09ce1-0c25-4211-bb94-be4b0d64ddff`
- **Public URL**: `https://api.praxifi.com`
- **Local Service**: `http://localhost:8080`
- **Protocol**: HTTP/2
- **DNS Record**: `api.praxifi.com` → `74d09ce1-0c25-4211-bb94-be4b0d64ddff.cfargotunnel.com`

## Files and Configuration

### Configuration File
Location: `/home/draxxy/.cloudflared/config.yml`
```yaml
tunnel: 74d09ce1-0c25-4211-bb94-be4b0d64ddff
credentials-file: /home/draxxy/.cloudflared/74d09ce1-0c25-4211-bb94-be4b0d64ddff.json
protocol: http2

ingress:
  - hostname: api.praxifi.com
    service: http://localhost:8080
  - service: http_status:404
```

### Credentials File
Location: `/home/draxxy/.cloudflared/74d09ce1-0c25-4211-bb94-be4b0d64ddff.json`
⚠️ **Keep this file secret!** It contains your tunnel authentication credentials.

## Starting the Tunnel

### Option 1: Quick Start Script (Recommended)
```bash
cd /home/draxxy/praxify-CFO
./start-cloudflare-tunnel.sh
```

### Option 2: Manual Start (Background)
```bash
nohup cloudflared tunnel --config /home/draxxy/.cloudflared/config.yml run praxifi-backend > cloudflare-tunnel.log 2>&1 &
```

### Option 3: Manual Start (Foreground - for debugging)
```bash
cloudflared tunnel --config /home/draxxy/.cloudflared/config.yml run praxifi-backend
```

## Managing the Tunnel

### Check if Tunnel is Running
```bash
ps aux | grep cloudflared
```

### View Tunnel Logs
```bash
tail -f /home/draxxy/praxify-CFO/cloudflare-tunnel.log
```

### Stop the Tunnel
```bash
pkill -f "cloudflared tunnel"
```

### Check Tunnel Status in Cloudflare Dashboard
Visit: https://one.dash.cloudflare.com/ → Zero Trust → Access → Tunnels

## Testing the Connection

### Test Backend Health
```bash
curl https://api.praxifi.com/
```

Expected response:
```json
{"message":"Welcome to the Agentic CFO Copilot API","documentation":"/docs"}
```

### Test API Documentation
Open in browser: https://api.praxifi.com/docs

## Frontend Configuration

Update your frontend environment variables to use the new API URL:

### For Vercel (Production)
In Vercel dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_API_URL=https://api.praxifi.com
```

### For Local Development
Keep using localhost:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Startup on Boot

### Option 1: Add to Startup Applications (KDE Plasma)
1. Open System Settings → Autostart
2. Click "Add Application"
3. Select `/home/draxxy/praxify-CFO/start-cloudflare-tunnel.sh`

### Option 2: Create a systemd user service (Alternative)
If you want automatic startup, you can create a user service:

```bash
mkdir -p ~/.config/systemd/user
nano ~/.config/systemd/user/cloudflare-tunnel.service
```

Add this content:
```ini
[Unit]
Description=Cloudflare Tunnel for Praxifi Backend
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/cloudflared tunnel --config /home/draxxy/.cloudflared/config.yml run praxifi-backend
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
```

Enable and start:
```bash
systemctl --user enable cloudflare-tunnel.service
systemctl --user start cloudflare-tunnel.service
```

## Troubleshooting

### Tunnel won't connect
- **Check if backend is running**: `curl http://localhost:8080/`
- **Check network connectivity**: Sometimes takes 15-30 seconds to establish connection
- **View detailed logs**: `tail -50 /home/draxxy/praxify-CFO/cloudflare-tunnel.log`

### DNS not resolving
- Wait 5-10 minutes for DNS propagation
- Clear DNS cache: `sudo systemd-resolve --flush-caches`
- Check DNS: `nslookup api.praxifi.com`

### Backend connection refused
- Ensure Docker containers are running: `cd /home/draxxy/praxify-CFO/praxifi-CFO && docker-compose ps`
- Start backend if needed: `docker-compose up -d`

### Tunnel keeps disconnecting
- This is normal! Cloudflare tunnel automatically retries and reconnects
- Check logs for "Registered tunnel connection" messages
- Network timeouts can occur but tunnel recovers automatically

## Security Notes

✅ **Advantages of Cloudflare Tunnel**:
- No need to open ports on your router
- Built-in DDoS protection
- Automatic HTTPS/TLS encryption
- No need for static IP address
- Free for personal/small business use

🔒 **Security Best Practices**:
- Keep credentials file (`74d09ce1-0c25-4211-bb94-be4b0d64ddff.json`) secure
- Never commit credentials to git (already in .gitignore)
- Monitor tunnel access in Cloudflare dashboard
- Use Cloudflare Access for additional authentication if needed

## DNS Records in Cloudflare

The following DNS record has been automatically created:
```
Type: CNAME
Name: api
Target: 74d09ce1-0c25-4211-bb94-be4b0d64ddff.cfargotunnel.com
Proxied: Yes (Orange Cloud)
```

## Next Steps

1. ✅ Tunnel is running and accessible at https://api.praxifi.com
2. Update Vercel environment variables with new API URL
3. Test frontend with production API
4. Add tunnel to startup applications (optional)
5. Monitor tunnel logs for any issues

## Complete Startup Sequence

When you want to run everything:

```bash
# 1. Start the backend
cd /home/draxxy/praxify-CFO/praxifi-CFO
docker-compose up -d

# 2. Start the Cloudflare tunnel
cd /home/draxxy/praxify-CFO
./start-cloudflare-tunnel.sh

# 3. Start the frontend (if testing locally)
cd /home/draxxy/praxify-CFO/praxifi-frontend
pnpm dev
```

## Support

- Cloudflare Tunnel Docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- Tunnel Status: Check logs at `/home/draxxy/praxify-CFO/cloudflare-tunnel.log`
- Backend Status: `curl http://localhost:8080/`
- Public Status: `curl https://api.praxifi.com/`

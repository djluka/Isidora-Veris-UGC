# Video Optimizer - DevBox Deployment

Production deployment configuration for Video Optimizer that integrates with your existing Traefik setup. Features one-command deployment with automated verification and status reporting.

## 🌐 Available Services

After deployment, the following services will be available:

- **Video Optimizer (via Traefik)**: https://video-optimizer.devbox.zone
- **Frontend (direct access)**: http://localhost:8601
- **Backend API (direct access)**: http://localhost:8602

## 🚀 Quick Start

### 1. Prerequisites

- Server with Docker and Docker Compose installed
- **Existing Traefik setup** with external `web` network
- DNS record pointing to your server:
  - `video-optimizer.devbox.zone`
- Traefik configured with SSL certificate resolver

### 2. Deploy (All-in-One)

Run the setup script to deploy and verify everything:

```bash
./setup-devbox.sh
```

This will:
- Verify prerequisites (Docker Compose, networks)
- Deploy both backend and frontend services
- Wait for services to start
- Verify container health and status
- Test backend API availability
- Show deployment status and URLs
- Perform DNS resolution check

### 3. Manual Commands (if needed)

If you prefer manual control:

```bash
# Deploy services
docker compose -f devbox.docker-compose.yml up -d

# Monitor deployment
docker compose -f devbox.docker-compose.yml logs -f

# Check status
docker compose -f devbox.docker-compose.yml ps
```

## 🔐 Security

### SSL Certificates

- SSL certificates handled by your existing Traefik setup
- Uses your existing certificate resolver configuration

### Network Security

- Frontend exposed via existing Traefik with SSL
- Backend remains on internal network only

## 🏗️ Architecture

```
Internet
    ↓
Your Existing Traefik (Port 80/443)
    ↓
┌─────────────────────────────────────────┐
│                                         │
│  🌐 video-optimizer.devbox.zone        │
│      ↓                                  │
│  Frontend Container (Port 80)          │
│      ↓                                  │
│  Backend Container (Port 8000)         │ ← Internal Only
│                                         │
└─────────────────────────────────────────┘
```

### Network Security

- **Frontend**: Exposed via your existing Traefik with SSL AND on port 8601
- **Backend**: Exposed on port 8602 for direct API access
- **Integration**: Uses your existing Traefik configuration and SSL setup
- **Direct Access**: Both services available on localhost ports for development/debugging

## 📁 File Structure

```
video-optimizer/
├── devbox.docker-compose.yml  # Production deployment config
├── setup-devbox.sh           # Setup script
├── backend/                   # Backend application
├── frontend/                  # Frontend application
└── docker-compose.yml         # Development config
```

## 🛠️ Management Commands

### View Logs

```bash
# All services
docker compose -f devbox.docker-compose.yml logs -f

# Specific service
docker compose -f devbox.docker-compose.yml logs -f video-optimizer-frontend
docker compose -f devbox.docker-compose.yml logs -f video-optimizer-backend
```

### Restart Services

```bash
# Restart all services
docker compose -f devbox.docker-compose.yml restart

# Restart specific service
docker compose -f devbox.docker-compose.yml restart video-optimizer-frontend
```

### Update Application

```bash
# Pull latest images and restart
docker compose -f devbox.docker-compose.yml pull
docker compose -f devbox.docker-compose.yml up -d --build
```

### Stop Services

```bash
# Stop all services
docker compose -f devbox.docker-compose.yml down

# Stop and remove volumes (⚠️ This will delete uploaded videos)
docker compose -f devbox.docker-compose.yml down -v
```

## 🔍 Troubleshooting

### Check Service Status

```bash
docker compose -f devbox.docker-compose.yml ps
```

### Re-run Full Deployment Check

```bash
# Run the setup script again to verify everything
./setup-devbox.sh
```

### Check Network Connectivity

```bash
# Test internal backend connectivity
docker exec video-optimizer-frontend curl http://video-optimizer-backend:8000/

# Test backend health directly
docker exec video-optimizer-backend curl http://localhost:8000/
```

### SSL Certificate Issues

SSL certificates are handled by your existing Traefik setup. Check your Traefik logs and configuration if SSL issues occur.

### DNS Issues

Verify DNS resolution:

```bash
nslookup video-optimizer.devbox.zone
nslookup traefik.devbox.zone
nslookup portainer.devbox.zone
```

## 📊 Monitoring

### Traefik Dashboard

Access the Traefik dashboard at https://traefik.devbox.zone to monitor:

- Service health and status
- SSL certificate status
- Request metrics and logs
- Routing configuration

### Portainer

Use Portainer at https://portainer.devbox.zone for:

- Container management
- Resource monitoring
- Log viewing
- Volume management

## 🔄 Backup

### Important Files to Backup

```bash
# Configuration files
cp devbox.docker-compose.yml devbox.docker-compose.yml.backup
cp traefik.yml traefik.yml.backup
cp usersFile usersFile.backup

# SSL certificates
cp acme.json acme.json.backup

# Application data (uploaded/processed videos)
docker run --rm -v video-otpimizer_video_uploads:/data -v $(pwd):/backup alpine tar czf /backup/video_uploads.tar.gz /data
docker run --rm -v video-otpimizer_video_outputs:/data -v $(pwd):/backup alpine tar czf /backup/video_outputs.tar.gz /data
```

### Restore

```bash
# Restore configuration
cp devbox.docker-compose.yml.backup devbox.docker-compose.yml
cp traefik.yml.backup traefik.yml
cp usersFile.backup usersFile
cp acme.json.backup acme.json
chmod 600 acme.json

# Restore application data
docker run --rm -v video-otpimizer_video_uploads:/data -v $(pwd):/backup alpine tar xzf /backup/video_uploads.tar.gz -C /
docker run --rm -v video-otpimizer_video_outputs:/data -v $(pwd):/backup alpine tar xzf /backup/video_outputs.tar.gz -C /
```

## 🎯 Production Recommendations

1. **Change Default Passwords**: Update `usersFile` with strong passwords
2. **Monitor Resources**: Set up monitoring for CPU, memory, and disk usage
3. **Regular Backups**: Implement automated backup of volumes and configuration
4. **Update Strategy**: Plan for regular updates of containers and dependencies
5. **Firewall**: Ensure only ports 80 and 443 are exposed to the internet
6. **Logging**: Consider centralized logging for better troubleshooting

## 🆘 Support

For issues specific to this deployment, check:

1. Container logs for error messages
2. Traefik dashboard for routing issues
3. DNS resolution for domain problems
4. Firewall settings for connectivity issues

For application-specific issues, refer to the main README.md file.

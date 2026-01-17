# Docker Setup Guide for GrindMap

This guide explains how to run GrindMap using Docker for local development.

## 🐳 Why Use Docker?

Docker provides several advantages over traditional local setup:

### **Consistency Across Environments**
- **Traditional:** Different Node.js versions, npm versions, or OS-specific issues can cause "works on my machine" problems
- **Docker:** Everyone runs the exact same environment - same Node version, same dependencies, same configuration

### **Faster Onboarding**
- **Traditional:** Install Node.js → Install npm → Install dependencies → Configure environment → Troubleshoot issues (30+ minutes)
- **Docker:** One command `docker-compose up` and you're running (2-3 minutes)

### **Isolated Dependencies**
- **Traditional:** Project dependencies can conflict with other projects or system packages
- **Docker:** Each project runs in its own isolated container - no conflicts, ever

### **Easy Cleanup**
- **Traditional:** Uninstalling leaves remnants of dependencies, config files, and global packages
- **Docker:** One command `docker-compose down` removes everything cleanly

### **Multi-OS Support**
- **Traditional:** Setup instructions differ for Windows, Mac, and Linux
- **Docker:** Same commands work everywhere - true cross-platform support

### **Production Parity**
- **Traditional:** Development environment differs from production deployment
- **Docker:** Run the same containers in development and production

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) (usually comes with Docker Desktop)

## Quick Start

### 1. Using Docker Compose (Recommended)

Run both frontend and backend with a single command:

```bash
# Start all services
docker-compose up

# Start in detached mode (runs in background)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000

### 2. Building Individual Services

If you want to build services separately:

```bash
# Build all services
docker-compose build

# Build only backend
docker-compose build backend

# Build only frontend
docker-compose build frontend

# Rebuild without cache
docker-compose build --no-cache
```

### 3. Running Individual Containers

#### Backend Only
```bash
cd backend
docker build -t grindmap-backend .
docker run -p 5000:5000 grindmap-backend
```

#### Frontend Only
```bash
cd frontend
docker build -t grindmap-frontend .
docker run -p 3000:3000 grindmap-frontend
```

## Development Workflow

### Hot Reload / Live Updates

The Docker setup includes volume mounting, so changes to your code will automatically reflect in the running containers:

- **Frontend:** React's hot reload will work automatically
- **Backend:** Changes will be reflected after container restart (or use nodemon)

### Installing New Dependencies

If you add new npm packages:

```bash
# Rebuild the affected service
docker-compose build backend  # or frontend

# Restart the service
docker-compose up -d backend  # or frontend
```

### Accessing Container Shell

To debug or inspect a running container:

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh
```

## Useful Commands

```bash
# View running containers
docker-compose ps

# View container logs
docker-compose logs backend
docker-compose logs frontend

# Restart a service
docker-compose restart backend

# Stop and remove containers, networks
docker-compose down

# Remove containers and volumes (cleans everything)
docker-compose down -v

# Pull latest images and rebuild
docker-compose pull
docker-compose up --build
```

## Troubleshooting

### Port Already in Use

If ports 3000 or 5000 are already in use, modify the ports in `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # Change 3001 to any available port
  backend:
    ports:
      - "5001:5000"  # Change 5001 to any available port
```

### Container Won't Start

1. Check logs: `docker-compose logs`
2. Ensure no other services are using the same ports
3. Try rebuilding: `docker-compose build --no-cache`
4. Remove old containers: `docker-compose down -v`

### Changes Not Reflecting

1. Ensure volumes are mounted correctly in `docker-compose.yml`
2. For frontend, check if `CHOKIDAR_USEPOLLING=true` is set
3. Restart the service: `docker-compose restart frontend`

### Permission Issues (Linux/Mac)

If you encounter permission errors:

```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Or run with sudo (not recommended for development)
sudo docker-compose up
```

## Environment Variables

Create `.env` files in frontend/backend directories for environment-specific configurations:

### Backend `.env`
```env
PORT=5000
NODE_ENV=development
```

### Frontend `.env`
```env
REACT_APP_API_URL=http://localhost:5000
PORT=3000
```

## Production Deployment

For production, create optimized builds:

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Or use multi-stage builds (recommended)
```

Consider creating a separate `docker-compose.prod.yml` with:
- Multi-stage builds for smaller images
- Environment variables for production
- No volume mounting
- Health checks
- Resource limits

## Cleaning Up

Remove all GrindMap Docker resources:

```bash
# Stop and remove containers
docker-compose down

# Remove images
docker rmi grindmap-frontend grindmap-backend

# Remove dangling images and volumes
docker system prune -a --volumes
```

## Benefits of Docker Setup

✅ **Consistent Environment:** Everyone runs the same setup  
✅ **Easy Onboarding:** New contributors get started in minutes  
✅ **Isolated Dependencies:** No conflicts with local installations  
✅ **Simple Cleanup:** Remove everything with one command  
✅ **Multi-OS Support:** Works on Windows, Mac, and Linux  

## Notes

- Docker setup is **optional** - traditional `npm install` and `npm start` still work
- Volumes ensure your code changes are reflected immediately
- Network bridge allows frontend and backend to communicate
- Services restart automatically unless stopped manually

---

**Need help?** Open an issue on GitHub or check Docker documentation.

# InterviewAI Deployment Guide

## Multi-Service Architecture

Your application consists of three services that need to run simultaneously:

1. **Frontend (React/Vite)** - Port 3000
2. **Backend (Node.js/Express)** - Port 5000  
3. **Python Server (FastAPI)** - Port 8001
4. **Database (MongoDB)** - Port 27017

## Deployment Options

### Option 1: Docker Compose (Recommended for Development & Production)

**Advantages:**
- All services run together
- Easy to manage dependencies
- Consistent environment
- One-command deployment

**Steps:**
1. Copy `.env.example` to `.env` and fill in your API keys
2. Run: `docker-compose up --build`
3. Access: http://localhost:3000

### Option 2: Railway (Recommended for Production)

Railway supports multi-service deployments in one project.

**Steps:**
1. Connect your GitHub repository to Railway
2. Create separate services for:
   - Frontend (React)
   - Backend (Node.js)
   - Python Server (FastAPI)
3. Add MongoDB database service
4. Configure environment variables for each service

### Option 3: DigitalOcean App Platform

**Steps:**
1. Create a new App in DigitalOcean
2. Add components:
   - Static Site (Frontend)
   - Web Service (Backend)
   - Web Service (Python Server)
   - Database (MongoDB)

### Option 4: Separate Platform Deployment

**Frontend:** Netlify/Vercel (static build)
**Backend:** Heroku/Railway
**Python Server:** Railway/Heroku
**Database:** MongoDB Atlas

## Environment Configuration

### Production Environment Variables

Create `.env.production`:

```env
# Node.js Backend
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
FRONTEND_URL=https://your-frontend-domain.com

# API Keys
GEMINI_API_KEY=your_gemini_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
OPENAI_API_KEY=your_openai_api_key
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
```

### Frontend Environment

```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_PYTHON_API_URL=https://your-python-server-domain.com/api/v1
```

## Port Configuration

- Frontend: 3000
- Backend: 5000
- Python Server: 8001
- MongoDB: 27017

## Health Checks

Each service provides health check endpoints:
- Backend: `GET /api/auth/me`
- Python Server: `GET /health`
- Frontend: Serves static files

## Scaling Considerations

1. **Database**: Use MongoDB Atlas for production
2. **File Storage**: Consider cloud storage (AWS S3, Google Cloud Storage)
3. **Load Balancing**: Use nginx or cloud load balancers
4. **Monitoring**: Add logging and monitoring services

## Troubleshooting

### Common Issues:

1. **Services can't communicate**: Check network configuration in docker-compose
2. **Environment variables not loaded**: Ensure .env file is in correct location
3. **Port conflicts**: Make sure ports are not already in use
4. **Database connection**: Verify MongoDB connection string

### Debug Commands:

```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]

# Rebuild and restart
docker-compose up --build [service-name]
```

## Security Notes

1. Never commit `.env` files to version control
2. Use strong JWT secrets in production
3. Enable CORS only for your frontend domain
4. Use HTTPS in production
5. Regularly update dependencies

## Performance Optimization

1. **Frontend**: Enable gzip compression, use CDN
2. **Backend**: Implement caching, optimize database queries
3. **Python Server**: Use async operations, optimize AI model loading
4. **Database**: Create proper indexes, use connection pooling
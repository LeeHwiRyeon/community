# Python Recommendation Service Setup Guide

## Requirements
- Python 3.8 or higher
- pip (Python package manager)
- MySQL 8.0
- Redis (optional, for caching)

## Installation Steps

### 1. Navigate to recommendation service directory
```bash
cd recommendation-service
```

### 2. Create virtual environment (recommended)
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment variables
```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your configuration
# Update: DB_PASSWORD, REDIS settings if using Redis
```

### 5. Test the service
```bash
python main.py
```

The service should start on `http://localhost:8000`

## Running the Service

### Development Mode (with auto-reload)
```bash
python main.py
```

### Production Mode (with Uvicorn)
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Using Process Manager (PM2)
```bash
# Install PM2 globally (Node.js required)
npm install -g pm2

# Start Python service with PM2
pm2 start main.py --name recommendation-service --interpreter python

# View logs
pm2 logs recommendation-service

# Restart service
pm2 restart recommendation-service
```

## API Endpoints

### Health Check
```
GET http://localhost:8000/
```

### Get Post Recommendations
```
GET http://localhost:8000/api/recommend/posts?user_id=1&limit=10&exclude_viewed=true
```

### Get User Recommendations
```
GET http://localhost:8000/api/recommend/users?user_id=1&limit=10
```

### Get Similar Posts
```
GET http://localhost:8000/api/recommend/similar?post_id=1&limit=10
```

### Refresh Model (Admin)
```
POST http://localhost:8000/api/recommend/refresh
```

### Get Statistics (Admin)
```
GET http://localhost:8000/api/recommend/stats
```

## Testing with Postman or curl

### Example: Get recommendations for user ID 1
```bash
curl "http://localhost:8000/api/recommend/posts?user_id=1&limit=10"
```

### Example: Get similar posts to post ID 1
```bash
curl "http://localhost:8000/api/recommend/similar?post_id=1&limit=10"
```

## Integration with Express Backend

The Express backend (`server-backend`) will proxy requests to this Python service.

### Express Endpoints (after integration):
- `GET /api/recommendations/posts/:userId`
- `GET /api/recommendations/users/:userId`
- `GET /api/recommendations/similar/:postId`
- `POST /api/recommendations/refresh` (Admin only)
- `GET /api/recommendations/stats` (Admin only)
- `GET /api/recommendations/health`

## Troubleshooting

### Python version issues
```bash
# Check Python version
python --version  # Should be 3.8 or higher
```

### MySQL connection issues
- Verify MySQL is running
- Check DB credentials in `.env`
- Ensure `community_platform` database exists

### Redis connection issues
- If Redis is not installed, set `ENABLE_CACHE=false` in `.env`
- Service will work without Redis (no caching)

### Import errors
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

### Port already in use
```bash
# Change port in .env
SERVICE_PORT=8001
```

## Performance Tuning

### Model Update Interval
- Default: 3600 seconds (1 hour)
- Adjust `MODEL_UPDATE_INTERVAL` in `.env`

### Cache TTL
- Default: 3600 seconds (1 hour)
- Adjust `CACHE_TTL` in `.env`

### Number of Recommendations
- Default: 10
- Adjust `TOP_N_ITEMS` in `.env`

### Minimum Interactions
- Default: 5 (cold start threshold)
- Adjust `MIN_INTERACTIONS` in `.env`

## Next Steps

1. ✅ Python service is set up
2. ⏳ Express backend integration (recommendations router)
3. ⏳ Frontend UI components
4. ⏳ Testing and evaluation

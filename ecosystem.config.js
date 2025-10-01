module.exports = {
  "apps": [
    {
      "name": "thenewspaper-backend",
      "script": "./server-backend/api-server/server.js",
      "cwd": "C:\\Users\\hwi\\Desktop\\Projects\\community",
      "instances": 2,
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "development",
        "PORT": 5000,
        "DB_HOST": "localhost",
        "DB_PORT": 3306,
        "REDIS_HOST": "localhost",
        "REDIS_PORT": 6379
      },
      "watch": true,
      "ignore_watch": [
        "node_modules",
        "logs"
      ],
      "max_memory_restart": "2G",
      "error_file": "./logs/backend-error.log",
      "out_file": "./logs/backend-out.log",
      "log_file": "./logs/backend-combined.log",
      "time": true
    },
    {
      "name": "thenewspaper-frontend",
      "script": "npm",
      "args": "start",
      "cwd": "./frontend",
      "instances": 1,
      "env": {
        "NODE_ENV": "development",
        "PORT": 3000,
        "REACT_APP_API_URL": "http://localhost:5000"
      },
      "watch": true,
      "ignore_watch": [
        "node_modules",
        "build"
      ],
      "max_memory_restart": "1G",
      "error_file": "./logs/frontend-error.log",
      "out_file": "./logs/frontend-out.log",
      "log_file": "./logs/frontend-combined.log",
      "time": true
    }
  ]
};
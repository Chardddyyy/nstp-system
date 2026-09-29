/**
 * PM2 Production Cluster Mode Configuration
 * Optimized for High-Concurrency Load Testing (k6 500+ VUs) & High Availability
 *
 * Commands:
 *   pm2 start ecosystem.config.js
 *   pm2 reload ecosystem.config.js --update-env
 *   pm2 status
 *   pm2 logs
 */

module.exports = {
  apps: [
    {
      name: 'nstp-backend-cluster',
      script: './server.js',
      instances: 'max',                 // Distribute across all CPU cores
      exec_mode: 'cluster',             // PM2 clustering load-balancer
      autorestart: true,                // Auto-restart upon any unexpected exit
      watch: false,
      max_memory_restart: '1G',         // Guard against memory leaks under heavy load
      kill_timeout: 5000,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        DB_POOL_LIMIT: 30,
        SKIP_RATE_LIMIT: 'false'
      },
      env_loadtest: {
        NODE_ENV: 'test',
        PORT: 5000,
        DB_POOL_LIMIT: 50,
        SKIP_RATE_LIMIT: 'true'         // Bypass rate limiters specifically during k6 benchmark
      }
    }
  ]
};

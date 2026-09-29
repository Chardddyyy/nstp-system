/**
 * Node.js Native Multi-Core Clustering Runner
 * Uses all available CPU cores to handle massive concurrent traffic (500+ Virtual Users)
 *
 * Usage:
 *   PORT=5000 node cluster.js
 */

const cluster = require('cluster');
const os = require('os');

if (cluster.isPrimary || cluster.isMaster) {
  const numCPUs = os.cpus().length;
  console.log(`================================================================`);
  console.log(` [CLUSTER MASTER] Process PID ${process.pid} running on ${os.platform()}`);
  console.log(` [CLUSTER MASTER] Available CPU Cores: ${numCPUs}`);
  console.log(` [CLUSTER MASTER] Spawning ${numCPUs} worker processes to share incoming load...`);
  console.log(`================================================================`);

  // Fork a worker for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Auto-restart any worker that crashes
  cluster.on('exit', (worker, code, signal) => {
    console.warn(`[CLUSTER ALERT] Worker ${worker.process.pid} terminated (${signal || code}). Auto-respawning replacement...`);
    cluster.fork();
  });
} else {
  // Workers share the same TCP port and socket pool
  require('./server');
  console.log(` [CLUSTER WORKER] Worker process PID ${process.pid} initialized and serving traffic.`);
}

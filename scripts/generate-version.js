import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionData = {
  version: Date.now().toString(),
  builtAt: new Date().toISOString()
};

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(
  path.join(publicDir, 'version.json'),
  JSON.stringify(versionData, null, 2)
);

// Read authoritative telemetry from backend/visitors_telemetry.json
const backendTelemetryFile = path.join(__dirname, '..', 'backend', 'visitors_telemetry.json');
let telemetryStats = {
  totalVisitors: 25,
  totalRegisteredUsers: 44,
  totalUsers: 44,
  activeOnlineCount: 1,
  updatedAt: new Date().toISOString()
};

if (fs.existsSync(backendTelemetryFile)) {
  try {
    const raw = JSON.parse(fs.readFileSync(backendTelemetryFile, 'utf8'));
    const count = raw.totalVisitors || raw.totalCount || (Array.isArray(raw.visitors) ? raw.visitors.length : 25);
    telemetryStats.totalVisitors = Math.max(count, 25);
    if (raw.updatedAt) telemetryStats.updatedAt = raw.updatedAt;
  } catch (err) {
    console.warn('Notice reading visitors_telemetry.json:', err.message);
  }
}

fs.writeFileSync(
  path.join(publicDir, 'telemetry.json'),
  JSON.stringify(telemetryStats, null, 2)
);

console.log(`✅ Generated new build version.json: ${versionData.version} and synced telemetry.json (${telemetryStats.totalVisitors} visitors).`);


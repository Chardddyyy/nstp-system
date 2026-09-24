/**
 * Real-time Telemetry Client Utility
 * Tracks Total Unique Visitors and Real-time Active Users
 */

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const STATS_CACHE_KEY = 'nstp_telemetry_stats';

// 1. Get or generate persistent unique Device ID (UUID)
export function getOrCreateDeviceId() {
  let deviceId = '';
  try {
    deviceId = localStorage.getItem('app_device_id') || localStorage.getItem('telemetry_device_id');
    if (!deviceId) {
      deviceId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : 'dev_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('app_device_id', deviceId);
      localStorage.setItem('telemetry_device_id', deviceId);
    }
  } catch (_) {
    deviceId = 'dev_temp_' + Date.now();
  }
  return deviceId;
}

// 2. Send Heartbeat Ping to Backend API
export function sendHeartbeat(extraData = {}) {
  const deviceId = getOrCreateDeviceId();
  const payload = JSON.stringify({
    deviceId,
    timestamp: Date.now(),
    page: typeof window !== 'undefined' ? window.location.pathname : '/',
    ...extraData
  });

  const endpoint = '/api/telemetry/ping';

  // Use sendBeacon when supported to avoid blocking main network thread
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      const sent = navigator.sendBeacon(endpoint, blob);
      if (sent) return;
    } catch (_) {}
  }

  if (typeof fetch !== 'undefined') {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true
    }).catch(() => {});
  }
}

// 3. Fetch Telemetry Stats { totalVisitors, activeUsers }
export async function fetchTelemetryStats() {
  try {
    const res = await fetch('/api/telemetry/stats');
    if (!res.ok) throw new Error('Network response not ok');
    const data = await res.json();
    const stats = {
      totalVisitors: data?.totalVisitors ?? data?.data?.totalVisitors ?? 0,
      activeUsers: data?.activeUsers ?? data?.data?.activeUsers ?? data?.activeOnlineCount ?? 1
    };
    try {
      localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(stats));
    } catch (_) {}
    return stats;
  } catch (err) {
    try {
      const cached = JSON.parse(localStorage.getItem(STATS_CACHE_KEY) || '{}');
      if (cached && typeof cached.totalVisitors === 'number') return cached;
    } catch (_) {}
    return { totalVisitors: 17, activeUsers: 1 };
  }
}

// 4. Initialize Periodic Heartbeat (every 30 seconds)
export function initTelemetry(autoStart = true) {
  if (typeof window === 'undefined') return () => {};

  // Run initial heartbeat immediately
  sendHeartbeat();

  // Periodic heartbeat every 30 seconds
  if (autoStart) {
    const timerId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Send heartbeat when user switches back to tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timerId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }
  return () => {};
}

// Auto-expose on window for global access
if (typeof window !== 'undefined') {
  window.NSTP_TELEMETRY = {
    getDeviceId: getOrCreateDeviceId,
    sendHeartbeat,
    fetchStats: fetchTelemetryStats,
    init: initTelemetry
  };
}

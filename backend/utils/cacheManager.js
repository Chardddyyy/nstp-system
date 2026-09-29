/**
 * In-Memory High Performance Cache Manager
 * Reduces Aiven Cloud MySQL read operations during peak traffic and polling
 */

class CacheManager {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get cached data if valid and not expired
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Set cached data with TTL in seconds (default 45s)
   * @param {string} key
   * @param {any} data
   * @param {number} ttlSeconds
   */
  set(key, data, ttlSeconds = 45) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000
    });
  }

  /**
   * Invalidate specific key or keys starting with prefix
   * @param {string} prefix
   */
  invalidate(prefix) {
    for (const key of this.cache.keys()) {
      if (key === prefix || key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
  }
}

const memoryCache = new CacheManager();
module.exports = memoryCache;

const metrics = {
  requestCount: 0,
  searchLatency: [],
  cacheHitRate: 0
};

export function trackRequest() {
  metrics.requestCount++;
}

export function trackSearchLatency(startTime) {
  const latency = Date.now() - startTime;
  metrics.searchLatency.push(latency);
  if (metrics.searchLatency.length > 100) metrics.searchLatency.shift();
}

export function getMetrics() {
  return {
    ...metrics,
    avgLatency: metrics.searchLatency.length > 0 
      ? metrics.searchLatency.reduce((a, b) => a + b, 0) / metrics.searchLatency.length
      : 0
  };
} 
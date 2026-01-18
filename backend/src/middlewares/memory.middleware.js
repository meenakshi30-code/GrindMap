export const memoryMonitor = (req, res, next) => {
  const memUsage = process.memoryUsage();
  const memUsedMB = memUsage.heapUsed / 1024 / 1024;
  const memLimitMB = 512; // 512MB limit
  
  if (memUsedMB > memLimitMB) {
    return res.status(503).json({
      error: 'Service temporarily unavailable - high memory usage',
      memoryUsage: `${memUsedMB.toFixed(2)}MB`
    });
  }
  
  next();
};
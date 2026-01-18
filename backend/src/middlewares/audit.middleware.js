import Logger from '../utils/logger.js';

/**
 * Audit logging middleware for tracking user actions
 */
export const auditLogger = (action) => {
  return (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log successful actions only
      if (res.statusCode < 400) {
        Logger.info('User action', {
          correlationId: req.correlationId,
          action,
          user: req.user?.id || 'anonymous',
          request: {
            method: req.method,
            url: req.originalUrl,
            params: req.params,
            ip: req.ip
          },
          response: {
            statusCode: res.statusCode,
            success: data.success
          }
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};
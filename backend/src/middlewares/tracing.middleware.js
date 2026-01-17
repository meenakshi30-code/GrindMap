import { tracer } from '../utils/tracer.util.js';

export const tracingMiddleware = (req, res, next) => {
  const traceId = req.headers['x-trace-id'] || null;
  const { traceId: newTraceId, spanId } = tracer.startTrace(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  req.traceId = traceId || newTraceId;
  req.spanId = spanId;

  // Add trace ID to response headers
  res.setHeader('x-trace-id', req.traceId);

  const originalSend = res.send;
  res.send = function(data) {
    tracer.endSpan(req.traceId, req.spanId, {
      statusCode: res.statusCode,
      responseSize: data ? data.length : 0
    });
    
    tracer.logTrace(req.traceId);
    return originalSend.call(this, data);
  };

  next();
};
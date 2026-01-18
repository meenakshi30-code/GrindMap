import { tracer } from '../utils/tracer.util.js';

export const traceService = (serviceName) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const req = args.find(arg => arg && arg.traceId);
      const traceId = req?.traceId;
      
      if (!traceId) {
        return originalMethod.apply(this, args);
      }

      const spanId = tracer.addSpan(traceId, `${serviceName}.${propertyKey}`, {
        service: serviceName,
        method: propertyKey,
        args: args.length
      });

      try {
        const result = await originalMethod.apply(this, args);
        tracer.endSpan(traceId, spanId, { success: true });
        return result;
      } catch (error) {
        tracer.endSpan(traceId, spanId, { 
          success: false, 
          error: error.message 
        });
        throw error;
      }
    };
    
    return descriptor;
  };
};

export const withTrace = async (traceId, operation, fn) => {
  if (!traceId) return fn();
  
  const spanId = tracer.addSpan(traceId, operation);
  try {
    const result = await fn();
    tracer.endSpan(traceId, spanId, { success: true });
    return result;
  } catch (error) {
    tracer.endSpan(traceId, spanId, { success: false, error: error.message });
    throw error;
  }
};
import { tracer } from '../utils/tracer.util.js';

export const traceRoutes = (app) => {
  // Get specific trace
  app.get('/traces/:traceId', (req, res) => {
    const trace = tracer.getTrace(req.params.traceId);
    if (!trace) {
      return res.status(404).json({ error: 'Trace not found' });
    }
    res.json(trace);
  });

  // Get all active traces (last 100)
  app.get('/traces', (req, res) => {
    const traces = Array.from(tracer.traces.values())
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 100)
      .map(trace => ({
        traceId: trace.traceId,
        operation: trace.operation,
        duration: trace.duration,
        startTime: trace.startTime,
        spanCount: trace.spans.length
      }));
    
    res.json({ traces, total: tracer.traces.size });
  });
};
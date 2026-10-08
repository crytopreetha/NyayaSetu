import { Router, Request, Response } from 'express';
import { db } from '../config/db.js';
import { env } from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  let dbLatencyMs: number | null = null;
  let dbTimestamp: string | null = null;

  try {
    const health = await db.healthCheck();
    if (health.ok) {
      dbStatus = 'connected';
      dbLatencyMs = health.latencyMs;
      dbTimestamp = health.timestamp;
    }
  } catch (err: any) {
    dbStatus = 'error: ' + (err.code || 'connection_failed');
  }

  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'NyayaSetu Backend API',
    version: '1.0.0',
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    components: {
      server: 'operational',
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        dbTime: dbTimestamp,
      },
      aiEngine: env.GEMINI_API_KEY ? 'ready' : 'standby_mode',
      bhashini: env.BHASHINI_API_KEY ? 'ready' : 'standby_mode',
    },
  });
});

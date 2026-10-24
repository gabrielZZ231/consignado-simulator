import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { registerErrorHandler } from './errors/error-handler.js';
import { registerSimulationRoutes } from './routes/simulation.routes.js';
import { authenticate, registerAuthRoutes } from './routes/auth.routes.js';
import { AuthService } from './services/auth.service.js';
import type { SimulationService } from './services/simulation.service.js';

export interface BuildAppOptions {
  logger?: boolean;
  corsOrigin?: string;
  simulationService?: SimulationService;
  authService?: AuthService;
  authRequired?: boolean;
}

export function parseAllowedOrigins(rawOrigin?: string): string[] {
  const configured = rawOrigin ?? process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? process.env.NODE_ENV !== 'test'
  });

  const allowedOrigins = parseAllowedOrigins(options.corsOrigin);

  app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origem não permitida pela política de CORS.'), false);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Cache-Control'],
    credentials: true
  });

  registerErrorHandler(app);
  const authService = options.authService ?? new AuthService();
  const authRequired = options.authRequired ?? process.env.NODE_ENV !== 'test';
  app.register(registerAuthRoutes, { authService });
  app.register(registerSimulationRoutes, {
    simulationService: options.simulationService,
    preHandler: authenticate(authService, authRequired)
  });

  return app;
}

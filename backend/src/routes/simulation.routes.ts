import type { FastifyInstance } from 'fastify';
import { SimulationController } from '../controllers/simulation.controller.js';
import { SimulationService } from '../services/simulation.service.js';
import type { preHandlerHookHandler } from 'fastify';

export interface SimulationRoutesOptions {
  simulationService?: SimulationService;
  preHandler?: preHandlerHookHandler;
}

export async function registerSimulationRoutes(
  app: FastifyInstance,
  options: SimulationRoutesOptions = {}
): Promise<void> {
  const service = options.simulationService ?? new SimulationService();
  const controller = new SimulationController(service);

  const healthHandler = async () => ({
    status: 'ok',
    service: '@consignado-simulator/backend',
    timestamp: new Date().toISOString()
  });

  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  app.post('/api/simulations', { preHandler: options.preHandler }, controller.handleCreateSimulation);
  app.post('/api/simulations/stream', { preHandler: options.preHandler }, controller.handleCreateSimulationStream);
}

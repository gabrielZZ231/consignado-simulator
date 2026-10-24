import { buildApp } from './app.js';

const DEFAULT_PORT = 3333;
const DEFAULT_HOST = '0.0.0.0';

async function startServer(): Promise<void> {
  const rawPort = Number(process.env.PORT);
  const port = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : DEFAULT_PORT;
  const host = process.env.HOST ?? DEFAULT_HOST;

  const app = buildApp();

  try {
    await app.listen({ port, host });
  } catch (error) {
    app.log.error(error, 'Falha ao iniciar o servidor HTTP');
    process.exit(1);
  }
}

void startServer();

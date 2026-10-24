import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './app-error.js';

export interface ErrorResponsePayload {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler(
    (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message
        }));

        const payload: ErrorResponsePayload = {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Os dados enviados são inválidos. Verifique os campos destacados.',
            details
          }
        };

        return reply.status(400).send(payload);
      }

      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          error: {
            code: error.code,
            message: error.message,
            ...(Array.isArray(error.details) ? { details: error.details } : {})
          }
        });
      }

      if ('statusCode' in error && error.statusCode === 400) {
        return reply.status(400).send({
          error: {
            code: 'BAD_REQUEST',
            message: 'Formato de requisição inválido.'
          }
        });
      }

      request.log.error(
        {
          errName: error.name,
          requestId: request.id,
          method: request.method,
          url: request.url
        },
        'Erro inesperado ao processar requisição'
      );

      return reply.status(500).send({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Ocorreu um erro interno inesperado ao processar a simulação.'
        }
      });
    }
  );
}

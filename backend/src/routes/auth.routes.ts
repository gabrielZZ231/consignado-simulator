import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AppError } from '../errors/app-error.js';
import { AuthService, type PublicUser } from '../services/auth.service.js';

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: PublicUser;
    sessionToken?: string;
  }
}

const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1)
});

const userSchema = z.object({
  name: z.string().trim().min(3).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(256),
  role: z.enum(['admin', 'employee'])
});

function extractSessionCookie(request: FastifyRequest): string | undefined {
  return request.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('session='))
    ?.slice('session='.length);
}

export const authenticate =
  (auth: AuthService, required = true) =>
  async (request: FastifyRequest): Promise<void> => {
    const token = extractSessionCookie(request);
    const user = await auth.getUser(token);

    if (!user && required) {
      throw new AppError('Autenticação necessária.', 401, 'UNAUTHORIZED');
    }

    request.currentUser = user ?? undefined;
    request.sessionToken = token;
  };

const adminOnly = async (request: FastifyRequest): Promise<void> => {
  if (request.currentUser?.role !== 'admin') {
    throw new AppError('Acesso restrito a administradores.', 403, 'FORBIDDEN');
  }
};

export async function registerAuthRoutes(
  app: FastifyInstance,
  options: { authService: AuthService }
): Promise<void> {
  const auth = options.authService;

  app.post('/api/auth/login', async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const result = await auth.login(input.email, input.password);
    const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';

    reply.header(
      'Set-Cookie',
      `session=${result.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${secureFlag}`
    );

    return reply.send({ user: result.user });
  });

  app.post('/api/auth/logout', { preHandler: authenticate(auth) }, async (request, reply) => {
    auth.logout(request.sessionToken);
    reply.header('Set-Cookie', 'session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
    return reply.status(204).send();
  });

  app.get('/api/auth/me', { preHandler: authenticate(auth) }, async (request) => ({
    user: request.currentUser
  }));

  app.get(
    '/api/admin/users',
    { preHandler: [authenticate(auth), adminOnly] },
    async () => ({
      users: await auth.listUsers()
    })
  );

  app.post(
    '/api/admin/users',
    { preHandler: [authenticate(auth), adminOnly] },
    async (request, reply) => {
      const input = userSchema.parse(request.body);
      const user = await auth.createUser(input);
      return reply.status(201).send({ user });
    }
  );

  app.patch(
    '/api/admin/users/:id/status',
    { preHandler: [authenticate(auth), adminOnly] },
    async (request) => {
      const { id } = request.params as { id: string };
      const user = await auth.toggleUserStatus(id, request.currentUser!.id);
      return { user };
    }
  );
}

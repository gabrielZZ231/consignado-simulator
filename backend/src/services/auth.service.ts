import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { AppError } from '../errors/app-error.js';

const scrypt = promisify(scryptCallback);
export type UserRole = 'admin' | 'employee';
export type UserStatus = 'active' | 'inactive';
export interface User { id: string; name: string; email: string; role: UserRole; status: UserStatus; passwordHash: string; createdAt: string; }
export type PublicUser = Omit<User, 'passwordHash'>;
interface Session { userId: string; expiresAt: number; }

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}
async function matchesPassword(password: string, stored: string): Promise<boolean> {
  const [salt, saved] = stored.split(':');
  if (!salt || !saved) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(derived, Buffer.from(saved, 'hex'));
}
function toPublic(user: User): PublicUser { const { passwordHash: _passwordHash, ...publicUser } = user; return publicUser; }

export class AuthService {
  private readonly sessions = new Map<string, Session>();
  private readonly filePath: string;
  private users: User[] = [];
  private ready: Promise<void>;
  constructor(filePath = process.env.AUTH_DATA_FILE ?? join(process.cwd(), 'data', 'auth-users.json')) { this.filePath = filePath; this.ready = this.load(); }
  private async load(): Promise<void> {
    try { this.users = JSON.parse(await readFile(this.filePath, 'utf8')) as User[]; } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const email = process.env.AUTH_ADMIN_EMAIL ?? 'admin@consignado.local';
      const password = process.env.AUTH_ADMIN_PASSWORD ?? 'admin123';
      this.users = [{ id: randomUUID(), name: 'Administrador', email, role: 'admin', status: 'active', passwordHash: await hashPassword(password), createdAt: new Date().toISOString() }];
      await this.save();
    }
  }
  private async save(): Promise<void> { await mkdir(dirname(this.filePath), { recursive: true }); await writeFile(this.filePath, JSON.stringify(this.users, null, 2), { mode: 0o600 }); }
  async login(email: string, password: string): Promise<{ token: string; user: PublicUser }> { await this.ready; const user = this.users.find((item) => item.email === email.toLowerCase()); if (!user || !(await matchesPassword(password, user.passwordHash)) || user.status !== 'active') throw new AppError('E-mail ou senha inválidos.', 401, 'INVALID_CREDENTIALS'); const token = randomBytes(32).toString('base64url'); this.sessions.set(token, { userId: user.id, expiresAt: Date.now() + 1000 * 60 * 60 * 8 }); return { token, user: toPublic(user) }; }
  async getUser(token?: string): Promise<PublicUser | null> { await this.ready; if (!token) return null; const session = this.sessions.get(token); if (!session || session.expiresAt < Date.now()) { this.sessions.delete(token); return null; } const user = this.users.find((item) => item.id === session.userId); return user?.status === 'active' ? toPublic(user) : null; }
  logout(token?: string): void { if (token) this.sessions.delete(token); }
  async listUsers(): Promise<PublicUser[]> { await this.ready; return this.users.map(toPublic); }
  async createUser(input: { name: string; email: string; password: string; role: UserRole }): Promise<PublicUser> { await this.ready; const email = input.email.toLowerCase(); if (this.users.some((user) => user.email === email)) throw new AppError('Já existe um usuário com este e-mail.', 409, 'EMAIL_IN_USE'); const user: User = { id: randomUUID(), name: input.name, email, role: input.role, status: 'active', passwordHash: await hashPassword(input.password), createdAt: new Date().toISOString() }; this.users.push(user); await this.save(); return toPublic(user); }
  async toggleUserStatus(id: string, currentUserId: string): Promise<PublicUser> { await this.ready; if (id === currentUserId) throw new AppError('Não é permitido desativar a própria sessão.', 400, 'SELF_STATUS_CHANGE'); const user = this.users.find((item) => item.id === id); if (!user) throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND'); user.status = user.status === 'active' ? 'inactive' : 'active'; await this.save(); return toPublic(user); }
}

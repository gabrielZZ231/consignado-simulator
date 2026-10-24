import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('App — autenticação no backend', () => {
  it('entra pelo endpoint autenticado e apresenta o simulador', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ user: { id: 'admin', name: 'Admin', email: 'admin@consignado.local', role: 'admin', status: 'active', createdAt: '2026-01-01' } }) } as Response).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ users: [] }) } as Response);
    render(<App />);
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'senha-segura' } });
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /simular agora/i })).toBeDefined());
  });
});

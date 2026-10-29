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

  it('desativa usuário pelo endpoint PATCH sem enviar Content-Type JSON com corpo vazio', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: { id: 'admin', name: 'Admin', email: 'admin@consignado.local', role: 'admin', status: 'active', createdAt: '2026-01-01' }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          users: [
            { id: 'admin', name: 'Admin', email: 'admin@consignado.local', role: 'admin', status: 'active', createdAt: '2026-01-01' },
            { id: 'emp-1', name: 'Maria', email: 'maria@consignado.local', role: 'employee', status: 'active', createdAt: '2026-01-01' }
          ]
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: { id: 'emp-1', name: 'Maria', email: 'maria@consignado.local', role: 'employee', status: 'inactive', createdAt: '2026-01-01' }
        })
      } as Response);

    render(<App />);
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'senha-segura' } });
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() => expect(screen.getAllByRole('button', { name: /^acessos$/i }).length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByRole('button', { name: /^acessos$/i })[0]);

    fireEvent.click(screen.getByRole('button', { name: /desativar/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /^ativar$/i })).toBeDefined());
    const patchCall = fetchSpy.mock.calls.find(([url]) => String(url).includes('/api/admin/users/emp-1/status'));
    expect(patchCall?.[1]?.method).toBe('PATCH');
    expect((patchCall?.[1]?.headers as Record<string, string>)?.['Content-Type']).toBeUndefined();
  });
});

import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { DEFAULT_ACCESS_HINT_DURATION_MS } from './components/Header';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('App — autenticação demonstrativa, tela inicial no Simulador e dica do botão Acessos', () => {
  it('inicia na tela do Simulador exibir o box explicativo apontando para Acessos, permite fechar antes ou navegar para Acessos', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /entrar na plataforma/i })).toBeDefined();
    expect(screen.queryByText(/Credencial inicial de demonstração/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Simular agora/i })).toBeDefined();
    });
    expect(screen.queryByRole('heading', { name: /gerenciamento de acessos/i })).toBeNull();

    const hintDialog = screen.getByRole('dialog', { name: /Dica sobre o botão Acessos/i });
    expect(hintDialog).toBeDefined();
    expect(
      within(hintDialog).getByText(
        /para cadastrar funcionários e ativar ou desativar contas da equipe/i
      )
    ).toBeDefined();

    fireEvent.click(within(hintDialog).getByRole('button', { name: /Entendi/i }));
    expect(screen.queryByRole('dialog', { name: /Dica sobre o botão Acessos/i })).toBeNull();

    const bannerHeader = screen.getByRole('banner');
    expect(within(bannerHeader).queryByText(/Tabela Price/i)).toBeNull();
    expect(within(bannerHeader).queryByText(/Projeto Demonstrativo Independente/i)).toBeNull();
    expect(within(bannerHeader).queryByText(/Demo Técnica/i)).toBeNull();
    expect(screen.queryByText(/Simulação Fictícia Independente/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Acessos/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /gerenciamento de acessos/i })).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText(/nome completo/i), {
      target: { value: 'Ana Funcionária' }
    });
    fireEvent.change(screen.getByLabelText(/e-mail corporativo/i), {
      target: { value: 'ana@octafin.demo' }
    });
    fireEvent.change(screen.getByLabelText(/senha temporária/i), {
      target: { value: 'senha123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /criar acesso/i }));

    await waitFor(() => {
      expect(screen.getByText('Ana Funcionária')).toBeDefined();
      expect(screen.getByText('ana@octafin.demo')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Desativar' }));
    expect(screen.getByText('Inativo')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Ativar' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Ativar' }));
    fireEvent.click(screen.getByRole('button', { name: /Sair/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /entrar na plataforma/i })).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'ana@octafin.demo' }
    });
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'senha123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() => {
      expect(screen.getByText('Ana Funcionária')).toBeDefined();
    });
    expect(screen.queryByRole('button', { name: /Acessos/i })).toBeNull();
    expect(screen.queryByRole('dialog', { name: /Dica sobre o botão Acessos/i })).toBeNull();
  });

  it('oculta automaticamente o box explicativo do botão Acessos após alguns segundos', () => {
    vi.useFakeTimers();
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    expect(screen.getByRole('dialog', { name: /Dica sobre o botão Acessos/i })).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(DEFAULT_ACCESS_HINT_DURATION_MS + 100);
    });

    expect(screen.queryByRole('dialog', { name: /Dica sobre o botão Acessos/i })).toBeNull();
  });
});

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SimulatorPage } from './SimulatorPage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

interface ManualSseStreamController {
  stream: ReadableStream<Uint8Array>;
  sendEvent: (event: string, data: unknown) => void;
  close: () => void;
}

function createManualSseStream(): ManualSseStreamController {
  const encoder = new TextEncoder();
  let streamController!: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller;
    }
  });

  return {
    stream,
    sendEvent: (event, data) => {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      streamController.enqueue(encoder.encode(payload));
    },
    close: () => {
      streamController.close();
    }
  };
}

const META_EVENT_DATA = {
  simulationId: 'sim-stream-123',
  createdAt: '2026-10-23T12:00:00.000Z',
  disclaimer: 'Simulação estritamente fictícia.',
  inputSummary: {
    requestedAmount: 10000,
    installments: 24
  },
  banks: [
    { bankCode: 'banco-alfa', bankName: 'Banco Alfa' },
    { bankCode: 'banco-beta', bankName: 'Banco Beta' }
  ]
};

describe('SimulatorPage — Redesign UI/UX OctaFin e Resultados Progressivos via SSE', () => {
  it('renderiza o Header, DemoBanner, estado inicial, seções do formulário e regras dos bancos', () => {
    render(<SimulatorPage />);

    expect(screen.getByText(/Simulador de Consignado CLT/i)).toBeDefined();
    expect(
      screen.getByText(
        /Ambiente fictício de demonstração\. Nenhuma consulta real de crédito é realizada\./i
      )
    ).toBeDefined();

    expect(screen.getByText(/Dados pessoais/i)).toBeDefined();
    expect(screen.getByText(/Dados profissionais \/ convênio/i)).toBeDefined();
    expect(screen.getAllByText(/Parâmetros da simulação/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Nenhuma simulação realizada ainda\./i)).toBeDefined();
    expect(screen.getByText(/Regras fictícias configuradas nos bancos/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Simular agora/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Limpar campos/i })).toBeDefined();
  });

  it('preenche os campos nos 5 cenários rápidos sem enviar automaticamente e permite limpar os campos', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<SimulatorPage />);

    const scenarios = [
      { button: /Aprovar nos dois bancos/i, expectedEmail: 'maria.oliveira@exemplo.com.br' },
      { button: /Aprovar Alfa \/ Reprovar Beta/i, expectedEmail: 'carlos.santos@exemplo.com.br' },
      { button: /Reprovar Alfa \/ Aprovar Beta/i, expectedEmail: 'fernanda.costa@exemplo.com.br' },
      {
        button: /Falha no Alfa \/ Sucesso no Beta/i,
        expectedEmail: 'roberto+erro-alfa@exemplo.com.br'
      },
      {
        button: /Sucesso no Alfa \/ Timeout no Beta/i,
        expectedEmail: 'juliana+timeout-beta@exemplo.com.br'
      }
    ];

    const emailInput = screen.getByLabelText(/E-mail/i) as HTMLInputElement;

    for (const scenario of scenarios) {
      fireEvent.click(screen.getByRole('button', { name: scenario.button }));
      expect(emailInput.value).toBe(scenario.expectedEmail);
    }

    expect(fetchSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Limpar campos/i }));
    expect(emailInput.value).toBe('');
  });

  it('renderiza 2 skeletons após meta, substitui apenas o Alfa quando ele responde primeiro e finaliza quando o Beta e complete chegam', async () => {
    const manualStream = createManualSseStream();

    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      body: manualStream.stream
    } as Response);

    render(<SimulatorPage />);

    fireEvent.click(screen.getByRole('button', { name: /Aprovar nos dois bancos/i }));
    fireEvent.click(screen.getByRole('button', { name: /Simular agora/i }));

    await act(async () => {
      manualStream.sendEvent('meta', META_EVENT_DATA);
    });

    await waitFor(() => {
      expect(screen.getByText('sim-stream-123')).toBeDefined();
    });

    expect(screen.getByLabelText('Consultando Banco Alfa')).toBeDefined();
    expect(screen.getByLabelText('Consultando Banco Beta')).toBeDefined();
    expect(screen.getByText(/Consultando 2 instituição\(ões\)\.\.\./i)).toBeDefined();
    expect(screen.queryByLabelText(/Resumo quantitativo/i)).toBeNull();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const requestInit = mockFetch.mock.calls[0]?.[1];
    const sentBody = JSON.parse(String(requestInit?.body));
    expect(sentBody.cpf).toBe('52998224725');
    expect(sentBody.cnpj).toBe('11222333000181');

    await act(async () => {
      manualStream.sendEvent('bank-result', {
        simulationId: 'sim-stream-123',
        result: {
          bankCode: 'banco-alfa',
          bankName: 'Banco Alfa',
          status: 'approved',
          monthlyInterestRate: 0.0175,
          installmentAmount: 513.86,
          approvedAmount: 10000,
          installments: 24,
          totalAmount: 12332.64,
          message: 'Proposta aprovada nas regras fictícias do Banco Alfa.',
          reasonCode: 'APPROVED',
          responseTimeMs: 90
        }
      });
    });

    await waitFor(() => {
      expect(screen.queryByLabelText('Consultando Banco Alfa')).toBeNull();
      expect(screen.getByLabelText('Resultado do Banco Alfa')).toBeDefined();
    });

    expect(screen.getByLabelText('Consultando Banco Beta')).toBeDefined();
    expect(screen.getByText(/Consultando 1 instituição\(ões\)\.\.\./i)).toBeDefined();
    expect(screen.getByLabelText(/Resumo quantitativo/i)).toBeDefined();

    await act(async () => {
      manualStream.sendEvent('bank-result', {
        simulationId: 'sim-stream-123',
        result: {
          bankCode: 'banco-beta',
          bankName: 'Banco Beta',
          status: 'rejected',
          monthlyInterestRate: null,
          installmentAmount: null,
          approvedAmount: null,
          installments: null,
          totalAmount: null,
          message: 'Prazo fora da faixa fictícia do Banco Beta.',
          reasonCode: 'TERM_OUT_OF_RANGE',
          responseTimeMs: 210
        }
      });
      manualStream.sendEvent('complete', {
        simulationId: 'sim-stream-123',
        completedAt: '2026-10-23T12:00:01.000Z',
        resultsCount: 2
      });
      manualStream.close();
    });

    await waitFor(() => {
      expect(screen.queryByLabelText('Consultando Banco Beta')).toBeNull();
      expect(screen.getByLabelText('Resultado do Banco Beta')).toBeDefined();
      expect(screen.getByText(/Consulta concluída\./i)).toBeDefined();
    });

    expect(screen.getByText('Aprovado (Simulado)')).toBeDefined();
    expect(screen.getByText('Reprovado')).toBeDefined();
  });

  it('substitui apenas o skeleton do Beta por estado Indisponível quando o Beta sofre timeout', async () => {
    const manualStream = createManualSseStream();

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      body: manualStream.stream
    } as Response);

    render(<SimulatorPage />);

    fireEvent.click(screen.getByRole('button', { name: /Sucesso no Alfa \/ Timeout no Beta/i }));
    fireEvent.click(screen.getByRole('button', { name: /Simular agora/i }));

    await act(async () => {
      manualStream.sendEvent('meta', META_EVENT_DATA);
      manualStream.sendEvent('bank-result', {
        simulationId: 'sim-stream-123',
        result: {
          bankCode: 'banco-alfa',
          bankName: 'Banco Alfa',
          status: 'approved',
          monthlyInterestRate: 0.0175,
          installmentAmount: 513.86,
          approvedAmount: 10000,
          installments: 24,
          totalAmount: 12332.64,
          message: 'Proposta aprovada nas regras fictícias do Banco Alfa.',
          reasonCode: 'APPROVED',
          responseTimeMs: 90
        }
      });
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Resultado do Banco Alfa')).toBeDefined();
      expect(screen.getByLabelText('Consultando Banco Beta')).toBeDefined();
    });

    await act(async () => {
      manualStream.sendEvent('bank-result', {
        simulationId: 'sim-stream-123',
        result: {
          bankCode: 'banco-beta',
          bankName: 'Banco Beta',
          status: 'unavailable',
          monthlyInterestRate: null,
          installmentAmount: null,
          approvedAmount: null,
          installments: null,
          totalAmount: null,
          message: 'Tempo limite excedido ao consultar o Banco Beta.',
          reasonCode: 'TIMEOUT',
          responseTimeMs: 1800
        }
      });
      manualStream.sendEvent('complete', {
        simulationId: 'sim-stream-123',
        completedAt: '2026-10-23T12:00:01.800Z',
        resultsCount: 2
      });
      manualStream.close();
    });

    await waitFor(() => {
      expect(screen.queryByLabelText('Consultando Banco Beta')).toBeNull();
      expect(screen.getByText('Indisponível')).toBeDefined();
      expect(screen.getByText(/Tempo limite excedido \(Timeout\)/i)).toBeDefined();
    });
  });

  it('chama abort na desmontagem durante um stream ativo sem produzir alerta de erro', async () => {
    let capturedSignal: AbortSignal | null | undefined;
    const manualStream = createManualSseStream();

    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_input, init) => {
      capturedSignal = init?.signal;
      return {
        ok: true,
        status: 200,
        body: manualStream.stream
      } as Response;
    });

    const { unmount } = render(<SimulatorPage />);

    fireEvent.click(screen.getByRole('button', { name: /Aprovar nos dois bancos/i }));
    fireEvent.click(screen.getByRole('button', { name: /Simular agora/i }));

    await act(async () => {
      manualStream.sendEvent('meta', META_EVENT_DATA);
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Consultando Banco Alfa')).toBeDefined();
    });

    expect(capturedSignal?.aborted).toBe(false);

    unmount();

    expect(capturedSignal?.aborted).toBe(true);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

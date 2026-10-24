import { Calculator, LogOut, Menu, ShieldCheck, Sparkles, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import octafinLogo from '../assets/octafin-logo.png';
import type { PublicUser } from '../types/auth.types';

interface HeaderProps {
  currentUser?: PublicUser;
  activePage?: 'simulator' | 'access';
  onOpenSimulator?: () => void;
  onOpenAccessManagement?: () => void;
  onLogout?: () => void;
  showAccessHint?: boolean;
  onDismissAccessHint?: () => void;
  accessHintDurationMs?: number;
}

export const DEFAULT_ACCESS_HINT_DURATION_MS = 6000;

export function Header({
  currentUser,
  activePage = 'simulator',
  onOpenSimulator,
  onOpenAccessManagement,
  onLogout,
  showAccessHint = false,
  onDismissAccessHint,
  accessHintDurationMs = DEFAULT_ACCESS_HINT_DURATION_MS
}: HeaderProps) {
  const [logoError, setLogoError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [internalHintVisible, setInternalHintVisible] = useState(showAccessHint);

  const canNavigateToSimulator = Boolean(onOpenSimulator && activePage !== 'simulator');
  const canNavigateToAccess = Boolean(
    currentUser?.role === 'admin' && onOpenAccessManagement && activePage !== 'access'
  );

  useEffect(() => {
    setInternalHintVisible(showAccessHint);
  }, [showAccessHint]);

  const isAccessHintOpen = internalHintVisible && canNavigateToAccess;

  const dismissHint = () => {
    setInternalHintVisible(false);
    onDismissAccessHint?.();
  };

  useEffect(() => {
    if (!isAccessHintOpen || accessHintDurationMs <= 0) return;

    const timer = window.setTimeout(() => {
      setInternalHintVisible(false);
      onDismissAccessHint?.();
    }, accessHintDurationMs);

    return () => window.clearTimeout(timer);
  }, [isAccessHintOpen, accessHintDurationMs, onDismissAccessHint]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="relative z-30 border-b border-white/10 bg-gradient-to-r from-[#041D33] via-[#062B45] to-[#073656] text-white shadow-xs">
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 md:min-h-[82px] lg:gap-8 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3.5 sm:gap-5 lg:gap-6">
          <div className="flex shrink-0 items-center">
            {!logoError ? (
              <img
                src={octafinLogo}
                alt="OctaFin"
                onError={() => setLogoError(true)}
                className="h-auto w-[132px] object-contain sm:w-[146px]"
              />
            ) : (
              <span
                aria-label="OctaFin"
                className="inline-flex items-center rounded-lg border border-[#18CBBE]/40 bg-[#041D33] px-3 py-1.5 text-lg font-extrabold tracking-tight text-white"
              >
                octafin
              </span>
            )}
          </div>

          <div
            aria-hidden="true"
            className="hidden h-8 w-px shrink-0 bg-white/15 sm:block"
          />

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight text-white sm:text-xl lg:text-[22px]">
              Simulador de Consignado CLT
            </h1>
            <p className="mt-0.5 hidden truncate text-[13px] text-slate-300 sm:block lg:text-[13.5px]">
              Simule e compare condições de crédito entre instituições fictícias.
            </p>
          </div>
        </div>

        {currentUser && (
          <>
            <nav
              aria-label="Navegação principal"
              className="hidden shrink-0 items-center gap-2.5 text-xs md:flex lg:gap-3"
            >
              <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 font-medium text-slate-100">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#18CBBE]" aria-hidden="true" />
                <span className="max-w-[180px] truncate">{currentUser.name}</span>
              </span>

              {canNavigateToSimulator && (
                <button
                  type="button"
                  onClick={onOpenSimulator}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#18CBBE]/40 bg-[#18CBBE]/15 px-3.5 font-semibold text-[#18CBBE] transition hover:bg-[#18CBBE]/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#18CBBE]"
                >
                  <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Simulador</span>
                </button>
              )}

              {canNavigateToAccess && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      dismissHint();
                      onOpenAccessManagement?.();
                    }}
                    className={[
                      'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3.5 font-semibold text-[#18CBBE] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#18CBBE]',
                      isAccessHintOpen
                        ? 'border-[#18CBBE] bg-[#18CBBE]/25 ring-2 ring-[#18CBBE]/40'
                        : 'border-[#18CBBE]/40 bg-[#18CBBE]/15 hover:bg-[#18CBBE]/25'
                    ].join(' ')}
                  >
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Acessos</span>
                  </button>

                  {isAccessHintOpen && (
                    <div
                      role="dialog"
                      aria-label="Dica sobre o botão Acessos"
                      className="absolute right-0 top-full z-50 mt-3 w-72 rounded-xl border border-[#00B8DC]/40 bg-white p-3.5 text-left text-xs text-[#102A43] shadow-lg ring-1 ring-[#062B45]/10"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute -top-1.5 right-8 h-3 w-3 rotate-45 border-t border-l border-[#00B8DC]/40 bg-white"
                      />

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-[#062B45]">
                          <Sparkles
                            className="h-3.5 w-3.5 shrink-0 text-[#00B8DC]"
                            aria-hidden="true"
                          />
                          <span>Gestão de Acessos</span>
                        </div>
                        <button
                          type="button"
                          onClick={dismissHint}
                          aria-label="Fechar dica de acessos"
                          className="rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B8DC]"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      <p className="mt-1.5 leading-relaxed text-slate-600">
                        Clique em <strong className="font-semibold text-[#062B45]">Acessos</strong>{' '}
                        para cadastrar funcionários e ativar ou desativar contas da equipe.
                      </p>

                      <div className="mt-2.5 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={dismissHint}
                          className="rounded-lg bg-[#062B45] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-[#073656] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B8DC]"
                        >
                          Entendi
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3.5 font-semibold text-white transition hover:border-white/30 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#18CBBE]"
                >
                  <LogOut className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
                  <span>Sair</span>
                </button>
              )}
            </nav>

            <div className="flex items-center md:hidden">
              <button
                type="button"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-header-menu"
                aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#18CBBE]"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-[#18CBBE]" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5 text-[#18CBBE]" aria-hidden="true" />
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {currentUser && mobileMenuOpen && (
        <nav
          id="mobile-header-menu"
          aria-label="Menu de navegação móvel"
          className="border-t border-white/10 bg-[#041D33]/95 px-4 py-3 md:hidden"
        >
          <div className="mx-auto flex max-w-[1440px] flex-col gap-2.5 text-xs">
            <p className="text-[12px] text-slate-300 sm:hidden">
              Simule e compare condições de crédito entre instituições fictícias.
            </p>

            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-medium text-slate-100">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#18CBBE]" aria-hidden="true" />
              <span className="truncate">{currentUser.name}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canNavigateToSimulator && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSimulator?.();
                  }}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#18CBBE]/40 bg-[#18CBBE]/15 px-3 font-semibold text-[#18CBBE] transition hover:bg-[#18CBBE]/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#18CBBE]"
                >
                  <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Simulador</span>
                </button>
              )}

              {canNavigateToAccess && (
                <button
                  type="button"
                  onClick={() => {
                    dismissHint();
                    setMobileMenuOpen(false);
                    onOpenAccessManagement?.();
                  }}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#18CBBE]/40 bg-[#18CBBE]/15 px-3 font-semibold text-[#18CBBE] transition hover:bg-[#18CBBE]/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#18CBBE]"
                >
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Acessos</span>
                </button>
              )}

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#18CBBE]"
                >
                  <LogOut className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
                  <span>Sair</span>
                </button>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

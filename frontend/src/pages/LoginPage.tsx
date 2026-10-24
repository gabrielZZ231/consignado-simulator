import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import octafinLogo from '../assets/octafin-logo.png';
import type { AppUser, PublicUser } from '../types/auth.types';

interface LoginPageProps {
  users: AppUser[];
  onLogin: (user: PublicUser) => void;
}

export function LoginPage({ users, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('admin@octafin.demo');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const user = users.find(
      (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!user || user.password !== password) {
      setError('E-mail ou senha inválidos.');
      return;
    }

    if (user.status !== 'active') {
      setError('Este acesso está inativo. Solicite a liberação ao administrador.');
      return;
    }

    const { password: _password, ...publicUser } = user;
    setError(null);
    onLogin(publicUser);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#041D33] via-[#062B45] to-[#083B5E] p-4 text-[#102A43] sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#18CBBE]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -bottom-32 h-[28rem] w-[28rem] rounded-full bg-[#00B8DC]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(24,203,190,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(0,184,220,0.12),transparent_45%)]"
      />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-white shadow-2xl shadow-black/35 lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#041D33] via-[#062B45] to-[#073656] p-7 text-white sm:p-10">
          <div className="absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#18CBBE]/15 blur-2xl" />
          <div className="absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#00B8DC]/15 blur-2xl" />

          <div className="relative">
            <img src={octafinLogo} alt="OctaFin" className="h-10 w-auto object-contain" />
            <span className="mt-9 inline-flex items-center gap-2 rounded-full border border-[#18CBBE]/35 bg-[#18CBBE]/10 px-3 py-1 text-xs font-semibold text-[#18CBBE]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Área restrita
            </span>
            <h1 className="mt-4 max-w-md text-3xl font-extrabold tracking-tight sm:text-4xl">
              Acesso seguro ao portal OctaFin.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-200">
              Simule propostas e gerencie os acessos da equipe em um ambiente de demonstração.
            </p>
          </div>

          <div className="relative mt-10 border-t border-white/10 pt-5 text-xs text-slate-300">
            Simulador de Consignado CLT • Plataforma corporativa OctaFin
          </div>
        </section>

        <section className="p-7 sm:p-10">
          <p className="text-xs font-bold tracking-widest text-[#00B8DC] uppercase">Boas-vindas</p>
          <h2 className="mt-2 text-2xl font-extrabold text-[#102A43]">Entrar na plataforma</h2>
          <p className="mt-2 text-sm text-slate-600">Use suas credenciais para continuar.</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
            <label className="block text-sm font-semibold text-[#102A43]" htmlFor="login-email">
              E-mail
              <span className="relative mt-2 block">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pr-3 pl-10 text-sm outline-none transition focus:border-[#00B8DC] focus:ring-2 focus:ring-[#00B8DC]/20"
                  required
                />
              </span>
            </label>
            <label className="block text-sm font-semibold text-[#102A43]" htmlFor="login-password">
              Senha
              <span className="relative mt-2 block">
                <LockKeyhole
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pr-3 pl-10 text-sm outline-none transition focus:border-[#00B8DC] focus:ring-2 focus:ring-[#00B8DC]/20"
                  required
                />
              </span>
            </label>
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#062B45] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#073656] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B8DC] focus-visible:ring-offset-2"
            >
              Entrar
              <ArrowRight className="h-4 w-4 text-[#18CBBE]" aria-hidden="true" />
            </button>
          </form>
          <p className="mt-6 rounded-xl bg-[#F4F8FB] p-3 text-xs leading-relaxed text-slate-600">
            Protótipo local: esta tela não substitui autenticação, sessões seguras ou gestão de
            senhas de produção.
          </p>
        </section>
      </div>
    </main>
  );
}

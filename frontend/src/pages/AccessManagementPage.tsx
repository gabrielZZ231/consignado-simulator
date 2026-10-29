import { BadgeCheck, CircleOff, KeyRound, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { DemoBanner } from '../components/DemoBanner';
import { Header } from '../components/Header';
import type { PublicUser, UserRole } from '../types/auth.types';

interface AccessManagementPageProps {
  currentUser: PublicUser;
  users: PublicUser[];
  onCreateUser: (input: { name: string; email: string; password: string; role: UserRole }) => Promise<void>;
  onToggleUserStatus: (userId: string) => Promise<void>;
  onLogout: () => void;
  onOpenSimulator: () => void;
}

export function AccessManagementPage({ currentUser, users, onCreateUser, onToggleUserStatus, onLogout, onOpenSimulator }: AccessManagementPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 6) {
      setFeedback('Informe nome, e-mail válido e uma senha temporária de pelo menos 6 caracteres.');
      return;
    }
    if (users.some((user) => user.email.toLowerCase() === email.trim().toLowerCase())) {
      setFeedback('Já existe um usuário com este e-mail.');
      return;
    }
    try { await onCreateUser({ name: name.trim(), email: email.trim().toLowerCase(), password, role }); setFeedback(`Acesso criado para ${email.trim().toLowerCase()}.`); } catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível criar o acesso.'); return; }
    setName(''); setEmail(''); setPassword(''); setRole('employee');
  };

  const handleToggleUserStatus = async (user: PublicUser) => {
    try {
      await onToggleUserStatus(user.id);
      setFeedback(
        user.status === 'active'
          ? `Acesso de ${user.email} desativado.`
          : `Acesso de ${user.email} reativado.`
      );
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : 'Não foi possível alterar o status do usuário.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8FB] text-[#102A43]">
      <Header currentUser={currentUser} activePage="access" onOpenSimulator={onOpenSimulator} onLogout={onLogout} />
      <DemoBanner />
      <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="rounded-2xl border border-[#00B8DC]/25 bg-gradient-to-r from-[#062B45] to-[#073656] p-6 text-white shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#18CBBE] uppercase"><ShieldCheck className="h-4 w-4" /> Administração</span>
              <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Gerenciamento de acessos</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200">Crie contas de funcionários e suspenda ou libere seus acessos. Apenas administradores visualizam esta área.</p>
            </div>
            <span className="rounded-xl border border-[#18CBBE]/35 bg-[#18CBBE]/10 px-3 py-2 text-xs font-semibold text-[#18CBBE]">Administrador: {currentUser.name}</span>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center gap-2"><span className="rounded-xl bg-[#00B8DC]/10 p-2 text-[#062B45]"><UserPlus className="h-5 w-5" /></span><div><h2 className="font-bold">Novo usuário</h2><p className="text-xs text-slate-600">O acesso é ativado imediatamente neste protótipo.</p></div></div>
            <form className="mt-5 space-y-4" onSubmit={handleCreateUser} noValidate>
              <label className="block text-xs font-semibold text-[#102A43]">Nome completo<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-[#00B8DC] focus:ring-2 focus:ring-[#00B8DC]/20" required /></label>
              <label className="block text-xs font-semibold text-[#102A43]">E-mail corporativo<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-[#00B8DC] focus:ring-2 focus:ring-[#00B8DC]/20" required /></label>
              <label className="block text-xs font-semibold text-[#102A43]">Senha temporária<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={6} className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-[#00B8DC] focus:ring-2 focus:ring-[#00B8DC]/20" required /></label>
              <label className="block text-xs font-semibold text-[#102A43]">Perfil<select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#00B8DC] focus:ring-2 focus:ring-[#00B8DC]/20"><option value="employee">Funcionário — simulações</option><option value="admin">Administrador — acessos e simulações</option></select></label>
              {feedback && <p role="status" className="rounded-xl border border-[#00B8DC]/25 bg-[#F4F8FB] p-3 text-xs leading-relaxed text-[#062B45]">{feedback}</p>}
              <button type="submit" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#062B45] px-4 py-2 text-sm font-bold text-white hover:bg-[#073656]"><UserPlus className="h-4 w-4 text-[#18CBBE]" />Criar acesso</button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="rounded-xl bg-[#18CBBE]/10 p-2 text-[#062B45]"><Users className="h-5 w-5" /></span><div><h2 className="font-bold">Usuários cadastrados</h2><p className="text-xs text-slate-600">Gerencie a disponibilidade de acesso da equipe.</p></div></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{users.length} usuário(s)</span></div>
            <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[580px] text-left text-sm"><thead className="border-b border-slate-200 text-xs tracking-wide text-slate-500 uppercase"><tr><th className="px-3 py-3">Usuário</th><th className="px-3 py-3">Perfil</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Ação</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b border-slate-100 last:border-0"><td className="px-3 py-4"><p className="font-semibold text-[#102A43]">{user.name}</p><p className="mt-0.5 text-xs text-slate-500">{user.email}</p></td><td className="px-3 py-4"><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">{user.role === 'admin' ? <ShieldCheck className="h-3.5 w-3.5 text-[#00B8DC]" /> : <KeyRound className="h-3.5 w-3.5 text-slate-400" />}{user.role === 'admin' ? 'Administrador' : 'Funcionário'}</span></td><td className="px-3 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${user.status === 'active' ? 'bg-teal-50 text-teal-800' : 'bg-slate-100 text-slate-600'}`}>{user.status === 'active' ? <BadgeCheck className="h-3.5 w-3.5" /> : <CircleOff className="h-3.5 w-3.5" />}{user.status === 'active' ? 'Ativo' : 'Inativo'}</span></td><td className="px-3 py-4 text-right"><button type="button" onClick={() => { void handleToggleUserStatus(user); }} disabled={user.id === currentUser.id} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-[#062B45] hover:bg-[#F4F8FB] disabled:cursor-not-allowed disabled:opacity-45">{user.id === currentUser.id ? 'Sessão atual' : user.status === 'active' ? 'Desativar' : 'Ativar'}</button></td></tr>)}</tbody></table></div>
          </section>
        </div>
      </main>
    </div>
  );
}

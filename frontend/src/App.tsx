import { useState } from 'react';
import * as authApi from './services/auth.api';
import { AccessManagementPage } from './pages/AccessManagementPage';
import { LoginPage } from './pages/LoginPage';
import { SimulatorPage } from './pages/SimulatorPage';
import type { PublicUser } from './types/auth.types';

export function App() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [page, setPage] = useState<'simulator' | 'access'>('simulator');
  const [showAccessHint, setShowAccessHint] = useState(false);

  if (!currentUser) {
    return (
      <LoginPage onLogin={async (email, password) => { const { user } = await authApi.login(email, password); setCurrentUser(user);
          setPage('simulator');
          setShowAccessHint(user.role === 'admin');
          if (user.role === 'admin') setUsers((await authApi.listUsers()).users); return user; }} />
    );
  }

  const logout = () => {
    void authApi.logout().catch(() => undefined); setCurrentUser(null);
    setPage('simulator');
    setShowAccessHint(false);
  };

  if (currentUser.role === 'admin' && page === 'access') {
    return (
      <AccessManagementPage
        currentUser={currentUser}
        users={users}
        onLogout={logout}
        onOpenSimulator={() => setPage('simulator')}
        onCreateUser={async (input) => { const { user } = await authApi.createUser(input); setUsers((previous) => [...previous, user]); }}
        onToggleUserStatus={async (userId) => { const { user } = await authApi.toggleUserStatus(userId); setUsers((previous) => previous.map((item) => item.id === userId ? user : item)); }}
      />
    );
  }

  return (
    <SimulatorPage
      currentUser={currentUser}
      onLogout={logout}
      onOpenAccessManagement={
        currentUser.role === 'admin'
          ? () => {
              setShowAccessHint(false);
              setPage('access');
            }
          : undefined
      }
      showAccessHint={showAccessHint}
      onDismissAccessHint={() => setShowAccessHint(false)}
    />
  );
}

export default App;

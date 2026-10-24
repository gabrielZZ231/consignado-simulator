import { useState } from 'react';
import { AccessManagementPage } from './pages/AccessManagementPage';
import { LoginPage } from './pages/LoginPage';
import { SimulatorPage } from './pages/SimulatorPage';
import type { AppUser, PublicUser } from './types/auth.types';

const INITIAL_USERS: AppUser[] = [
  {
    id: 'admin-octafin',
    name: 'Administrador OctaFin',
    email: 'admin@octafin.demo',
    password: 'admin123',
    role: 'admin',
    status: 'active'
  }
];

export function App() {
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [page, setPage] = useState<'simulator' | 'access'>('simulator');
  const [showAccessHint, setShowAccessHint] = useState(false);

  if (!currentUser) {
    return (
      <LoginPage
        users={users}
        onLogin={(user) => {
          setCurrentUser(user);
          setPage('simulator');
          setShowAccessHint(user.role === 'admin');
        }}
      />
    );
  }

  const logout = () => {
    setCurrentUser(null);
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
        onCreateUser={(input) =>
          setUsers((previous) => [
            ...previous,
            { ...input, id: `user-${crypto.randomUUID()}`, status: 'active' }
          ])
        }
        onToggleUserStatus={(userId) =>
          setUsers((previous) =>
            previous.map((user) =>
              user.id === userId
                ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
                : user
            )
          )
        }
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

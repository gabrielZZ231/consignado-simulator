export type UserRole = 'admin' | 'employee';
export type UserStatus = 'active' | 'inactive';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  password: string;
}

export type PublicUser = Omit<AppUser, 'password'>;

export type UserRole = 'admin' | 'employee';
export type UserStatus = 'active' | 'inactive';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}
export type AppUser = PublicUser;

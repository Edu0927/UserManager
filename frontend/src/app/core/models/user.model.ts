export type Role = 'ADMIN' | 'USER';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}

export interface UserUpdateRequest {
  name: string;
  email: string;
  phone: string;
  password: string | null;
  role: Role;
}

export interface UserStatusRequest {
  active: boolean;
}

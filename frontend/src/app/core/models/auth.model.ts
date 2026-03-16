import { CampusUser } from './campus-user.model';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  department: string;
  studentId: string;
}

export interface AuthSession {
  token: string;
  user: CampusUser;
  previewMode?: boolean;
  message?: string;
}

export type UserRole = 'student' | 'admin';

export interface CampusUser {
  id: string;
  fullName: string;
  email: string;
  department?: string;
  studentId?: string;
  role: UserRole;
}

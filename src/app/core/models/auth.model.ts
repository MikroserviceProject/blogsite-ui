export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'Admin' | 'Author' | 'User';
  profilePictureUrl?: string;
  university?: string;
  cvUrl?: string;
  authorApprovalStatus?: 'Pending' | 'Approved' | 'Rejected';
  authorApplicationDate?: string;
  isEmailConfirmed: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: string;
  university?: string;
  cvUrl?: string;
}

export interface AuthorApplication {
  id: string;
  username: string;
  email: string;
  university?: string;
  cvUrl?: string;
  authorApprovalStatus: string;
  authorApplicationDate?: string;
  authorRejectionReason?: string | null;
  isEmailConfirmed: boolean;
  createdAt: string;
}

export type PendingAuthorDto = AuthorApplication;

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresInMinutes: number;
  user: User;
}

export interface ConfirmEmailRequest {
  email: string;
  token: string;
}

export interface UpdateProfileRequest {
  username: string;
  email: string;
  profilePictureUrl?: string;
}

export interface ResendEmailRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

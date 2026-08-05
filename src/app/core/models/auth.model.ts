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
  isEmailConfirmed: boolean;
  createdAt: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: string;
}

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

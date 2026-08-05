import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ApiResponse, LoginRequest, LoginResponse, RegisterRequest, User, ConfirmEmailRequest } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:5001/api/auth';

  private tokenSignal = signal<string | null>(localStorage.getItem('lumina_auth_token'));
  currentUser = signal<User | null>(null);

  // Computed state
  isLoggedIn = computed(() => !!this.tokenSignal());
  userRole = computed(() => this.currentUser()?.role || null);
  isAdmin = computed(() => this.currentUser()?.role === 'Admin');
  isAuthor = computed(() => this.currentUser()?.role === 'Author' || this.currentUser()?.role === 'Admin');

  // Global Modals State
  isLoginModalOpen = signal<boolean>(false);
  isRegisterModalOpen = signal<boolean>(false);
  isConfirmModalOpen = signal<boolean>(false);
  pendingConfirmEmail = signal<string>('');

  constructor() {
    // Sayfa ilk yüklendiğinde hafızada token varsa profili otomatik getir
    if (this.tokenSignal()) {
      this.getMe().subscribe({
        error: () => this.logout()
      });
    }
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  register(request: RegisterRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/register`, request).pipe(
      tap(res => {
        if (res.success) {
          this.pendingConfirmEmail.set(request.email);
        }
      })
    );
  }

  confirmEmail(request: ConfirmEmailRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/confirm-email`, request);
  }

  login(request: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, request).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data.token, res.data.user);
          this.closeAllModals();
        }
      })
    );
  }

  getMe(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.currentUser.set(res.data);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('lumina_auth_token');
    this.tokenSignal.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  private setSession(token: string, user: User) {
    localStorage.setItem('lumina_auth_token', token);
    this.tokenSignal.set(token);
    this.currentUser.set(user);
  }

  // Modal Controls
  openLoginModal() {
    this.closeAllModals();
    this.router.navigate(['/login']);
  }

  openRegisterModal() {
    this.closeAllModals();
    this.router.navigate(['/register']);
  }

  openConfirmModal(email?: string) {
    this.closeAllModals();
    if (email) this.pendingConfirmEmail.set(email);
    this.router.navigate(['/confirm-email'], { queryParams: email ? { email } : {} });
  }

  closeAllModals() {
    this.isLoginModalOpen.set(false);
    this.isRegisterModalOpen.set(false);
    this.isConfirmModalOpen.set(false);
  }
}

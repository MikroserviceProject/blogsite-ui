import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, interval, Subscription } from 'rxjs';
import { ApiResponse, LoginRequest, LoginResponse, RegisterRequest, User, ConfirmEmailRequest, UpdateProfileRequest, ResendEmailRequest } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:5001/api/auth';

  private tokenSignal = signal<string | null>(localStorage.getItem('lumina_auth_token'));
  currentUser = signal<User | null>(null);
  sessionWarning = signal<string | null>(null);

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

  private sessionCheckSub: Subscription | null = null;

  constructor() {
    // Sayfa ilk yüklendiğinde hafızada token varsa profili otomatik getir ve oturum takibini başlat
    if (this.tokenSignal()) {
      this.getMe().subscribe({
        next: () => this.startSessionHeartbeat(),
        error: () => this.handleSessionTerminated('Oturumunuz geçerli değil veya sonlandırılmış.')
      });
    }
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  // 5 saniyede bir oturumun hala geçerli olup olmadığını (başka cihazdan girilip girilmediğini) kontrol eder
  private startSessionHeartbeat() {
    this.stopSessionHeartbeat();
    this.sessionCheckSub = interval(5000).subscribe(() => {
      if (this.tokenSignal()) {
        this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/validate-session`).subscribe({
          error: (err) => {
            if (err.status === 401) {
              const msg = err.error?.message || 'Hesabınıza başka bir sekmeden veya cihazdan giriş yapıldığı için bu oturumunuz anında sonlandırıldı.';
              this.handleSessionTerminated(msg);
            }
          }
        });
      }
    });
  }

  private stopSessionHeartbeat() {
    if (this.sessionCheckSub) {
      this.sessionCheckSub.unsubscribe();
      this.sessionCheckSub = null;
    }
  }

  handleSessionTerminated(message: string) {
    this.stopSessionHeartbeat();
    localStorage.removeItem('lumina_auth_token');
    this.tokenSignal.set(null);
    this.currentUser.set(null);
    this.sessionWarning.set(message);
    this.router.navigate(['/login']);
  }

  clearSessionWarning() {
    this.sessionWarning.set(null);
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
          this.sessionWarning.set(null);
          this.setSession(res.data.token, res.data.user);
          this.startSessionHeartbeat();
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

  updateProfile(request: UpdateProfileRequest): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/update-profile`, request).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.currentUser.set(res.data);
          if (!res.data.isEmailConfirmed) {
            this.pendingConfirmEmail.set(res.data.email);
          }
        }
      })
    );
  }

  uploadAvatar(file: File): Observable<ApiResponse<User>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/upload-avatar`, formData).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.currentUser.set(res.data);
        }
      })
    );
  }

  getAvatarUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:image')) return path;
    return `http://localhost:5001${path}`;
  }

  resendConfirmation(email: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/resend-confirmation`, { email });
  }


  logout() {
    const token = this.tokenSignal();
    if (token) {
      // Backend'deki CurrentSessionToken'ı anında yenileyerek diğer tüm kopyalanmış token'ları geçersiz kıl
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    this.stopSessionHeartbeat();
    localStorage.removeItem('lumina_auth_token');
    this.tokenSignal.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
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


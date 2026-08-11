import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, interval, Subscription } from 'rxjs';
import { 
  ApiResponse, 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  User, 
  ConfirmEmailRequest, 
  UpdateProfileRequest, 
  ResendEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  AuthorApplication,
  AdminUserDto,
  BanUserRequest,
  AdminSendNotificationRequest,
  UserNotification,
  ConfirmAccountDeletionRequest,
  PublicUserProfile
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'https://localhost:7235/api/auth';

  private getInitialUser(): User | null {
    try {
      const userJson = localStorage.getItem('lumina_auth_user');
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }

  private tokenSignal = signal<string | null>(localStorage.getItem('lumina_auth_token'));
  currentUser = signal<User | null>(this.getInitialUser());
  sessionWarning = signal<string | null>(null);

  // Computed state
  isLoggedIn = computed(() => !!this.tokenSignal());
  userRole = computed(() => this.currentUser()?.role || null);
  
  // Türkçe Rol İsimlendirmesi
  roleDisplayName = computed(() => {
    const role = this.currentUser()?.role;
    if (role === 'Admin') return 'Yönetici';
    if (role === 'Author') return 'Yazar';
    return 'Okur';
  });

  isAdmin = computed(() => this.currentUser()?.role === 'Admin');
  isAuthor = computed(() => this.currentUser()?.role === 'Author');
  isReader = computed(() => this.currentUser()?.role === 'User' || !this.currentUser()?.role);
  isBanned = computed(() => this.currentUser()?.isBanned === true);

  // Global Modals / State
  pendingConfirmEmail = signal<string>('');

  private sessionCheckSub: Subscription | null = null;

  constructor() {
    // Sayfa ilk yüklendiğinde / yenilendiğinde hafızada token varsa profili arka planda tazele ve oturum takibini başlat
    if (this.tokenSignal()) {
      this.getMe().subscribe({
        next: () => this.startSessionHeartbeat(),
        error: (err) => {
          // Token geçersizse sessizce temizle, ilk açılışta uyarı basma
          if (err?.status === 401) {
            this.logoutQuietly();
          }
        }
      });
    }
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  // 15 saniyede bir oturumun hala geçerli olup olmadığını (başka cihazdan girilip girilmediğini) kontrol eder
  private startSessionHeartbeat() {
    this.stopSessionHeartbeat();
    this.sessionCheckSub = interval(15000).subscribe(() => {
      if (this.tokenSignal()) {
        this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/validate-session`).subscribe({
          error: (err) => {
            if (err.status === 401) {
              const msg = err.error?.message || 'Hesabınıza başka bir sekmeden veya cihazdan giriş yapıldığı için oturumunuz sonlandırıldı.';
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

  logoutQuietly() {
    this.stopSessionHeartbeat();
    localStorage.removeItem('lumina_auth_token');
    localStorage.removeItem('lumina_auth_user');
    this.tokenSignal.set(null);
    this.currentUser.set(null);
  }

  handleSessionTerminated(message?: string) {
    this.logoutQuietly();
    if (message) {
      this.sessionWarning.set(message);
    }
    this.router.navigate(['/login']);
  }

  clearSessionWarning() {
    this.sessionWarning.set(null);
  }

  // Standart Okur Kaydı
  register(request: RegisterRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/register`, request).pipe(
      tap(res => {
        if (res.success) {
          this.pendingConfirmEmail.set(request.email);
        }
      })
    );
  }

  // Yazar Başvurusu Kaydı (CV PDF Dosyası Destekli FormData)
  registerAuthor(formData: FormData): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/register-author`, formData);
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
        }
      })
    );
  }

  getMe(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.currentUser.set(res.data);
          localStorage.setItem('lumina_auth_user', JSON.stringify(res.data));
        }
      })
    );
  }

  updateProfile(request: UpdateProfileRequest): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/update-profile`, request).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.currentUser.set(res.data);
          localStorage.setItem('lumina_auth_user', JSON.stringify(res.data));
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
          localStorage.setItem('lumina_auth_user', JSON.stringify(res.data));
        }
      })
    );
  }

  getPublicProfile(userId: string): Observable<ApiResponse<PublicUserProfile>> {
    return this.http.get<ApiResponse<PublicUserProfile>>(`${this.apiUrl}/users/${userId}/public-profile`);
  }

  getAvatarUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:image')) return path;
    return `http://localhost:5001${path}`;
  }

  getCvUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:5001${path}`;
  }

  resendEmailConfirmation(email: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/resend-confirmation`, { email });
  }

  resendConfirmation(email: string): Observable<ApiResponse<boolean>> {
    return this.resendEmailConfirmation(email);
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/reset-password`, request);
  }

  changePassword(request: ChangePasswordRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/change-password`, request);
  }

  // Admin Yazar Başvuru İşlemleri
  getAuthorApplications(): Observable<ApiResponse<AuthorApplication[]>> {
    return this.http.get<ApiResponse<AuthorApplication[]>>(`${this.apiUrl}/admin/author-applications`);
  }

  getPendingAuthors(): Observable<ApiResponse<AuthorApplication[]>> {
    return this.getAuthorApplications();
  }

  approveAuthor(id: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/admin/approve-author/${id}`, {});
  }

  rejectAuthor(id: string, reason?: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/admin/reject-author/${id}`, { reason });
  }

  // Admin Kullanıcı Yönetimi & Moderasyon
  getAllUsers(): Observable<ApiResponse<AdminUserDto[]>> {
    return this.http.get<ApiResponse<AdminUserDto[]>>(`${this.apiUrl}/admin/users`);
  }

  banUser(request: BanUserRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/admin/ban-user`, request);
  }

  unbanUser(userId: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/admin/unban-user/${userId}`, {});
  }

  sendAdminNotification(request: AdminSendNotificationRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/admin/send-notification`, request);
  }

  // Kullanıcı Bildirimleri
  getUserNotifications(): Observable<ApiResponse<UserNotification[]>> {
    return this.http.get<ApiResponse<UserNotification[]>>(`${this.apiUrl}/notifications`);
  }

  markNotificationAsRead(id: string): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.apiUrl}/notifications/${id}/read`, {});
  }

  // Hesap Silme İşlemleri (Tüm kullanıcılar ve Banlananlar için)
  requestAccountDeletion(): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/request-account-deletion`, {});
  }

  confirmAccountDeletion(request: ConfirmAccountDeletionRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/confirm-account-deletion`, request);
  }

  logout() {
    const token = this.tokenSignal();
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    this.logoutQuietly();
    this.router.navigate(['/login']);
  }

  private setSession(token: string, user: User) {
    localStorage.setItem('lumina_auth_token', token);
    localStorage.setItem('lumina_auth_user', JSON.stringify(user));
    this.tokenSignal.set(token);
    this.currentUser.set(user);
  }
}


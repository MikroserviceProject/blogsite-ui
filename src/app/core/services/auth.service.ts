import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
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
  PublicUserProfile,
  PaginatedResult
} from '../models/auth.model';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.authApiUrl}/api/auth`;

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
  
  // Navbar için okunmamış bildirim sayısı
  unreadNotificationCount = signal<number>(this.currentUser()?.unreadNotificationCount || 0);

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

  constructor() {
    // Sayfa ilk yüklendiğinde / yenilendiğinde hafızada token varsa profili arka planda tazele
    if (this.tokenSignal()) {
      this.getMe().subscribe({
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

  logoutQuietly() {
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

  // Mevcut Okur Hesabından Yazar Olmak İçin Başvuru Yapma
  applyForAuthor(formData: FormData): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/apply-author`, formData);
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
        }
      })
    );
  }

  getMe(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.currentUser.set(res.data);
          this.unreadNotificationCount.set(res.data.unreadNotificationCount || 0);
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

  uploadCover(file: File): Observable<ApiResponse<User>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/upload-cover`, formData).pipe(
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
    
    return `${environment.authApiUrl}${path}`;
  }

  getCvUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    
    return `${environment.authApiUrl}${path}`;
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

  sendSupportRequest(type: string, message: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/support-request`, { type, message });
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
  getAllUsers(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = ''): Observable<ApiResponse<PaginatedResult<AdminUserDto>>> {
    let params = `?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (searchTerm) {
      params += `&searchTerm=${encodeURIComponent(searchTerm)}`;
    }
    return this.http.get<ApiResponse<PaginatedResult<AdminUserDto>>>(`${this.apiUrl}/admin/users${params}`);
  }

  banUser(request: BanUserRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/admin/ban-user`, request);
  }

  unbanUser(userId: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/admin/unban-user/${userId}`, {});
  }

  sendAdminNotification(request: AdminSendNotificationRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/admin/notify-user`, request);
  }

  // Kullanıcı Bildirimleri
  getUserNotifications(page: number = 1, pageSize: number = 10, unreadOnly: boolean = false): Observable<ApiResponse<PaginatedResult<UserNotification>>> {
    return this.http.get<ApiResponse<PaginatedResult<UserNotification>>>(`${this.apiUrl}/notifications?page=${page}&pageSize=${pageSize}&unreadOnly=${unreadOnly}`);
  }

  markNotificationAsRead(id: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/notifications/${id}/read`, {});
  }

  // Hesap Silme ve Dondurma İşlemleri (Tüm kullanıcılar ve Banlananlar için)
  deactivateAccount(): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/deactivate-account`, {});
  }

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
    this.unreadNotificationCount.set(user.unreadNotificationCount || 0);
  }
}


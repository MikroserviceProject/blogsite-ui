import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { parseAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container profile-page">
      <div class="profile-container">
        <!-- Profile Header Card -->
        <div class="profile-header card">
          <!-- Avatar Section with Upload Overlay -->
          <div class="avatar-upload-wrapper">
            <div class="profile-avatar-large" (click)="fileInput.click()" title="Profil resmini değiştirmek için tıklayın">
              @if (authService.currentUser()?.profilePictureUrl) {
                <img 
                  [src]="authService.getAvatarUrl(authService.currentUser()?.profilePictureUrl)" 
                  alt="Profil Resmi" 
                  class="avatar-img-element"
                />
              } @else {
                <span>{{ authService.currentUser()?.username?.charAt(0)?.toUpperCase() || 'U' }}</span>
              }
              <div class="avatar-overlay">
                @if (isUploadingAvatar()) {
                  <span class="spinner-small">⏳</span>
                } @else {
                  <span>📷</span>
                }
              </div>
            </div>
            <input 
              #fileInput 
              type="file" 
              (change)="onFileSelected($event)" 
              accept="image/png, image/jpeg, image/jpg, image/webp, image/gif" 
              style="display: none;" 
            />
            <div class="avatar-quick-actions">
              <button type="button" class="btn-link-action" (click)="fileInput.click()" [disabled]="isUploadingAvatar()">
                📷 Fotoğraf Seç
              </button>
              @if (authService.currentUser()?.profilePictureUrl) {
                <span class="action-sep">•</span>
                <button type="button" class="btn-link-action text-danger" (click)="removeAvatar()" [disabled]="isUploadingAvatar()">
                  🗑️ Kaldır
                </button>
              }
            </div>
          </div>

          <div class="profile-main-info">
            <div class="profile-title-row">
              <h1 class="profile-name">{{ authService.currentUser()?.username }}</h1>
              <span class="badge" [ngClass]="'badge-' + (authService.userRole()?.toLowerCase() || 'user')">
                {{ authService.userRole() }}
              </span>
              @if (authService.currentUser()?.isEmailConfirmed) {
                <span class="badge badge-success">✓ E-Posta Onaylı</span>
              } @else {
                <span class="badge badge-warning">⏳ E-Posta Onay Bekliyor</span>
              }
            </div>
            <p class="profile-email">{{ authService.currentUser()?.email }}</p>
            <p class="profile-meta">
              Kayıt Tarihi: {{ authService.currentUser()?.createdAt | date:'d MMMM y, HH:mm' }}
            </p>
          </div>
          <div class="profile-actions">
            <button class="btn btn-danger btn-sm" (click)="logout()">
              <span>🚪</span> Çıkış Yap
            </button>
          </div>
        </div>

        <!-- E-Posta Doğrulanmamışsa Uyarı Kutusu -->
        @if (!authService.currentUser()?.isEmailConfirmed) {
          <div class="alert-card warning-alert-card card">
            <div class="alert-icon-large">⚠️</div>
            <div class="alert-details">
              <h3>E-Posta Adresiniz Doğrulanmamış</h3>
              <p>
                Hesabınızın tüm özelliklerini kullanabilmek ve güvenliğinizi sağlamak için lütfen e-posta adresinizi doğrulayınız.
              </p>
              <div class="alert-btn-group">
                <a
                  [routerLink]="['/confirm-email']"
                  [queryParams]="{ email: authService.currentUser()?.email }"
                  class="btn btn-warning btn-sm"
                >
                  ✉️ Doğrulama Kodunu Gir
                </a>
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  (click)="resendCode()"
                  [disabled]="isResending()"
                >
                  @if (isResending()) {
                    <span>Gönderiliyor...</span>
                  } @else {
                    <span>🔄 Yeni Kod Gönder</span>
                  }
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Profil Bilgileri & Düzenleme Kartı -->
        <div class="card profile-info-card">
          <div class="card-header-flex">
            <div>
              <h2 class="card-section-title">👤 Profil Bilgileri</h2>
              <p class="card-section-desc">Kullanıcı adı ve e-posta adresinizi buradan güncelleyebilirsiniz.</p>
            </div>
            @if (!isEditing()) {
              <button class="btn btn-primary btn-sm" (click)="startEditing()">
                <span>✏️</span> Profili Düzenle
              </button>
            }
          </div>

          @if (!isEditing()) {
            <!-- Görüntüleme Modu -->
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Kullanıcı Adı</span>
                <span class="info-value font-bold">{{ authService.currentUser()?.username }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">E-Posta Adresi</span>
                <span class="info-value">{{ authService.currentUser()?.email }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Hesap Rolü</span>
                <span class="info-value">
                  <span class="badge" [ngClass]="'badge-' + (authService.userRole()?.toLowerCase() || 'user')">
                    {{ authService.currentUser()?.role }}
                  </span>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">E-Posta Durumu</span>
                <span class="info-value">
                  @if (authService.currentUser()?.isEmailConfirmed) {
                    <span class="text-success font-bold">✓ Doğrulanmış</span>
                  } @else {
                    <span class="text-warning font-bold">⏳ Doğrulama Bekliyor</span>
                  }
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Üyelik Tarihi</span>
                <span class="info-value">{{ authService.currentUser()?.createdAt | date:'d MMMM y, HH:mm' }}</span>
              </div>
            </div>
          } @else {
            <!-- Düzenleme Formu -->
            <form (ngSubmit)="saveProfile()" class="edit-form">
              <div class="form-group">
                <label class="form-label" for="edit-username">Kullanıcı Adı</label>
                <input
                  id="edit-username"
                  type="text"
                  class="form-control"
                  [(ngModel)]="editUsername"
                  name="editUsername"
                  placeholder="Yeni kullanıcı adınız"
                  required
                />
                <div class="form-hint">3-50 karakter arası geçerli bir kullanıcı adı giriniz.</div>
              </div>

              <div class="form-group">
                <label class="form-label" for="edit-email">E-Posta Adresi</label>
                <input
                  id="edit-email"
                  type="email"
                  class="form-control"
                  [(ngModel)]="editEmail"
                  name="editEmail"
                  placeholder="Yeni e-posta adresiniz"
                  required
                />
                <div class="form-hint">E-posta adresinizi değiştirirseniz yeni adresinize doğrulama bağlantısı iletilecektir.</div>
              </div>

              @if (errorMessage()) {
                <div class="error-alert">
                  <span>⚠️</span>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <div class="edit-actions">
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="isSaving()"
                >
                  @if (isSaving()) {
                    <span>Kaydediliyor...</span>
                  } @else {
                    <span>💾 Değişiklikleri Kaydet</span>
                  }
                </button>
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="cancelEditing()"
                  [disabled]="isSaving()"
                >
                  İptal
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      padding-top: 30px;
      padding-bottom: 60px;
      display: flex;
      justify-content: center;
    }

    .profile-container {
      width: 100%;
      max-width: 720px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 30px;
    }

    @media (max-width: 600px) {
      .profile-header {
        flex-direction: column;
        text-align: center;
      }
      .profile-title-row {
        justify-content: center;
      }
    }

    .avatar-upload-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .profile-avatar-large {
      width: 84px;
      height: 84px;
      border-radius: 50%;
      background: var(--primary-gradient);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 800;
      box-shadow: 0 10px 24px -6px rgba(79, 70, 229, 0.45);
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      border: 3px solid var(--bg-surface);
      transition: var(--transition);
    }

    .profile-avatar-large:hover {
      transform: scale(1.04);
      box-shadow: 0 12px 28px -4px rgba(79, 70, 229, 0.55);
    }

    .avatar-img-element {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .avatar-overlay {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
      color: #ffffff;
    }

    .profile-avatar-large:hover .avatar-overlay {
      opacity: 1;
    }

    .avatar-quick-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
    }

    .btn-link-action {
      background: none;
      border: none;
      color: var(--primary);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
      transition: var(--transition);
    }

    .btn-link-action:hover {
      background: var(--primary-light);
      text-decoration: underline;
    }

    .btn-link-action.text-danger {
      color: var(--danger);
    }

    .btn-link-action.text-danger:hover {
      background: var(--danger-light);
    }

    .action-sep {
      color: var(--text-light);
    }

    .spinner-small {
      animation: spin 1s infinite linear;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .profile-main-info {
      flex: 1;
    }

    .profile-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 6px;
    }

    .profile-name {
      font-size: 24px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .profile-email {
      font-size: 15px;
      color: var(--text-secondary);
      margin: 0 0 4px 0;
    }

    .profile-meta {
      font-size: 13px;
      color: var(--text-muted);
      margin: 0;
    }

    /* Alert Banner Card */
    .alert-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px 24px;
    }

    .warning-alert-card {
      background: #fffbeb;
      border: 1px solid #fde68a;
    }

    .alert-icon-large {
      font-size: 28px;
    }

    .alert-details h3 {
      font-size: 16px;
      font-weight: 700;
      color: #92400e;
      margin: 0 0 6px 0;
    }

    .alert-details p {
      font-size: 13px;
      color: #b45309;
      line-height: 1.5;
      margin: 0 0 14px 0;
    }

    .alert-btn-group {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* Profile Info Card */
    .profile-info-card {
      padding: 30px;
    }

    .card-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .card-section-title {
      font-size: 18px;
      font-weight: 800;
      margin: 0 0 4px 0;
      color: var(--text-primary);
    }

    .card-section-desc {
      font-size: 13px;
      color: var(--text-muted);
      margin: 0 0 16px 0;
      line-height: 1.5;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--border);
      font-size: 14px;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-label {
      color: var(--text-secondary);
      font-weight: 500;
    }

    .info-value {
      color: var(--text-primary);
      font-weight: 600;
    }

    .text-success { color: var(--success); }
    .text-warning { color: var(--warning); }
    .font-bold { font-weight: 700; }

    /* Edit Form */
    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
      margin-top: 10px;
    }

    .edit-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 8px;
    }

    .error-alert {
      background: var(--danger-light);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: var(--danger);
      padding: 10px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  isEditing = signal(false);
  isSaving = signal(false);
  isResending = signal(false);
  isUploadingAvatar = signal(false);
  errorMessage = signal<string | null>(null);

  editUsername = '';
  editEmail = '';

  ngOnInit() {
    this.initFormData();
  }

  private initFormData() {
    const user = this.authService.currentUser();
    if (user) {
      this.editUsername = user.username;
      this.editEmail = user.email;
    }
  }

  startEditing() {
    this.initFormData();
    this.errorMessage.set(null);
    this.isEditing.set(true);
  }

  cancelEditing() {
    this.initFormData();
    this.errorMessage.set(null);
    this.isEditing.set(false);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    // Max 5 MB check
    if (file.size > 5 * 1024 * 1024) {
      this.toastService.error('Boyut Hatası', 'Profil resmi 5 MB\'dan küçük olmalıdır.');
      return;
    }

    this.isUploadingAvatar.set(true);
    this.authService.uploadAvatar(file).subscribe({
      next: (res) => {
        this.isUploadingAvatar.set(false);
        if (res.success) {
          this.toastService.success('Fotoğraf Güncellendi ✨', 'Yeni profil resminiz başarıyla kaydedildi.');
        } else {
          this.toastService.error('Hata', res.message);
        }
        input.value = '';
      },
      error: (err) => {
        this.isUploadingAvatar.set(false);
        const parsed = parseAuthError(err);
        this.toastService.error('Yükleme Başarısız', parsed.generalMessage);
        input.value = '';
      }
    });
  }

  removeAvatar() {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    this.isUploadingAvatar.set(true);
    this.authService.updateProfile({
      username: currentUser.username,
      email: currentUser.email,
      profilePictureUrl: ''
    }).subscribe({
      next: (res) => {
        this.isUploadingAvatar.set(false);
        if (res.success) {
          this.toastService.info('Profil Resmi Kaldırıldı', 'Varsayılan harfli profil görseline dönüldü.');
        } else {
          this.toastService.error('Hata', res.message);
        }
      },
      error: (err) => {
        this.isUploadingAvatar.set(false);
        const parsed = parseAuthError(err);
        this.toastService.error('Hata', parsed.generalMessage);
      }
    });
  }

  saveProfile() {
    if (!this.editUsername.trim() || !this.editEmail.trim()) {
      this.errorMessage.set('Kullanıcı adı ve e-posta alanları boş bırakılamaz.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const prevEmail = this.authService.currentUser()?.email;
    const newEmail = this.editEmail.trim();
    const newUsername = this.editUsername.trim();

    this.authService.updateProfile({
      username: newUsername,
      email: newEmail
    }).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.isEditing.set(false);
          if (prevEmail !== newEmail) {
            this.toastService.warning(
              'E-Posta Güncellendi',
              'Yeni e-posta adresinize doğrulama kodu gönderildi. Lütfen e-postanızı onaylayınız.'
            );
          } else {
            this.toastService.success('Profil Güncellendi', 'Kullanıcı adı ve bilgileriniz başarıyla kaydedildi.');
          }
        } else {
          this.errorMessage.set(res.message);
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        const parsed = parseAuthError(err);
        this.errorMessage.set(parsed.generalMessage);
        this.toastService.error('Güncelleme Hatası', parsed.generalMessage);
      }
    });
  }

  resendCode() {
    const email = this.authService.currentUser()?.email;
    if (!email) return;

    this.isResending.set(true);
    this.authService.resendConfirmation(email).subscribe({
      next: (res) => {
        this.isResending.set(false);
        if (res.success) {
          this.toastService.success('Kod Gönderildi 📬', 'Yeni doğrulama kodu e-posta adresinize iletildi.');
        } else {
          this.toastService.error('Hata', res.message);
        }
      },
      error: (err) => {
        this.isResending.set(false);
        const parsed = parseAuthError(err);
        this.toastService.error('Hata', parsed.generalMessage);
      }
    });
  }

  logout() {
    this.authService.logout();
    this.toastService.info('Oturum Kapatıldı', 'Güvenli bir şekilde çıkış yaptınız.');
  }
}

import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { parseAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
                {{ authService.roleDisplayName() }}
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
                Hesabınızın tüm özelliklerini kullanabilmek ve güvenliğinizi sağlamak için lütfen e-posta adresinize gönderilen bağlantıya tıklayarak onaylayınız.
              </p>
              <div class="alert-btn-group">
                <button
                  type="button"
                  class="btn btn-warning btn-sm"
                  (click)="resendCode()"
                  [disabled]="isResending()"
                >
                  @if (isResending()) {
                    <span>Gönderiliyor...</span>
                  } @else {
                    <span>🔄 Doğrulama Bağlantısını Tekrar Gönder</span>
                  }
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Yazar Bilgileri Kartı (Eğer Rol Yazar İse) -->
        @if (authService.isAuthor()) {
          <div class="card author-details-card">
            <div class="card-header-flex">
              <div>
                <h2 class="card-section-title">🎓 Yazar ve Akademik Bilgiler</h2>
                <p class="card-section-desc">Onaylanmış yazar profilinizin detayları</p>
              </div>
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Mezun Olunan Üniversite / Bölüm</span>
                <span class="info-value">{{ authService.currentUser()?.university || 'Belirtilmemiş' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Özgeçmiş / CV Belgesi</span>
                <span class="info-value">
                  @if (authService.currentUser()?.cvUrl) {
                    <a [href]="authService.currentUser()?.cvUrl" target="_blank" class="cv-link">
                      📄 Yüklenen CV Dosyasını Görüntüle
                    </a>
                  } @else {
                    <span class="text-muted">CV dosyası bulunmuyor</span>
                  }
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Yazar Başvuru Tarihi</span>
                <span class="info-value">
                  {{ authService.currentUser()?.authorApplicationDate ? (authService.currentUser()?.authorApplicationDate | date:'d MMMM y, HH:mm') : '—' }}
                </span>
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
                    {{ authService.roleDisplayName() }}
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
                <div class="form-hint alert-hint">⚠️ Dikkat: E-posta adresinizi değiştirirseniz güvenlik nedeniyle oturumunuz kapatılacak ve yeni adresinize onay bağlantısı gönderilecektir.</div>
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

        <!-- Şifre Değiştirme Kartı -->
        <div class="card password-change-card">
          <div class="card-header-flex">
            <div>
              <h2 class="card-section-title">🔒 Şifre Değiştir</h2>
              <p class="card-section-desc">Hesabınızın güvenliği için mevcut şifrenizi güncelleyin.</p>
            </div>
            @if (!isChangingPassword()) {
              <button class="btn btn-secondary btn-sm" (click)="isChangingPassword.set(true)">
                <span>🔑</span> Şifremi Değiştir
              </button>
            }
          </div>

          @if (isChangingPassword()) {
            <form (ngSubmit)="changePassword()" class="password-form">
              <div class="form-group">
                <label class="form-label" for="current-pwd">Mevcut Şifre</label>
                <input
                  id="current-pwd"
                  type="password"
                  class="form-control"
                  [(ngModel)]="currentPassword"
                  name="currentPassword"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="new-pwd">Yeni Şifre</label>
                <input
                  id="new-pwd"
                  type="password"
                  class="form-control"
                  [(ngModel)]="newPassword"
                  name="newPassword"
                  (ngModelChange)="onNewPasswordChange($event)"
                  placeholder="En az 8 karakter güçlü şifre"
                  required
                />

                @if (currentPassword && newPassword && currentPassword === newPassword) {
                  <div class="form-hint text-danger mt-1">⚠️ Yeni şifre eski şifrenizle aynı olamaz.</div>
                }

                @if (newPassword) {
                  <ul class="password-rules">
                    <li [class.rule-pass]="rules().hasMinLength">
                      <span>{{ rules().hasMinLength ? '✓' : '○' }}</span> En az 8 karakter
                    </li>
                    <li [class.rule-pass]="rules().hasUpperCase">
                      <span>{{ rules().hasUpperCase ? '✓' : '○' }}</span> En az 1 büyük harf (A-Z)
                    </li>
                    <li [class.rule-pass]="rules().hasLowerCase">
                      <span>{{ rules().hasLowerCase ? '✓' : '○' }}</span> En az 1 küçük harf (a-z)
                    </li>
                    <li [class.rule-pass]="rules().hasDigit">
                      <span>{{ rules().hasDigit ? '✓' : '○' }}</span> En az 1 rakam (0-9)
                    </li>
                    <li [class.rule-pass]="rules().hasSpecial">
                      <span>{{ rules().hasSpecial ? '✓' : '○' }}</span> En az 1 özel karakter (!&#64;#$%^&*)
                    </li>
                  </ul>
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="confirm-new-pwd">Yeni Şifre (Tekrar)</label>
                <input
                  id="confirm-new-pwd"
                  type="password"
                  class="form-control"
                  [(ngModel)]="confirmNewPassword"
                  name="confirmNewPassword"
                  placeholder="••••••••"
                  required
                />
                @if (confirmNewPassword && newPassword !== confirmNewPassword) {
                  <div class="form-hint text-danger">Şifreler eşleşmiyor.</div>
                }
              </div>

              @if (passwordError()) {
                <div class="error-alert">
                  <span>⚠️</span>
                  <span>{{ passwordError() }}</span>
                </div>
              }

              <div class="edit-actions">
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="isSavingPassword() || !isNewPasswordValid() || newPassword !== confirmNewPassword || currentPassword === newPassword"
                >
                  @if (isSavingPassword()) {
                    <span>Güncelleniyor...</span>
                  } @else {
                    <span>🔑 Şifreyi Güncelle</span>
                  }
                </button>
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="cancelPasswordChange()"
                  [disabled]="isSavingPassword()"
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
      max-width: 760px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 32px;
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-lg);
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.4);
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
      background: #eff6ff;
      border: 3px solid #1e3a8a;
      color: #1e3a8a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 800;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      transition: var(--transition);
    }

    .profile-avatar-large:hover {
      transform: scale(1.04);
      border-color: #f59e0b;
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
      background: rgba(15, 23, 42, 0.65);
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
      color: #1e40af;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
      transition: var(--transition);
    }

    .btn-link-action:hover {
      text-decoration: underline;
      color: #1d4ed8;
    }

    .btn-link-action.text-danger {
      color: #dc2626;
    }

    .action-sep {
      color: #cbd5e1;
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
      color: #0f172a;
      margin: 0;
    }

    .profile-email {
      font-size: 15px;
      color: #64748b;
      margin: 0 0 4px 0;
    }

    .profile-meta {
      font-size: 13px;
      color: #94a3b8;
      margin: 0;
    }

    /* Alert Banner Card */
    .alert-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px 24px;
      border-radius: var(--radius-md);
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
      color: #78350f;
      line-height: 1.5;
      margin: 0 0 14px 0;
    }

    .alert-btn-group {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* Profile Info Card & Author Details Card */
    .profile-info-card, .author-details-card, .password-change-card {
      padding: 32px;
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-lg);
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.4);
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
      color: #0f172a;
    }

    .card-section-desc {
      font-size: 13px;
      color: #64748b;
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
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-label {
      color: #64748b;
      font-weight: 600;
    }

    .info-value {
      color: #0f172a;
      font-weight: 600;
    }

    .cv-link {
      color: #1e40af;
      text-decoration: none;
      font-weight: 700;
    }

    .cv-link:hover {
      text-decoration: underline;
      color: #1d4ed8;
    }

    .text-success { color: #16a34a; }
    .text-warning { color: #d97706; }
    .text-danger { color: #dc2626; }
    .font-bold { font-weight: 700; }

    /* Forms */
    .edit-form, .password-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
      margin-top: 10px;
    }

    .form-group {
      margin-bottom: 4px;
    }

    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 6px;
    }

    .form-control {
      width: 100%;
      height: 44px;
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: var(--radius-md);
      padding: 0 14px;
      color: #0f172a;
      font-size: 14px;
      transition: var(--transition);
      outline: none;
    }

    .form-control:focus {
      background: #ffffff;
      border-color: #1e3a8a;
      box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.15);
    }

    .form-hint {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }

    .alert-hint {
      color: #b45309 !important;
      font-weight: 600;
    }

    .edit-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 8px;
    }

    .error-alert {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .password-rules {
      list-style: none;
      padding: 0;
      margin-top: 8px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 8px;
    }

    .password-rules li {
      font-size: 11.5px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .rule-pass {
      color: #16a34a !important;
      font-weight: 700;
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

  // Password Change
  isChangingPassword = signal(false);
  isSavingPassword = signal(false);
  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  passwordError = signal<string | null>(null);

  rules = signal({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasDigit: false,
    hasSpecial: false
  });

  isNewPasswordValid = computed(() => {
    const r = this.rules();
    return r.hasMinLength && r.hasUpperCase && r.hasLowerCase && r.hasDigit && r.hasSpecial;
  });

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

  onNewPasswordChange(value: string) {
    this.rules.set({
      hasMinLength: value.length >= 8,
      hasUpperCase: /[A-Z]/.test(value),
      hasLowerCase: /[a-z]/.test(value),
      hasDigit: /[0-9]/.test(value),
      hasSpecial: /[^a-zA-Z0-9]/.test(value)
    });
  }

  cancelPasswordChange() {
    this.isChangingPassword.set(false);
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmNewPassword = '';
    this.passwordError.set(null);
  }

  changePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmNewPassword) {
      this.passwordError.set('Lütfen tüm şifre alanlarını doldurunuz.');
      return;
    }

    if (this.currentPassword === this.newPassword) {
      this.passwordError.set('Yeni şifre eski şifrenizle aynı olamaz. Lütfen farklı bir şifre belirleyiniz.');
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.passwordError.set('Yeni şifreler eşleşmiyor.');
      return;
    }

    if (!this.isNewPasswordValid()) {
      this.passwordError.set('Yeni şifre belirlenen güvenlik kurallarını sağlamıyor.');
      return;
    }

    this.isSavingPassword.set(true);
    this.passwordError.set(null);

    this.authService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: (res: any) => {
        this.isSavingPassword.set(false);
        if (res.success) {
          this.toastService.success('Şifreniz Değiştirildi 🎉', 'Yeni şifreniz başarıyla kaydedildi.');
          this.cancelPasswordChange();
        } else {
          this.passwordError.set(res.message);
          this.toastService.error('Hata', res.message);
        }
      },
      error: (err: any) => {
        this.isSavingPassword.set(false);
        const parsed = parseAuthError(err, 'Şifre değiştirilemedi.');
        this.passwordError.set(parsed.generalMessage);
        this.toastService.error('Hata', parsed.generalMessage);
      }
    });
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
      next: (res: any) => {
        this.isUploadingAvatar.set(false);
        if (res.success) {
          this.toastService.success('Fotoğraf Güncellendi ✨', 'Yeni profil resminiz başarıyla kaydedildi.');
        } else {
          this.toastService.error('Hata', res.message);
        }
        input.value = '';
      },
      error: (err: any) => {
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
      next: (res: any) => {
        this.isUploadingAvatar.set(false);
        if (res.success) {
          this.toastService.info('Profil Resmi Kaldırıldı', 'Varsayılan harfli profil görseline dönüldü.');
        } else {
          this.toastService.error('Hata', res.message);
        }
      },
      error: (err: any) => {
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
      next: (res: any) => {
        this.isSaving.set(false);
        if (res.success) {
          this.isEditing.set(false);
          if (prevEmail !== newEmail) {
            this.toastService.warning(
              'E-Posta Değiştirildi!',
              'Güvenlik gereği oturumunuz kapatıldı. Yeni e-posta adresinize gönderilen bağlantı ile hesabınızı doğrulayınız.'
            );
            // Automatic logout upon email update as requested
            this.authService.logout();
            this.router.navigate(['/login']);
          } else {
            this.toastService.success('Profil Güncellendi', 'Kullanıcı adı ve bilgileriniz başarıyla kaydedildi.');
          }
        } else {
          this.errorMessage.set(res.message);
        }
      },
      error: (err: any) => {
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
      next: (res: any) => {
        this.isResending.set(false);
        if (res.success) {
          this.toastService.success('Bağlantı Gönderildi 📬', 'Doğrulama bağlantısı e-posta adresinize iletildi.');
        } else {
          this.toastService.error('Hata', res.message);
        }
      },
      error: (err: any) => {
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

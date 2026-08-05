import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { parseAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page-container container">
      <div class="auth-card card">
        <div class="auth-header">
          <div class="auth-icon-badge">🔐</div>
          <h1 class="auth-title">Giriş Yap</h1>
          <p class="auth-subtitle">Lumina hesabınıza erişmek için bilgilerinizi giriniz</p>
        </div>

        @if (authService.sessionWarning()) {
          <div class="session-alert">
            <span class="alert-icon">⚠️</span>
            <div class="alert-msg">
              <strong>Oturum Uyarısı:</strong> {{ authService.sessionWarning() }}
            </div>
            <button type="button" class="alert-dismiss" (click)="authService.clearSessionWarning()">✕</button>
          </div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="login-email">E-Posta veya Kullanıcı Adı</label>
            <input
              id="login-email"
              type="text"
              class="form-control"
              [(ngModel)]="emailOrUsername"
              name="emailOrUsername"
              placeholder="Örn: saliha@example.com veya sahilcicek44"
              required
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <div class="password-label-row">
              <label class="form-label" for="login-password">Şifre</label>
            </div>
            <div class="password-input-wrapper">
              <input
                id="login-password"
                [type]="showPassword() ? 'text' : 'password'"
                class="form-control"
                [(ngModel)]="password"
                name="password"
                placeholder="••••••••"
                required
                autocomplete="current-password"
              />
              <button
                type="button"
                class="toggle-password-btn"
                (click)="togglePassword()"
                title="Şifreyi Göster/Gizle"
              >
                {{ showPassword() ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          @if (errorMessage()) {
            <div class="error-alert" [class.error-email-confirm]="isEmailConfirmError()">
              <span class="error-icon">{{ isEmailConfirmError() ? '📧' : '⚠️' }}</span>
              <div class="error-content">
                <span>{{ errorMessage() }}</span>
                @if (isEmailConfirmError()) {
                  <button type="button" class="confirm-redirect-btn" (click)="goToConfirmEmail()">
                    📬 E-Posta Doğrulama Sayfasına Git →
                  </button>
                }
              </div>
            </div>
          }

          <button
            type="submit"
            class="btn btn-primary btn-block btn-lg"
            [disabled]="isLoading()"
          >
            @if (isLoading()) {
              <span>Giriş Yapılıyor...</span>
            } @else {
              <span>🔐 Giriş Yap</span>
            }
          </button>
        </form>

        <div class="auth-footer">
          <div class="footer-row">
            <span>Hesabınız yok mu?</span>
            <a routerLink="/register" class="link-text">Hemen Kayıt Olun</a>
          </div>
          <div class="footer-row footer-secondary">
            <span>Doğrulama kodunuz mu var?</span>
            <a routerLink="/confirm-email" class="link-text">E-Postanızı Doğrulayın</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 240px);
      padding: 30px 16px;
    }

    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 36px 32px;
      animation: fadeIn 0.2s ease-out;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 26px;
    }

    .auth-icon-badge {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: var(--primary-light);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin: 0 auto 14px auto;
    }

    .auth-title {
      font-size: 24px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0 0 6px 0;
    }

    .auth-subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin: 0;
    }

    .session-alert {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 12px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      margin-bottom: 18px;
    }

    .alert-icon { font-size: 16px; }
    .alert-msg { flex: 1; line-height: 1.4; }
    .alert-dismiss {
      background: none;
      border: none;
      color: #991b1b;
      font-weight: 700;
      cursor: pointer;
      padding: 0;
    }

    .password-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .password-input-wrapper {
      position: relative;
    }

    .toggle-password-btn {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      padding: 4px;
      color: var(--text-muted);
    }

    .error-alert {
      background: var(--danger-light);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: var(--danger);
      padding: 12px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 20px;
    }

    .error-email-confirm {
      background: #fffbeb;
      border-color: #fde68a;
      color: #92400e;
    }

    .error-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }

    .confirm-redirect-btn {
      background: #f59e0b;
      color: #ffffff;
      border: none;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      align-self: flex-start;
      transition: var(--transition);
    }

    .confirm-redirect-btn:hover {
      background: #d97706;
    }

    .auth-footer {
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 13px;
      color: var(--text-secondary);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .footer-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .footer-secondary {
      font-size: 12px;
      color: var(--text-muted);
    }

    .link-text {
      color: var(--primary);
      font-weight: 700;
      text-decoration: none;
    }

    .link-text:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  emailOrUsername = '';
  password = '';
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  isEmailConfirmError = signal(false);

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  goToConfirmEmail() {
    const input = this.emailOrUsername.trim();
    const isEmail = input.includes('@');
    if (isEmail) {
      this.authService.pendingConfirmEmail.set(input);
      this.router.navigate(['/confirm-email'], { queryParams: { email: input } });
    } else {
      this.router.navigate(['/confirm-email']);
    }
  }

  onSubmit() {
    if (!this.emailOrUsername || !this.password) {
      this.errorMessage.set('Lütfen e-posta ve şifrenizi giriniz.');
      this.isEmailConfirmError.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.isEmailConfirmError.set(false);

    this.authService.login({
      emailOrUsername: this.emailOrUsername,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.toastService.success('Giriş Başarılı 🎉', `Hoş geldiniz, ${res.data?.user.username}!`);
          this.router.navigate(['/profile']);
        } else {
          this.errorMessage.set(res.message);
          this.isEmailConfirmError.set(
            res.message?.toLowerCase().includes('doğrulanmamış') ||
            res.message?.toLowerCase().includes('onaylanmamış') ||
            false
          );
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const parsed = parseAuthError(err);
        const msg = parsed.generalMessage;
        this.errorMessage.set(msg);
        this.isEmailConfirmError.set(
          msg.toLowerCase().includes('doğrulanmamış') ||
          msg.toLowerCase().includes('onaylanmamış')
        );
        if (!this.isEmailConfirmError()) {
          this.toastService.error('Giriş Hatası', msg);
        } else {
          this.toastService.warning('Doğrulama Gerekli', 'Hesabınızı kullanmak için önce e-posta onayı yapmalısınız.');
        }
      }
    });
  }
}

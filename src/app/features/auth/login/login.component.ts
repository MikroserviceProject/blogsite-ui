import { Component, inject, signal, OnInit } from '@angular/core';
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
      <div class="auth-card card login-card">
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

        <form (ngSubmit)="onSubmit()" autocomplete="off">
          <div class="form-group">
            <label class="form-label" for="login-email">E-Posta veya Kullanıcı Adı</label>
            <input
              id="login-email"
              type="text"
              class="form-control"
              [(ngModel)]="emailOrUsername"
              name="emailOrUsername"
              placeholder="adiniz@ornek.com veya kullaniciadi"
              required
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
            />
          </div>

          <div class="form-group">
            <div class="password-label-row">
              <label class="form-label" for="login-password">Şifre</label>
              <a routerLink="/forgot-password" class="forgot-link">Şifrenizi mi unuttunuz?</a>
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
                autocomplete="new-password"
              />
              <button
                type="button"
                class="toggle-password-btn"
                (click)="togglePassword()"
                tabindex="-1"
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
            <a routerLink="/register" class="link-gold">Hemen Kayıt Olun</a>
          </div>

          <!-- Doğrulama E-Postası Almadınız mı? Accordion Butonu -->
          <div class="resend-accordion-wrapper">
            <button 
              type="button" 
              class="btn-toggle-resend" 
              (click)="isResendOpen.set(!isResendOpen())"
            >
              <span>{{ isResendOpen() ? '▲' : '▼' }}</span>
              <span>Doğrulama e-postası almadınız mı? Tekrar Gönder</span>
            </button>

            @if (isResendOpen()) {
              <div class="resend-panel card">
                <div class="rp-title">✉️ Doğrulama Bağlantısını Yeniden Alın</div>
                <p class="rp-desc">Kayıtlı e-posta adresinizi girerek yeni bir aktivasyon bağlantısı isteyebilirsiniz:</p>
                <div class="rp-form">
                  <input
                    type="email"
                    class="form-control form-control-sm"
                    [(ngModel)]="resendEmailInput"
                    placeholder="ornek@mail.com"
                  />
                  <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    (click)="onResendConfirmation()"
                    [disabled]="isResending() || !resendEmailInput"
                  >
                    @if (isResending()) {
                      <span>Gönderiliyor...</span>
                    } @else {
                      <span>📨 Gönder</span>
                    }
                  </button>
                </div>
                @if (resendMessage()) {
                  <div class="rp-result" [class.rp-error]="resendIsError()">
                    {{ resendMessage() }}
                  </div>
                }
              </div>
            }
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
      min-height: calc(100vh - 120px);
      padding: 40px 16px;
    }

    .login-card {
      width: 100%;
      max-width: 460px;
      padding: 38px 34px;
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-lg);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
      animation: fadeIn 0.2s ease-out;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 26px;
    }

    .auth-icon-badge {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-lg);
      background: #eff6ff;
      border: 1.5px solid #bfdbfe;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      margin: 0 auto 14px auto;
    }

    .auth-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px 0;
      letter-spacing: -0.5px;
    }

    .auth-subtitle {
      font-size: 13px;
      color: #64748b;
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

    .form-group {
      margin-bottom: 18px;
    }

    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 6px;
    }

    .password-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .forgot-link {
      font-size: 12px;
      color: #1e40af;
      font-weight: 700;
      text-decoration: none;
      transition: var(--transition);
    }

    .forgot-link:hover {
      text-decoration: underline;
      color: #1d4ed8;
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

    .form-control::placeholder {
      color: #94a3b8;
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
      color: #64748b;
    }

    .error-alert {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
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
      background: #1e3a8a;
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
      background: #1e40af;
      box-shadow: 0 2px 8px rgba(30, 58, 138, 0.25);
    }

    .btn-block {
      width: 100%;
      justify-content: center;
      margin-top: 10px;
    }

    .auth-footer {
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .footer-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 13px;
      color: #64748b;
    }

    .link-gold {
      color: #d97706;
      font-weight: 700;
      text-decoration: none;
    }

    .link-gold:hover {
      text-decoration: underline;
      color: #b45309;
    }

    /* Resend Accordion */
    .resend-accordion-wrapper {
      text-align: center;
    }

    .btn-toggle-resend {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #475569;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: var(--transition);
      padding: 7px 12px;
      border-radius: var(--radius-sm);
    }

    .btn-toggle-resend:hover {
      color: #0f172a;
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .resend-panel {
      margin-top: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 16px;
      border-radius: var(--radius-md);
      text-align: left;
      animation: fadeIn 0.15s ease-out;
    }

    .rp-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .rp-desc {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 10px;
      line-height: 1.4;
    }

    .rp-form {
      display: flex;
      gap: 8px;
    }

    .form-control-sm {
      height: 38px;
      font-size: 13px;
    }

    .rp-result {
      margin-top: 10px;
      font-size: 12px;
      color: #15803d;
      font-weight: 600;
    }

    .rp-error {
      color: #b91c1c !important;
    }
  `]
})
export class LoginComponent implements OnInit {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  emailOrUsername = '';
  password = '';
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  isEmailConfirmError = signal(false);

  // Doğrulama maili tekrar gönderim akordeonu
  isResendOpen = signal(false);
  resendEmailInput = '';
  isResending = signal(false);
  resendMessage = signal<string | null>(null);
  resendIsError = signal(false);

  ngOnInit() {
    this.emailOrUsername = '';
    this.password = '';
    this.authService.clearSessionWarning();
  }

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

  onResendConfirmation() {
    if (!this.resendEmailInput) return;

    this.isResending.set(true);
    this.resendMessage.set(null);
    this.resendIsError.set(false);

    this.authService.resendConfirmation(this.resendEmailInput.trim()).subscribe({
      next: (res: any) => {
        this.isResending.set(false);
        if (res.success) {
          this.resendMessage.set('✅ Yeni doğrulama bağlantısı e-posta adresinize gönderildi.');
          this.toastService.success('Başarılı 📬', 'Doğrulama e-postası gönderildi!');
        } else {
          this.resendIsError.set(true);
          this.resendMessage.set(`⚠️ ${res.message || 'İşlem başarısız.'}`);
        }
      },
      error: (err: any) => {
        this.isResending.set(false);
        this.resendIsError.set(true);
        const parsed = parseAuthError(err, 'Doğrulama e-postası gönderilemedi.');
        this.resendMessage.set(`⚠️ ${parsed.generalMessage}`);
      }
    });
  }

  onSubmit() {
    if (!this.emailOrUsername || !this.password) {
      this.errorMessage.set('Lütfen e-posta / kullanıcı adı ve şifrenizi giriniz.');
      this.isEmailConfirmError.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.isEmailConfirmError.set(false);

    this.authService.login({
      emailOrUsername: this.emailOrUsername.trim(),
      password: this.password
    }).subscribe({
      next: (res: any) => {
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
      error: (err: any) => {
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

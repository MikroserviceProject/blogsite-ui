import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { parseAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page-container container">
      <div class="auth-card card reset-card">
        <div class="auth-header">
          <div class="auth-icon-badge">🔒</div>
          <h1 class="auth-title">Yeni Şifre Belirleyin</h1>
          <p class="auth-subtitle">Hesabınız için güçlü ve yeni bir şifre oluşturun</p>
        </div>

        @if (isSuccess()) {
          <div class="success-box card">
            <div class="success-icon">🎉</div>
            <h3 class="success-title">Şifreniz Güncellendi!</h3>
            <p class="success-desc">
              Hesap şifreniz başarıyla sıfırlandı. Yeni şifrenizle hemen giriş yapabilirsiniz.
            </p>
            <div class="success-actions">
              <a routerLink="/login" class="btn btn-primary btn-block">
                🔐 Giriş Sayfasına Git
              </a>
            </div>
          </div>
        } @else {
          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label" for="reset-email">E-Posta Adresi</label>
              <input
                id="reset-email"
                type="email"
                class="form-control"
                [(ngModel)]="email"
                name="email"
                placeholder="E-posta adresiniz"
                required
                readonly
              />
            </div>

            <!-- Token input (Otomatik doldurulur, gizli veya readonly) -->
            @if (!token) {
              <div class="form-group">
                <label class="form-label" for="reset-token">Sıfırlama Kodu / Token</label>
                <input
                  id="reset-token"
                  type="text"
                  class="form-control font-mono"
                  [(ngModel)]="token"
                  name="token"
                  placeholder="E-postadaki bağlantı veya kod"
                  required
                />
              </div>
            }

            <div class="form-group">
              <label class="form-label" for="reset-new-password">Yeni Şifre</label>
              <div class="password-input-wrap">
                <input
                  id="reset-new-password"
                  [type]="showPassword() ? 'text' : 'password'"
                  class="form-control"
                  [(ngModel)]="newPassword"
                  name="newPassword"
                  placeholder="En az 8 karakter..."
                  required
                />
                <button
                  type="button"
                  class="btn-eye"
                  (click)="showPassword.set(!showPassword())"
                  tabindex="-1"
                >
                  {{ showPassword() ? '👁️' : '🔒' }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="reset-confirm-password">Yeni Şifre Tekrar</label>
              <div class="password-input-wrap">
                <input
                  id="reset-confirm-password"
                  [type]="showPassword() ? 'text' : 'password'"
                  class="form-control"
                  [(ngModel)]="confirmPassword"
                  name="confirmPassword"
                  placeholder="Yeni şifrenizi tekrar giriniz"
                  required
                />
              </div>
              @if (confirmPassword && newPassword !== confirmPassword) {
                <div class="text-danger font-xs mt-1">⚠️ Şifreler birbiriyle eşleşmiyor.</div>
              }
            </div>

            <!-- Şifre Güvenlik Kriterleri -->
            <div class="password-rules-box">
              <div class="rules-title">Şifre Güvenlik Gereksinimleri:</div>
              <div class="rule-item" [class.rule-valid]="hasMinLength()">
                <span>{{ hasMinLength() ? '✓' : '○' }}</span> En az 8 karakter
              </div>
              <div class="rule-item" [class.rule-valid]="hasUpper()">
                <span>{{ hasUpper() ? '✓' : '○' }}</span> En az bir büyük harf (A-Z)
              </div>
              <div class="rule-item" [class.rule-valid]="hasLower()">
                <span>{{ hasLower() ? '✓' : '○' }}</span> En az bir küçük harf (a-z)
              </div>
              <div class="rule-item" [class.rule-valid]="hasNumber()">
                <span>{{ hasNumber() ? '✓' : '○' }}</span> En az bir rakam (0-9)
              </div>
              <div class="rule-item" [class.rule-valid]="hasSpecial()">
                <span>{{ hasSpecial() ? '✓' : '○' }}</span> En az bir özel karakter (!&#64;#$%^&* vb.)
              </div>
            </div>

            @if (errorMessage()) {
              <div class="alert alert-danger">
                <span>⚠️</span>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <button
              type="submit"
              class="btn btn-primary btn-block btn-lg"
              [disabled]="isLoading() || !isFormValid()"
            >
              @if (isLoading()) {
                <span class="spinner-small">⏳</span>
                <span>Güncelleniyor...</span>
              } @else {
                <span>🔒 Şifremi Yenile</span>
              }
            </button>

            <div class="auth-footer-links">
              <a routerLink="/login" class="link-gold">🔐 Giriş Ekranına Dön</a>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page-container {
      min-height: calc(100vh - 72px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 16px;
    }

    .reset-card {
      max-width: 480px;
      width: 100%;
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
      margin-bottom: 28px;
    }

    .auth-icon-badge {
      width: 56px;
      height: 56px;
      background: #eff6ff;
      border: 1.5px solid #bfdbfe;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      margin: 0 auto 16px;
    }

    .auth-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 6px;
      letter-spacing: -0.5px;
    }

    .auth-subtitle {
      font-size: 13px;
      color: #64748b;
      margin: 0;
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

    .password-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .form-control {
      width: 100%;
      height: 46px;
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

    .form-control[readonly] {
      background: #f1f5f9;
      color: #64748b;
      border-color: #e2e8f0;
      cursor: not-allowed;
    }

    .btn-eye {
      position: absolute;
      right: 12px;
      background: transparent;
      border: none;
      font-size: 16px;
      cursor: pointer;
      opacity: 0.7;
      transition: var(--transition);
    }

    .btn-eye:hover {
      opacity: 1;
    }

    .password-rules-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-md);
      padding: 12px 14px;
      margin-bottom: 20px;
    }

    .rules-title {
      font-size: 12px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 8px;
    }

    .rule-item {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: var(--transition);
    }

    .rule-valid {
      color: #16a34a;
      font-weight: 700;
    }

    .btn-block {
      width: 100%;
      justify-content: center;
      margin-top: 10px;
    }

    .auth-footer-links {
      text-align: center;
      margin-top: 20px;
      font-size: 13px;
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

    .font-xs {
      font-size: 12px;
    }

    .mt-1 {
      margin-top: 4px;
    }

    .text-danger {
      color: #ef4444;
    }

    .success-box {
      text-align: center;
      padding: 24px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: var(--radius-md);
    }

    .success-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }

    .success-title {
      font-size: 18px;
      font-weight: 700;
      color: #15803d;
      margin-bottom: 10px;
    }

    .success-desc {
      font-size: 13px;
      color: #334155;
      line-height: 1.6;
      margin-bottom: 20px;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  email = '';
  token = '';
  newPassword = '';
  confirmPassword = '';

  showPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Validation Signals
  hasMinLength = computed(() => this.newPassword.length >= 8);
  hasUpper = computed(() => /[A-Z]/.test(this.newPassword));
  hasLower = computed(() => /[a-z]/.test(this.newPassword));
  hasNumber = computed(() => /[0-9]/.test(this.newPassword));
  hasSpecial = computed(() => /[^a-zA-Z0-9]/.test(this.newPassword));

  isPasswordValid = computed(() => 
    this.hasMinLength() && this.hasUpper() && this.hasLower() && this.hasNumber() && this.hasSpecial()
  );

  isFormValid = computed(() => 
    !!this.email && !!this.token && this.isPasswordValid() && this.newPassword === this.confirmPassword
  );

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      }
      if (params['token']) {
        this.token = params['token'];
      }
    });
  }

  onSubmit() {
    if (!this.isFormValid()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.resetPassword({
      email: this.email,
      token: this.token,
      newPassword: this.newPassword
    }).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (res.success) {
          this.isSuccess.set(true);
          this.toast.success('Başarılı 🎉', 'Şifreniz başarıyla güncellendi!');
        } else {
          this.errorMessage.set(res.message || 'Şifre sıfırlanamadı.');
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        const parsed = parseAuthError(err, 'Şifre sıfırlama işlemi başarısız.');
        this.errorMessage.set(parsed.generalMessage);
      }
    });
  }
}

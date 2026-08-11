import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { parseAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page-container container">
      <div class="auth-card card forgot-card">
        <div class="auth-header">
          <div class="auth-icon-badge">🔑</div>
          <h1 class="auth-title">Şifremi Unuttum</h1>
          <p class="auth-subtitle">Hesabınıza bağlı e-posta adresinizi giriniz</p>
        </div>

        @if (isSuccess()) {
          <div class="success-box card">
            <div class="success-icon"></div>
            <h3 class="success-title">Sıfırlama Bağlantısı Gönderildi!</h3>
            <p class="success-desc">
              <strong>{{ email }}</strong> adresine şifre sıfırlama bağlantısı iletilmiştir. Lütfen gelen kutunuzu (ve gerekirse spam klasörünü) kontrol ediniz.
            </p>
            <div class="success-actions">
              <a routerLink="/login" class="btn btn-primary btn-block">
                🔐 Giriş Sayfasına Dön
              </a>
            </div>
          </div>
        } @else {
          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label" for="forgot-email">E-Posta Adresi</label>
              <input
                id="forgot-email"
                type="email"
                class="form-control"
                [(ngModel)]="email"
                name="email"
                placeholder="Örn: adiniz@ornek.com"
                required
                autocomplete="email"
              />
              <div class="form-hint">Şifre sıfırlama bağlantısı bu adrese gönderilecektir.</div>
            </div>

            @if (errorMessage()) {
              <div class="alert alert-danger">
                <span></span>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <button
              type="submit"
              class="btn btn-primary btn-block btn-lg"
              [disabled]="isLoading() || !email"
            >
              @if (isLoading()) {
                <span class="spinner-small"></span>
                <span>Gönderiliyor...</span>
              } @else {
                <span>📨 Sıfırlama Bağlantısı Gönder</span>
              }
            </button>

            <div class="auth-footer-links">
              <span class="text-muted">Şifrenizi hatırladınız mı?</span>
              <a routerLink="/login" class="link-gold">Giriş Yap</a>
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

    .forgot-card {
      max-width: 460px;
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
      margin-bottom: 22px;
    }

    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 8px;
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

    .form-hint {
      font-size: 11px;
      color: #64748b;
      margin-top: 6px;
    }

    .btn-block {
      width: 100%;
      justify-content: center;
      margin-top: 10px;
    }

    .auth-footer-links {
      text-align: center;
      margin-top: 24px;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
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
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  email = '';
  isLoading = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  onSubmit() {
    if (!this.email) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (res.success) {
          this.isSuccess.set(true);
          this.toast.success('Başarılı ', res.message || 'Sıfırlama bağlantısı e-postanıza iletildi.');
        } else {
          this.errorMessage.set(res.message || 'İşlem gerçekleştirilemedi.');
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        const parsed = parseAuthError(err, 'Şifre sıfırlama talebi başarısız oldu.');
        this.errorMessage.set(parsed.generalMessage);
      }
    });
  }
}

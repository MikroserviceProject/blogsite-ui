import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { parseAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page-container container">
      <div class="auth-card card">
        <div class="auth-header">
          <div class="auth-icon-badge">✉️</div>
          <h1 class="auth-title">E-Posta Doğrulama</h1>
          <p class="auth-subtitle">Hesabınızı aktifleştirmek için 6 haneli kodu giriniz</p>
        </div>

        <div class="info-alert">
          <span class="info-icon">ℹ️</span>
          <div class="info-text">
            E-posta adresinize 6 haneli bir doğrulama kodu gönderildi. Lütfen gelen kutunuzu (ve Spam klasörünü) kontrol ediniz.
          </div>
        </div>

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="confirm-email">E-Posta Adresi</label>
            <input
              id="confirm-email"
              type="email"
              class="form-control"
              [(ngModel)]="email"
              name="email"
              placeholder="sahilcicek44@gmail.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <div class="code-label-row">
              <label class="form-label" for="confirm-token">6 Haneli Doğrulama Kodu</label>
              <button
                type="button"
                class="resend-code-btn"
                (click)="onResendCode()"
                [disabled]="isResending()"
              >
                @if (isResending()) {
                  <span>Gönderiliyor...</span>
                } @else {
                  <span>🔄 Kodu Tekrar Gönder</span>
                }
              </button>
            </div>
            <input
              id="confirm-token"
              type="text"
              class="form-control code-input"
              [(ngModel)]="token"
              name="token"
              placeholder="123456"
              maxlength="6"
              required
              autocomplete="one-time-code"
            />
            <div class="form-hint">E-postanıza gelen 6 haneli aktivasyon kodunu yazınız.</div>
          </div>

          @if (errorMessage()) {
            <div class="error-alert">
              <span>⚠️</span>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <button
            type="submit"
            class="btn btn-primary btn-block btn-lg"
            [disabled]="isLoading()"
          >
            @if (isLoading()) {
              <span>Doğrulanıyor...</span>
            } @else {
              <span>✉️ Hesabı Doğrula</span>
            }
          </button>
        </form>

        <div class="auth-footer">
          <div class="footer-row">
            <span>Hesabınız zaten onaylı mı?</span>
            <a routerLink="/login" class="link-text">Giriş Yapın</a>
          </div>
          <div class="footer-row footer-secondary">
            <span>Yeni bir hesap oluşturmak için</span>
            <a routerLink="/register" class="link-text">Kayıt Olun</a>
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
      max-width: 460px;
      padding: 36px 32px;
      animation: fadeIn 0.2s ease-out;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 20px;
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

    .info-alert {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      padding: 12px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 22px;
      line-height: 1.45;
    }

    .info-icon {
      font-size: 16px;
    }

    .code-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .resend-code-btn {
      background: none;
      border: none;
      color: var(--primary);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      padding: 0;
      transition: var(--transition);
    }

    .resend-code-btn:hover:not(:disabled) {
      text-decoration: underline;
    }

    .resend-code-btn:disabled {
      color: var(--text-light);
      cursor: not-allowed;
    }

    .code-input {
      font-family: var(--font-mono);
      font-size: 24px;
      letter-spacing: 8px;
      text-align: center;
      font-weight: 800;
      padding: 12px;
    }

    .error-alert {
      background: var(--danger-light);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: var(--danger);
      padding: 12px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
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
export class ConfirmEmailComponent implements OnInit {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  email = '';
  token = '';
  isLoading = signal(false);
  isResending = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    // URL parametresinden veya authService'ten e-postayı oku
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      } else if (this.authService.pendingConfirmEmail()) {
        this.email = this.authService.pendingConfirmEmail();
      } else if (this.authService.currentUser()?.email) {
        this.email = this.authService.currentUser()!.email;
      }
    });
  }

  onResendCode() {
    const targetEmail = this.email.trim();
    if (!targetEmail) {
      this.toastService.warning('E-Posta Eksik', 'Lütfen kod gönderilecek e-posta adresini yazınız.');
      return;
    }

    this.isResending.set(true);
    this.errorMessage.set(null);

    this.authService.resendConfirmation(targetEmail).subscribe({
      next: (res) => {
        this.isResending.set(false);
        if (res.success) {
          this.toastService.success('Kod Gönderildi! 📬', 'Yeni doğrulama kodu e-posta adresinize iletildi.');
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

  onSubmit() {
    if (!this.email || !this.token) {
      this.errorMessage.set('Lütfen e-posta adresinizi ve 6 haneli onay kodunu giriniz.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.confirmEmail({
      email: this.email.trim(),
      token: this.token.trim()
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.toastService.success('Doğrulama Başarılı! 🎉', 'E-posta adresiniz onaylandı. Giriş yapabilirsiniz.');
          this.router.navigate(['/login']);
        } else {
          this.errorMessage.set(res.message);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const parsed = parseAuthError(err);
        this.errorMessage.set(parsed.generalMessage);
        this.toastService.error('Doğrulama Hatası', parsed.generalMessage);
      }
    });
  }
}

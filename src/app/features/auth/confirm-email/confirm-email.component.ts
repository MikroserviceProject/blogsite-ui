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
        
        <!-- DURUM 1: Linke Tıklandı & Otomatik Doğrulanıyor -->
        @if (isAutoVerifying()) {
          <div class="status-view">
            <div class="spinner-badge">
              <span class="loading-spinner"></span>
            </div>
            <h1 class="status-title">E-Posta Doğrulanıyor</h1>
            <p class="status-subtitle">Bağlantınız kontrol ediliyor, lütfen bir saniye bekleyiniz...</p>
          </div>
        }

        <!-- DURUM 2: Doğrulama Başarılı Oldu -->
        @else if (isVerified()) {
          <div class="status-view success-view">
            <div class="status-icon-badge success-badge">✅</div>
            <h1 class="status-title">Doğrulama Başarılı!</h1>
            <p class="status-subtitle">
              E-posta adresiniz başarıyla onaylandı. Hesabınız artık tamamen aktif.
            </p>
            <div class="action-btn-group">
              <a routerLink="/login" class="btn btn-primary btn-block btn-lg">
                🚀 Hemen Giriş Yap
              </a>
            </div>
            <p class="redirect-hint">Birkaç saniye içinde otomatik olarak giriş sayfasına yönlendirileceksiniz...</p>
          </div>
        }

        <!-- DURUM 3: Doğrulama Başarısız Oldu veya Linkin Süresi Doldu -->
        @else if (verificationFailed()) {
          <div class="status-view error-view">
            <div class="status-icon-badge error-badge">⚠️</div>
            <h1 class="status-title">Doğrulama Yapılamadı</h1>
            <p class="status-subtitle">
              {{ errorMessage() || 'Doğrulama bağlantısı geçersiz veya süresi dolmuş.' }}
            </p>

            <div class="resend-box">
              <label class="form-label" for="resend-email">Yeni Bir Doğrulama Linki İste</label>
              <div class="resend-input-group">
                <input
                  id="resend-email"
                  type="email"
                  class="form-control"
                  [(ngModel)]="email"
                  name="email"
                  placeholder="eposta@ornek.com"
                  required
                />
                <button
                  type="button"
                  class="btn btn-primary"
                  (click)="onResendLink()"
                  [disabled]="isResending()"
                >
                  @if (isResending()) {
                    <span>Gönderiliyor...</span>
                  } @else {
                    <span>🔄 Yeni Link Gönder</span>
                  }
                </button>
              </div>
            </div>

            <div class="auth-footer">
              <div class="footer-row">
                <a routerLink="/login" class="link-text">← Giriş Sayfasına Dön</a>
              </div>
            </div>
          </div>
        }

        <!-- DURUM 4: Kayıt Sonrası Bekleme Ekranı (Link Gönderildi Ekranı) -->
        @else {
          <div class="status-view info-view">
            <div class="status-icon-badge mail-badge">📬</div>
            <h1 class="status-title">E-Postanızı Kontrol Edin</h1>
            <p class="status-subtitle">
              Hesabınızı aktifleştirmek için tek yapmanız gereken gelen kutunuzdaki bağlantıya tıklamak.
            </p>

            <div class="info-alert">
              <span class="info-icon">💡</span>
              <div class="info-text">
                @if (email) {
                  <strong>{{ email }}</strong> adresinize tek tıkla doğrulama bağlantısı gönderildi.
                } @else {
                  E-posta adresinize tek tıkla doğrulama bağlantısı gönderildi.
                }
                Lütfen gelen kutunuzu (ve <strong>Spam / Gereksiz</strong> klasörünü) kontrol edip <strong>"E-Posta Adresimi Doğrula"</strong> butonuna tıklayınız.
              </div>
            </div>

            <div class="resend-section">
              <p class="resend-prompt">E-posta elinize ulaşmadı mı?</p>
              <div class="resend-input-group">
                <input
                  type="email"
                  class="form-control"
                  [(ngModel)]="email"
                  name="email"
                  placeholder="eposta@ornek.com"
                  required
                />
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="onResendLink()"
                  [disabled]="isResending()"
                >
                  @if (isResending()) {
                    <span>Gönderiliyor...</span>
                  } @else {
                    <span>🔄 Tekrar Gönder</span>
                  }
                </button>
              </div>
            </div>

            <div class="auth-footer">
              <div class="footer-row">
                <span>Zaten onayladınız mı?</span>
                <a routerLink="/login" class="link-text">Giriş Yapın</a>
              </div>
            </div>
          </div>
        }

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
      max-width: 480px;
      padding: 38px 32px;
      animation: fadeIn 0.25s ease-out;
    }

    .status-view {
      text-align: center;
    }

    .status-icon-badge {
      width: 60px;
      height: 60px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin: 0 auto 16px auto;
    }

    .mail-badge {
      background: rgba(30, 58, 138, 0.08);
      border: 1.5px solid rgba(30, 58, 138, 0.2);
      color: #1e3a8a;
    }

    .success-badge {
      background: rgba(16, 185, 129, 0.1);
      border: 1.5px solid rgba(16, 185, 129, 0.25);
    }

    .error-badge {
      background: rgba(239, 68, 68, 0.1);
      border: 1.5px solid rgba(239, 68, 68, 0.25);
    }

    .spinner-badge {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 20px;
    }

    .loading-spinner {
      width: 44px;
      height: 44px;
      border: 3.5px solid rgba(30, 58, 138, 0.15);
      border-top-color: #1e3a8a;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .status-title {
      font-size: 24px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0 0 8px 0;
      letter-spacing: -0.3px;
    }

    .status-subtitle {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.55;
      margin: 0 0 24px 0;
    }

    .info-alert {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      padding: 16px;
      border-radius: var(--radius-md);
      font-size: 13.5px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 24px;
      text-align: left;
      line-height: 1.5;
    }

    .info-icon {
      font-size: 18px;
      flex-shrink: 0;
    }

    .info-text strong {
      color: #1e3a8a;
      word-break: break-all;
    }

    .resend-section, .resend-box {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px;
      margin-bottom: 20px;
      text-align: left;
    }

    .resend-prompt {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 10px 0;
    }

    .resend-input-group {
      display: flex;
      gap: 8px;
    }

    @media (max-width: 480px) {
      .resend-input-group {
        flex-direction: column;
      }
    }

    .resend-input-group .form-control {
      flex: 1;
    }

    .action-btn-group {
      margin: 24px 0 16px 0;
    }

    .redirect-hint {
      font-size: 12px;
      color: var(--text-muted);
      margin: 0;
    }

    .auth-footer {
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 13px;
      color: var(--text-secondary);
    }

    .footer-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
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

  isAutoVerifying = signal(false);
  isVerified = signal(false);
  verificationFailed = signal(false);
  isResending = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const qEmail = params['email'];
      const qToken = params['token'];

      if (qEmail) {
        this.email = qEmail.trim();
      } else if (this.authService.pendingConfirmEmail()) {
        this.email = this.authService.pendingConfirmEmail();
      } else if (this.authService.currentUser()?.email) {
        this.email = this.authService.currentUser()!.email;
      }

      if (qToken) {
        this.token = qToken.trim();
      }

      // Linkten tıklandıysa (URL'de email ve token varsa) otomatik 1-tıkla doğrula!
      if (this.email && this.token) {
        this.autoVerify();
      }
    });
  }

  private autoVerify() {
    this.isAutoVerifying.set(true);
    this.verificationFailed.set(false);
    this.errorMessage.set(null);

    this.authService.confirmEmail({
      email: this.email.trim(),
      token: this.token.trim()
    }).subscribe({
      next: (res) => {
        this.isAutoVerifying.set(false);
        if (res.success) {
          this.isVerified.set(true);
          this.toastService.success('Doğrulama Başarılı! 🎉', 'E-posta adresiniz başarıyla onaylandı.');
          
          // 2.5 saniye sonra otomatik login sayfasına yönlendir
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2500);
        } else {
          this.verificationFailed.set(true);
          this.errorMessage.set(res.message);
          this.toastService.error('Doğrulama Başarısız', res.message);
        }
      },
      error: (err) => {
        this.isAutoVerifying.set(false);
        this.verificationFailed.set(true);
        const parsed = parseAuthError(err);
        this.errorMessage.set(parsed.generalMessage);
        this.toastService.error('Doğrulama Başarısız', parsed.generalMessage);
      }
    });
  }

  onResendLink() {
    const targetEmail = this.email.trim();
    if (!targetEmail) {
      this.toastService.warning('E-Posta Eksik', 'Lütfen doğrulama linki gönderilecek e-posta adresini yazınız.');
      return;
    }

    this.isResending.set(true);

    this.authService.resendConfirmation(targetEmail).subscribe({
      next: (res) => {
        this.isResending.set(false);
        if (res.success) {
          this.toastService.success('Link Gönderildi! 📬', 'Yeni doğrulama bağlantısı e-posta adresinize iletildi.');
          this.verificationFailed.set(false);
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
}

import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { parseAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-confirm-email-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (authService.isConfirmModalOpen()) {
      <div class="modal-backdrop" (click)="close($event)">
        <div class="modal-dialog" (click)="$event.stopPropagation()">

          <!-- Modal Tabs Switcher -->
          <div class="modal-tabs-header">
            <button type="button" class="modal-tab-btn" (click)="authService.openLoginModal()">
              🔐 Giriş Yap
            </button>
            <button type="button" class="modal-tab-btn" (click)="authService.openRegisterModal()">
              ✨ Kayıt Ol
            </button>
            <button type="button" class="modal-tab-btn tab-active">
              ✉️ E-Posta Doğrula
            </button>
          </div>

          <div class="modal-header">
            <div>
              <h2 class="modal-title">E-Posta Doğrulama</h2>
              <p class="modal-subtitle">E-posta adresinize gönderilen 6 haneli kodu giriniz</p>
            </div>
            <button class="modal-close" (click)="authService.closeAllModals()">✕</button>
          </div>

          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label">E-Posta Adresi</label>
              <input
                type="email"
                class="form-control"
                [(ngModel)]="email"
                name="email"
                placeholder="sahilcicek44@gmail.com"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">6 Haneli Aktivasyon Kodu</label>
              <input
                type="text"
                class="form-control code-input"
                [(ngModel)]="token"
                name="token"
                placeholder="123456"
                maxlength="6"
                required
              />
              <div class="form-hint">E-posta kutunuza (veya geliştirme konsoluna) gelen 6 haneli kodu giriniz.</div>
            </div>

            @if (errorMessage()) {
              <div class="error-alert">
                <span>⚠️</span>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <button type="submit" class="btn btn-primary btn-block btn-lg" [disabled]="isLoading()">
              @if (isLoading()) {
                <span>Doğrulanıyor...</span>
              } @else {
                <span>✉️ Hesabı Doğrula</span>
              }
            </button>
          </form>

          <div class="modal-footer">
            <span>Kod gelmedi mi?</span>
            <button class="link-btn" (click)="authService.openLoginModal()">Giriş Ekranına Dön</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-tabs-header {
      display: flex;
      background: var(--bg-subtle);
      padding: 4px;
      border-radius: var(--radius-md);
      gap: 4px;
      margin-bottom: 16px;
      border: 1px solid var(--border);
    }
    .modal-tab-btn {
      flex: 1;
      padding: 8px 12px;
      border: none;
      background: none;
      font-family: var(--font-heading);
      font-size: 12px;
      font-weight: 700;
      color: var(--text-secondary);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    .modal-tab-btn:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.6);
    }
    .modal-tab-btn.tab-active {
      background: #ffffff;
      color: var(--primary);
      box-shadow: var(--shadow-sm);
    }

    .modal-subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .code-input {
      font-family: var(--font-mono);
      font-size: 22px;
      letter-spacing: 6px;
      text-align: center;
      font-weight: 800;
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
      margin-bottom: 18px;
    }

    .modal-footer {
      margin-top: 20px;
      text-align: center;
      font-size: 13px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .link-btn {
      background: none;
      border: none;
      color: var(--primary);
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }

    .link-btn:hover {
      text-decoration: underline;
    }
  `]
})
export class ConfirmEmailModalComponent {
  authService = inject(AuthService);
  toastService = inject(ToastService);

  email = '';
  token = '';
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      const pendingEmail = this.authService.pendingConfirmEmail();
      if (pendingEmail) {
        this.email = pendingEmail;
      }
    });
  }

  close(event: MouseEvent) {
    this.authService.closeAllModals();
  }

  onSubmit() {
    if (!this.email || !this.token) {
      this.errorMessage.set('Lütfen e-posta ve onay kodunu giriniz.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.confirmEmail({
      email: this.email,
      token: this.token
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.toastService.success('Doğrulama Başarılı! 🎉', 'E-posta adresiniz onaylandı. Şimdi giriş yapabilirsiniz.');
          this.authService.openLoginModal();
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


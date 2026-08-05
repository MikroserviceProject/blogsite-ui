import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { parseAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (authService.isLoginModalOpen()) {
      <div class="modal-backdrop" (click)="close($event)">
        <div class="modal-dialog" (click)="$event.stopPropagation()">

          <!-- Modal Tabs Switcher -->
          <div class="modal-tabs-header">
            <button type="button" class="modal-tab-btn tab-active">
              🔐 Giriş Yap
            </button>
            <button type="button" class="modal-tab-btn" (click)="authService.openRegisterModal()">
              ✨ Kayıt Ol
            </button>
            <button type="button" class="modal-tab-btn" (click)="goToConfirmEmail()">
              ✉️ E-Posta Doğrula
            </button>
          </div>

          <div class="modal-header">
            <div>
              <h2 class="modal-title">Giriş Yap</h2>
              <p class="modal-subtitle">Lumina hesabınıza erişin ve yazıları sınırsız okuyun</p>
            </div>
            <button class="modal-close" (click)="authService.closeAllModals()">✕</button>
          </div>

          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label">E-Posta veya Kullanıcı Adı</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="emailOrUsername"
                name="emailOrUsername"
                placeholder="Örn: saliha@example.com veya sahilcicek44"
                required
              />
            </div>

            <div class="form-group">
              <div class="password-label-row">
                <label class="form-label">Şifre</label>
              </div>
              <div class="password-input-wrapper">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  class="form-control"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="••••••••"
                  required
                />
                <button type="button" class="toggle-password-btn" (click)="togglePassword()">
                  {{ showPassword() ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            @if (errorMessage()) {
              <div class="error-alert" [class.error-email-confirm]="isEmailConfirmError()">
                <span>{{ isEmailConfirmError() ? '📧' : '⚠️' }}</span>
                <div class="error-content">
                  <span>{{ errorMessage() }}</span>
                  @if (isEmailConfirmError()) {
                    <button type="button" class="confirm-redirect-btn" (click)="goToConfirmEmail()">
                      📬 E-Posta Doğrulama Ekranına Git
                    </button>
                  }
                </div>
              </div>
            }

            <button type="submit" class="btn btn-primary btn-block btn-lg" [disabled]="isLoading()">
              @if (isLoading()) {
                <span>Giriş Yapılıyor...</span>
              } @else {
                <span>🔐 Giriş Yap</span>
              }
            </button>
          </form>

          <div class="modal-footer">
            <span>Hesabınız yok mu?</span>
            <button class="link-btn" (click)="authService.openRegisterModal()">Hemen Kaydolun</button>
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
      padding: 2px;
    }

    .error-alert {
      background: var(--danger-light);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: var(--danger);
      padding: 10px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 18px;
    }

    .error-email-confirm {
      background: var(--warning-light);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #92400e;
    }

    .error-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .confirm-redirect-btn {
      background: none;
      border: 1px solid #d97706;
      color: #92400e;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: var(--transition);
    }

    .confirm-redirect-btn:hover {
      background: rgba(245, 158, 11, 0.15);
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
export class LoginModalComponent {
  authService = inject(AuthService);
  toastService = inject(ToastService);

  emailOrUsername = '';
  password = '';
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  isEmailConfirmError = signal(false);

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  close(event: MouseEvent) {
    this.authService.closeAllModals();
  }

  goToConfirmEmail() {
    const input = this.emailOrUsername.trim();
    const isEmail = input.includes('@');
    this.authService.openConfirmModal(isEmail ? input : '');
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
          this.toastService.success('Giriş Başarılı', `Hoş geldiniz, ${res.data?.user.username}!`);
          this.emailOrUsername = '';
          this.password = '';
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


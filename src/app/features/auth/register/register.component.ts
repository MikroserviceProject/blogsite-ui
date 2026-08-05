import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { parseAuthError, ParsedAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page-container container">
      <div class="auth-card card register-card">
        <div class="auth-header">
          <div class="auth-icon-badge">✨</div>
          <h1 class="auth-title">Hesap Oluştur</h1>
          <p class="auth-subtitle">Lumina güvenli kimlik ağına katılın</p>
        </div>

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="reg-username">Kullanıcı Adı</label>
            <input
              id="reg-username"
              type="text"
              class="form-control"
              [(ngModel)]="username"
              name="username"
              placeholder="Örn: salihacicek"
              required
              autocomplete="username"
            />
            <div class="form-hint">3-50 karakter, harf, rakam veya alt çizgi (_)</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-email">E-Posta Adresi</label>
            <input
              id="reg-email"
              type="email"
              class="form-control"
              [(ngModel)]="email"
              name="email"
              placeholder="sahilcicek44@gmail.com"
              required
              autocomplete="email"
            />
            <div class="form-hint">Doğrulama kodu bu adrese gönderilecektir.</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-password">Şifre</label>
            <div class="password-input-wrapper">
              <input
                id="reg-password"
                [type]="showPassword() ? 'text' : 'password'"
                class="form-control"
                [(ngModel)]="password"
                name="password"
                (ngModelChange)="onPasswordChange($event)"
                placeholder="Güçlü bir şifre giriniz (Örn: Saliha123!*)"
                required
                autocomplete="new-password"
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

            @if (password) {
              <div class="password-strength">
                <div class="strength-bar-track">
                  <div
                    class="strength-bar-fill"
                    [style.width.%]="passwordStrengthPercent()"
                    [ngClass]="passwordStrengthClass()"
                  ></div>
                </div>
                <span class="strength-label" [ngClass]="passwordStrengthClass()">
                  {{ passwordStrengthLabel() }}
                </span>
              </div>

              <ul class="password-rules">
                <li [class.rule-pass]="rules().hasMinLength">
                  <span class="rule-icon">{{ rules().hasMinLength ? '✅' : '❌' }}</span> En az 8 karakter
                </li>
                <li [class.rule-pass]="rules().hasUpperCase">
                  <span class="rule-icon">{{ rules().hasUpperCase ? '✅' : '❌' }}</span> En az 1 büyük harf (A-Z)
                </li>
                <li [class.rule-pass]="rules().hasLowerCase">
                  <span class="rule-icon">{{ rules().hasLowerCase ? '✅' : '❌' }}</span> En az 1 küçük harf (a-z)
                </li>
                <li [class.rule-pass]="rules().hasDigit">
                  <span class="rule-icon">{{ rules().hasDigit ? '✅' : '❌' }}</span> En az 1 rakam (0-9)
                </li>
                <li [class.rule-pass]="rules().hasSpecial">
                  <span class="rule-icon">{{ rules().hasSpecial ? '✅' : '❌' }}</span> En az 1 özel karakter (!&#64;#$%^&*)
                </li>
              </ul>
            }
          </div>

          <!-- Hesap Türü / Rol Seçimi -->
          <div class="form-group">
            <label class="form-label">Hesap Türü</label>
            <div class="role-selector">
              <label class="role-option" [class.role-selected]="role === 'User'">
                <input type="radio" name="role" value="User" [(ngModel)]="role" />
                <div class="role-content">
                  <span class="role-emoji">👤</span>
                  <div class="role-info">
                    <span class="role-title">Kullanıcı Hesabı</span>
                    <span class="role-desc">Standart üye profili</span>
                  </div>
                </div>
              </label>

              <label class="role-option" [class.role-selected]="role === 'Author'">
                <input type="radio" name="role" value="Author" [(ngModel)]="role" />
                <div class="role-content">
                  <span class="role-emoji">✍️</span>
                  <div class="role-info">
                    <span class="role-title">Yazar Hesabı</span>
                    <span class="role-desc">İçerik üretici profili</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Detaylı Hata Kutusu -->
          @if (parsedError()) {
            <div class="custom-error-alert" [class.error-alert-pass]="parsedError()?.isPasswordError">
              <div class="cea-head">
                <span class="cea-icon">{{ parsedError()?.isPasswordError ? '🔒' : '⚠️' }}</span>
                <strong>{{ parsedError()?.title }}</strong>
              </div>
              <div class="cea-msg">{{ parsedError()?.generalMessage }}</div>

              @if (parsedError()?.passwordErrors?.length) {
                <ul class="cea-list">
                  @for (p of parsedError()?.passwordErrors; track p) {
                    <li>❌ {{ p }}</li>
                  }
                </ul>
              }
              @if (parsedError()?.emailErrors?.length) {
                <ul class="cea-list">
                  @for (e of parsedError()?.emailErrors; track e) {
                    <li>📧 {{ e }}</li>
                  }
                </ul>
              }
              @if (parsedError()?.usernameErrors?.length) {
                <ul class="cea-list">
                  @for (u of parsedError()?.usernameErrors; track u) {
                    <li>👤 {{ u }}</li>
                  }
                </ul>
              }
              @if (parsedError()?.otherErrors?.length) {
                <ul class="cea-list">
                  @for (o of parsedError()?.otherErrors; track o) {
                    <li>⚠️ {{ o }}</li>
                  }
                </ul>
              }
            </div>
          }

          <button
            type="submit"
            class="btn btn-primary btn-block btn-lg"
            [disabled]="isLoading()"
          >
            @if (isLoading()) {
              <span>Hesap Oluşturuluyor...</span>
            } @else {
              <span>✨ Kayıt Ol</span>
            }
          </button>
        </form>

        <div class="auth-footer">
          <div class="footer-row">
            <span>Zaten bir hesabınız var mı?</span>
            <a routerLink="/login" class="link-text">Giriş Yapın</a>
          </div>
          <div class="footer-row footer-secondary">
            <span>Aktivasyon kodunuzu mu gireceksiniz?</span>
            <a routerLink="/confirm-email" class="link-text">E-Posta Doğrulama</a>
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

    .register-card {
      width: 100%;
      max-width: 500px;
      padding: 36px 32px;
      animation: fadeIn 0.2s ease-out;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 24px;
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

    .password-strength {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 8px;
    }

    .strength-bar-track {
      flex: 1;
      height: 6px;
      background: var(--bg-muted);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .strength-bar-fill {
      height: 100%;
      border-radius: var(--radius-full);
      transition: width 0.3s ease, background 0.3s ease;
    }

    .strength-weak { background: var(--danger); color: var(--danger); }
    .strength-fair { background: var(--warning); color: #b45309; }
    .strength-good { background: #22c55e; color: #16a34a; }
    .strength-strong { background: var(--success); color: var(--success); }
    .strength-label { font-size: 12px; font-weight: 700; white-space: nowrap; }

    .password-rules {
      list-style: none;
      padding: 0;
      margin-top: 10px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 8px;
    }

    .password-rules li {
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 2px 0;
      transition: color 0.2s ease;
    }

    .rule-pass {
      color: var(--success) !important;
      font-weight: 600;
    }

    .rule-icon {
      font-size: 11px;
    }

    /* Role Selector */
    .role-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .role-option {
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      padding: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: var(--transition);
      background: var(--bg-surface);
    }

    .role-option input[type="radio"] {
      display: none;
    }

    .role-option:hover {
      border-color: var(--text-light);
    }

    .role-selected {
      border-color: var(--primary) !important;
      background: rgba(79, 70, 229, 0.04);
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
    }

    .role-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .role-emoji {
      font-size: 20px;
    }

    .role-info {
      display: flex;
      flex-direction: column;
    }

    .role-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .role-desc {
      font-size: 11px;
      color: var(--text-muted);
    }

    .custom-error-alert {
      background: #fef2f2;
      border: 1.5px solid #ef4444;
      border-radius: var(--radius-md);
      padding: 12px 14px;
      margin-bottom: 18px;
      color: #991b1b;
    }

    .error-alert-pass {
      background: #fff1f2;
      border-color: #f43f5e;
    }

    .cea-head {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      margin-bottom: 4px;
    }

    .cea-msg {
      font-size: 12px;
      line-height: 1.4;
      margin-bottom: 4px;
    }

    .cea-list {
      margin: 4px 0 0 0;
      padding-left: 18px;
      font-size: 11.5px;
      display: flex;
      flex-direction: column;
      gap: 2px;
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
export class RegisterComponent {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  username = '';
  email = '';
  password = '';
  role = 'User';
  showPassword = signal(false);
  isLoading = signal(false);
  parsedError = signal<ParsedAuthError | null>(null);

  rules = signal({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasDigit: false,
    hasSpecial: false
  });

  passwordStrengthPercent = computed(() => {
    const r = this.rules();
    return ([r.hasMinLength, r.hasUpperCase, r.hasLowerCase, r.hasDigit, r.hasSpecial].filter(Boolean).length / 5) * 100;
  });

  passwordStrengthClass = computed(() => {
    const pct = this.passwordStrengthPercent();
    if (pct <= 20) return 'strength-weak';
    if (pct <= 40) return 'strength-fair';
    if (pct <= 80) return 'strength-good';
    return 'strength-strong';
  });

  passwordStrengthLabel = computed(() => {
    const pct = this.passwordStrengthPercent();
    if (pct <= 20) return 'Çok Zayıf';
    if (pct <= 40) return 'Zayıf';
    if (pct <= 60) return 'Orta';
    if (pct <= 80) return 'İyi';
    return 'Güçlü ✓';
  });

  isPasswordValid = computed(() => {
    const r = this.rules();
    return r.hasMinLength && r.hasUpperCase && r.hasLowerCase && r.hasDigit && r.hasSpecial;
  });

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  onPasswordChange(value: string) {
    this.rules.set({
      hasMinLength: value.length >= 8,
      hasUpperCase: /[A-Z]/.test(value),
      hasLowerCase: /[a-z]/.test(value),
      hasDigit: /[0-9]/.test(value),
      hasSpecial: /[^a-zA-Z0-9]/.test(value)
    });
  }

  onSubmit() {
    if (!this.username || !this.email || !this.password) {
      this.parsedError.set({
        title: '⚠️ Eksik Alanlar',
        generalMessage: 'Lütfen kullanıcı adı, e-posta ve şifre alanlarını eksiksiz doldurunuz.',
        passwordErrors: !this.password ? ['Şifre alanı boş bırakılamaz.'] : [],
        emailErrors: !this.email ? ['E-posta alanı boş bırakılamaz.'] : [],
        usernameErrors: !this.username ? ['Kullanıcı adı boş bırakılamaz.'] : [],
        otherErrors: [],
        isPasswordError: !this.password
      });
      return;
    }

    if (!this.isPasswordValid()) {
      const missingRules: string[] = [];
      const r = this.rules();
      if (!r.hasMinLength) missingRules.push('En az 8 karakter olmalıdır.');
      if (!r.hasUpperCase) missingRules.push('En az 1 BÜYÜK HARF (A-Z) içermelidir.');
      if (!r.hasLowerCase) missingRules.push('En az 1 küçük harf (a-z) içermelidir.');
      if (!r.hasDigit) missingRules.push('En az 1 rakam (0-9) içermelidir.');
      if (!r.hasSpecial) missingRules.push('En az 1 özel karakter (!@#$%^&*) içermelidir.');

      this.parsedError.set({
        title: '🔒 Şifre Güvenlik Hatası',
        generalMessage: 'Girdiğiniz şifre güvenlik kurallarına uymuyor. Lütfen aşağıdaki kuralları sağlayınız:',
        passwordErrors: missingRules,
        emailErrors: [],
        usernameErrors: [],
        otherErrors: [],
        isPasswordError: true
      });
      this.toastService.warning('Şifre Güvenliği Yetersiz', 'Lütfen şifre kurallarını tamamlayınız.');
      return;
    }

    this.isLoading.set(true);
    this.parsedError.set(null);

    const targetEmail = this.email.trim();

    this.authService.register({
      username: this.username.trim(),
      email: targetEmail,
      password: this.password,
      role: this.role
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.toastService.success(
            'Kayıt Başarılı! 🎉',
            'E-posta adresinize doğrulama kodu gönderildi. Lütfen onaylayınız.'
          );
          this.authService.pendingConfirmEmail.set(targetEmail);
          this.router.navigate(['/confirm-email'], { queryParams: { email: targetEmail } });
        } else {
          const parsed = parseAuthError(res);
          this.parsedError.set(parsed);
          this.toastService.error('Kayıt Hatası', parsed.generalMessage);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const parsed = parseAuthError(err);
        this.parsedError.set(parsed);
        this.toastService.error(parsed.title, parsed.generalMessage);
      }
    });
  }
}

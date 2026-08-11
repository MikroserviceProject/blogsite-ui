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
          <div class="auth-icon-badge"></div>
          <h1 class="auth-title">Hesap Oluştur</h1>
          <p class="auth-subtitle">Lumina kimlik ve yayın platformuna katılın</p>
        </div>

        <form (ngSubmit)="onSubmit()">
          <!-- Rol Seçimi (Okur & Yazar) -->
          <div class="form-group">
            <label class="form-label">Üyelik Türü</label>
            <div class="role-selector">
              <label class="role-option" [class.role-selected]="role === 'User'">
                <input type="radio" name="role" value="User" [(ngModel)]="role" />
                <div class="role-content">
                  <span class="role-emoji"></span>
                  <div class="role-info">
                    <span class="role-title">Okur</span>
                    <span class="role-desc">Standart üye profili</span>
                  </div>
                </div>
              </label>

              <label class="role-option" [class.role-selected]="role === 'Author'">
                <input type="radio" name="role" value="Author" [(ngModel)]="role" />
                <div class="role-content">
                  <span class="role-emoji"></span>
                  <div class="role-info">
                    <span class="role-title">Yazar</span>
                    <span class="role-desc">İçerik üretici (Onaylı)</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

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
            <div class="form-hint">3-50 karakter, benzersiz kullanıcı adı</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-email">E-Posta Adresi</label>
            <input
              id="reg-email"
              type="email"
              class="form-control"
              [(ngModel)]="email"
              name="email"
              placeholder="adiniz@ornek.com"
              required
              pattern="^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$"
              autocomplete="email"
              #emailCtrl="ngModel"
            />
            @if (emailCtrl.invalid && (emailCtrl.dirty || emailCtrl.touched)) {
              <div class="form-error" style="color: #ef4444; font-size: 13px; margin-top: 5px;">
                Lütfen geçerli bir e-posta adresi giriniz.
              </div>
            } @else {
              <div class="form-hint">Aktivasyon ve bildirimler bu adrese gönderilir.</div>
            }
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
                placeholder="En az 8 karakter, güçlü şifre"
                required
                autocomplete="new-password"
              />
              <button
                type="button"
                class="toggle-password-btn"
                (click)="togglePassword()"
                tabindex="-1"
              >
                {{ showPassword() ? '🙈' : '🐵' }}
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
                  <span class="rule-icon">{{ rules().hasMinLength ? '✓' : '○' }}</span> En az 8 karakter
                </li>
                <li [class.rule-pass]="rules().hasUpperCase">
                  <span class="rule-icon">{{ rules().hasUpperCase ? '✓' : '○' }}</span> En az 1 büyük harf (A-Z)
                </li>
                <li [class.rule-pass]="rules().hasLowerCase">
                  <span class="rule-icon">{{ rules().hasLowerCase ? '✓' : '○' }}</span> En az 1 küçük harf (a-z)
                </li>
                <li [class.rule-pass]="rules().hasDigit">
                  <span class="rule-icon">{{ rules().hasDigit ? '✓' : '○' }}</span> En az 1 rakam (0-9)
                </li>
                <li [class.rule-pass]="rules().hasSpecial">
                  <span class="rule-icon">{{ rules().hasSpecial ? '✓' : '○' }}</span> En az 1 özel karakter (!&#64;#$%^&*)
                </li>
              </ul>
            }
          </div>

          <div class="form-group" style="margin-top: 15px;">
            <label class="form-label" for="reg-confirm-password">Şifre Tekrarı</label>
            <div class="password-input-wrapper">
              <input
                id="reg-confirm-password"
                [type]="showConfirmPassword() ? 'text' : 'password'"
                class="form-control"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                placeholder="Şifrenizi doğrulayın"
                required
                autocomplete="new-password"
              />
              <button
                type="button"
                class="toggle-password-btn"
                (click)="toggleConfirmPassword()"
                tabindex="-1"
              >
                {{ showConfirmPassword() ? '🙈' : '🐵' }}
              </button>
            </div>
            @if (password && confirmPassword && password !== confirmPassword) {
              <div class="form-error" style="color: #ef4444; font-size: 13px; margin-top: 5px;">
                Şifreler uyuşmuyor.
              </div>
            }
          </div>


          <!-- YAZAR BAŞVURUSU EK ALANLARI -->
          @if (role === 'Author') {
            <div class="author-extra-fields">
              <div class="author-fields-badge">
                <span> Yazar Başvuru Bilgileri</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="reg-university">Mezun Olduğunuz Üniversite / Bölüm <span class="required-star">*</span></label>
                <input
                  id="reg-university"
                  type="text"
                  class="form-control"
                  [(ngModel)]="university"
                  name="university"
                  placeholder="Örn: Hacettepe Üniversitesi - Bilgisayar Mühendisliği"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Özgeçmiş / CV Dosyası (PDF) <span class="required-star">*</span></label>
                
                <div class="file-dropzone" [class.file-selected]="!!selectedCvFile">
                  <input
                    type="file"
                    id="cv-file-input"
                    class="file-input-hidden"
                    accept=".pdf"
                    (change)="onCvFileSelected($event)"
                  />
                  <label for="cv-file-input" class="file-dropzone-label">
                    @if (selectedCvFile) {
                      <div class="file-info-badge">
                        <span class="file-icon"></span>
                        <div class="file-text">
                          <span class="file-name">{{ selectedCvFile.name }}</span>
                          <span class="file-size">({{ getFormattedFileSize(selectedCvFile.size) }})</span>
                        </div>
                        <button type="button" class="btn-remove-file" (click)="removeCvFile($event)"></button>
                      </div>
                    } @else {
                      <span class="upload-icon">📤</span>
                      <span class="upload-title">CV Dosyanızı Buraya Yükleyin</span>
                      <span class="upload-hint">Yalnızca PDF formatı (Maksimum 10 MB)</span>
                    }
                  </label>
                </div>
              </div>

              <div class="author-notice-box">
                <span>ℹ️</span>
                <span>Yazar başvurunuz editörlerimiz ve sistem yöneticisi tarafından incelenecektir. Onaylandığında tarafınıza hesap aktivasyon bağlantısı iletilecektir.</span>
              </div>
            </div>
          }

          <!-- Detaylı Hata Kutusu -->
          @if (parsedError()) {
            <div class="custom-error-alert" [class.error-alert-pass]="parsedError()?.isPasswordError">
              <div class="cea-head">
                <span class="cea-icon">{{ parsedError()?.isPasswordError ? '' : '' }}</span>
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
                    <li> {{ e }}</li>
                  }
                </ul>
              }
              @if (parsedError()?.usernameErrors?.length) {
                <ul class="cea-list">
                  @for (u of parsedError()?.usernameErrors; track u) {
                    <li> {{ u }}</li>
                  }
                </ul>
              }
              @if (parsedError()?.otherErrors?.length) {
                <ul class="cea-list">
                  @for (o of parsedError()?.otherErrors; track o) {
                    <li> {{ o }}</li>
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
              <span><i class="fa fa-spinner fa-spin" style="margin-right: 8px;"></i> Mailiniz doğrulanıyor lütfen bekleyiniz...</span>
            } @else {
              <span>{{ role === 'Author' ? ' Yazar Başvurusunu Gönder' : ' Hesabımı Oluştur' }}</span>
            }
          </button>
        </form>

        <!-- Alt Kısım: Giriş Linki & Doğrulama Paneli Accordion -->
        <div class="auth-footer">
          <div class="footer-row">
            <span>Zaten bir hesabınız var mı?</span>
            <a routerLink="/login" class="link-gold">Giriş Yap</a>
          </div>

          <!-- Doğrulama E-Postası Gelmedi mi? Accordion Butonu -->
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
                <div class="rp-title"> Doğrulama Bağlantısını Yeniden Alın</div>
                <p class="rp-desc">Kayıt olduğunuz e-posta adresini girerek yeni bir aktivasyon bağlantısı isteyebilirsiniz:</p>
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

    .register-card {
      width: 100%;
      max-width: 540px;
      padding: 38px 34px;
      background: var(--bg-card);
      color: var(--text-main);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
      animation: fadeIn 0.2s ease-out;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 24px;
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
      color: var(--text-main);
      margin: 0 0 6px 0;
      letter-spacing: -0.5px;
    }

    .auth-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0;
    }

    .form-group {
      margin-bottom: 18px;
    }

    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 6px;
    }

    .required-star {
      color: #ef4444;
    }

    .form-control {
      width: 100%;
      height: 44px;
      background: var(--bg-main);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      padding: 0 14px;
      color: var(--text-main);
      font-size: 14px;
      transition: var(--transition);
      outline: none;
    }

    .form-control:focus {
      background: var(--bg-card);
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.15);
    }

    .form-control::placeholder {
      color: var(--text-muted);
    }

    .form-hint {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 4px;
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
      color: var(--text-secondary);
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
      background: #e2e8f0;
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .strength-bar-fill {
      height: 100%;
      border-radius: var(--radius-full);
      transition: width 0.3s ease, background 0.3s ease;
    }

    .strength-weak { background: #ef4444; color: #ef4444; }
    .strength-fair { background: #f59e0b; color: #d97706; }
    .strength-good { background: #10b981; color: #059669; }
    .strength-strong { background: #16a34a; color: #16a34a; }
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
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 2px 0;
    }

    .rule-pass {
      color: #16a34a !important;
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
      background: var(--bg-main);
    }

    .role-option input[type="radio"] {
      display: none;
    }

    .role-option:hover {
      border-color: var(--primary);
      background: var(--bg-card);
    }

    .role-selected {
      border-color: var(--primary) !important;
      background: rgba(30, 58, 138, 0.1) !important;
      box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.15);
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
      color: var(--text-main);
    }

    .role-desc {
      font-size: 11px;
      color: var(--text-secondary);
    }

    /* Yazar Özel Alanları */
    .author-extra-fields {
      background: rgba(21, 128, 61, 0.05);
      border: 1px solid rgba(21, 128, 61, 0.2);
      border-radius: var(--radius-md);
      padding: 18px;
      margin-bottom: 20px;
      animation: fadeIn 0.2s ease-out;
    }

    .author-fields-badge {
      font-size: 12px;
      font-weight: 800;
      color: #15803d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 14px;
    }

    .file-dropzone {
      border: 2px dashed var(--border);
      border-radius: var(--radius-md);
      padding: 18px;
      text-align: center;
      background: var(--bg-main);
      cursor: pointer;
      transition: var(--transition);
    }

    .file-dropzone:hover {
      border-color: #1e3a8a;
      background: #eff6ff;
    }

    .file-input-hidden {
      display: none;
    }

    .file-dropzone-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      margin: 0;
    }

    .upload-icon {
      font-size: 28px;
      margin-bottom: 6px;
    }

    .upload-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }

    .upload-hint {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }

    .file-info-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 8px 14px;
      border-radius: var(--radius-sm);
    }

    .file-icon {
      font-size: 20px;
    }

    .file-name {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }

    .file-size {
      font-size: 11px;
      color: #64748b;
      margin-left: 4px;
    }

    .btn-remove-file {
      background: #fee2e2;
      border: 1px solid #fca5a5;
      color: #991b1b;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 11px;
      margin-left: 6px;
    }

    .author-notice-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      font-size: 12px;
      color: #92400e;
      line-height: 1.4;
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    /* Error alert */
    .custom-error-alert {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius-md);
      padding: 12px 14px;
      margin-bottom: 18px;
      color: #991b1b;
    }

    .error-alert-pass {
      background: #fef2f2;
      border-color: #fecaca;
    }

    .cea-head {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 4px;
      color: #991b1b;
    }

    .cea-msg {
      font-size: 12px;
      line-height: 1.4;
      margin-bottom: 4px;
      color: #7f1d1d;
    }

    .cea-list {
      margin: 4px 0 0 0;
      padding-left: 18px;
      font-size: 11.5px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      color: #991b1b;
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
      color: var(--text-secondary);
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

    /* Accordion Resend Panel */
    .resend-accordion-wrapper {
      text-align: center;
    }

    .btn-toggle-resend {
      background: var(--bg-main);
      border: 1px solid var(--border);
      color: var(--text-secondary);
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
      color: var(--text-main);
      background: var(--bg-main);
      border-color: var(--primary);
    }

    .resend-panel {
      margin-top: 10px;
      background: var(--bg-main);
      border: 1px solid var(--border);
      padding: 16px;
      border-radius: var(--radius-md);
      text-align: left;
      animation: fadeIn 0.15s ease-out;
    }

    .rp-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 4px;
    }

    .rp-desc {
      font-size: 12px;
      color: var(--text-secondary);
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
export class RegisterComponent {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  role: string = 'User'; // 'User' veya 'Author'
  university: string = '';
  selectedCvFile: File | null = null;

  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isLoading = signal(false);
  parsedError = signal<ParsedAuthError | null>(null);

  // Doğrulama maili tekrar gönderim akordeonu
  isResendOpen = signal(false);
  resendEmailInput = '';
  isResending = signal(false);
  resendMessage = signal<string | null>(null);
  resendIsError = signal(false);

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
    if (pct <= 20) return 'Çok Zayıf 🙈';
    if (pct <= 40) return 'Zayıf 🙉';
    if (pct <= 60) return 'Orta 🙊';
    if (pct <= 80) return 'İyi 🙂';
    return 'Güçlü ✓ ';
  });

  isPasswordValid = computed(() => {
    const r = this.rules();
    return r.hasMinLength && r.hasUpperCase && r.hasLowerCase && r.hasDigit && r.hasSpecial;
  });

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.update(v => !v);
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

  onCvFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        this.toastService.error('Geçersiz Dosya', 'Lütfen sadece PDF formatında CV dosyası yükleyiniz.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        this.toastService.error('Dosya Çok Büyük', 'CV dosyası boyutu en fazla 10 MB olabilir.');
        return;
      }
      this.selectedCvFile = file;
    }
  }

  removeCvFile(event: Event) {
    event.stopPropagation();
    this.selectedCvFile = null;
  }

  getFormattedFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
          this.resendMessage.set(' Yeni doğrulama bağlantısı e-posta adresinize gönderildi.');
          this.toastService.success('Başarılı ', 'Doğrulama e-postası gönderildi!');
        } else {
          this.resendIsError.set(true);
          this.resendMessage.set(` ${res.message || 'İşlem başarısız.'}`);
        }
      },
      error: (err: any) => {
        this.isResending.set(false);
        this.resendIsError.set(true);
        const parsed = parseAuthError(err, 'Doğrulama e-postası gönderilemedi.');
        this.resendMessage.set(` ${parsed.generalMessage}`);
      }
    });
  }

  onSubmit() {
    if (!this.username || !this.email || !this.password || !this.confirmPassword) {
      this.parsedError.set({
        title: ' Eksik Alanlar',
        generalMessage: 'Lütfen kullanıcı adı, e-posta ve şifre alanlarını eksiksiz doldurunuz.',
        passwordErrors: !this.password ? ['Şifre alanı boş bırakılamaz.'] : [],
        emailErrors: !this.email ? ['E-posta alanı boş bırakılamaz.'] : [],
        usernameErrors: !this.username ? ['Kullanıcı adı boş bırakılamaz.'] : [],
        otherErrors: [],
        isPasswordError: !this.password
      });
      return;
    }

    // Basit bir de frontend'de mail kontrolü (HTML form erroru görmeden submit ederse)
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.email)) {
      this.toastService.warning('Geçersiz E-Posta', 'Lütfen geçerli formatta bir e-posta adresi giriniz.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.toastService.warning('Şifre Uyuşmazlığı', 'Girdiğiniz şifreler birbiriyle eşleşmiyor. Lütfen kontrol edip tekrar deneyin.');
      return;
    }

    if (this.role === 'Author') {
      if (!this.university.trim()) {
        this.toastService.warning('Eksik Bilgi', 'Lütfen mezun olduğunuz üniversiteyi belirtiniz.');
        return;
      }
      if (!this.selectedCvFile) {
        this.toastService.warning('Eksik Dosya', 'Lütfen PDF formatında özgeçmişinizi (CV) yükleyiniz.');
        return;
      }
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
        title: ' Şifre Güvenlik Hatası',
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

    if (this.role === 'Author') {
      const formData = new FormData();
      formData.append('username', this.username.trim());
      formData.append('email', targetEmail);
      formData.append('password', this.password);
      formData.append('university', this.university.trim());
      if (this.selectedCvFile) {
        formData.append('cvFile', this.selectedCvFile);
      }

      this.authService.registerAuthor(formData).subscribe({
        next: (res: any) => {
          this.isLoading.set(false);
          if (res.success) {
            this.toastService.success(
              'Yazar Başvurunuz Alındı! ',
              'Başvurunuz ve CV dosyanız sistem yöneticisine iletildi. Onaylandığında aktivasyon bağlantısı e-postanıza gelecektir.'
            );
            this.router.navigate(['/login']);
          } else {
            const parsed = parseAuthError(res);
            this.parsedError.set(parsed);
            this.toastService.error('Başvuru Hatası', parsed.generalMessage);
          }
        },
        error: (err: any) => {
          this.isLoading.set(false);
          const parsed = parseAuthError(err);
          this.parsedError.set(parsed);
          this.toastService.error(parsed.title, parsed.generalMessage);
        }
      });
    } else {
      this.authService.register({
        username: this.username.trim(),
        email: targetEmail,
        password: this.password,
        role: 'User'
      }).subscribe({
        next: (res: any) => {
          this.isLoading.set(false);
          if (res.success) {
            this.toastService.success(
              'Kayıt Başarılı! ',
              'E-posta adresinize tek tıkla doğrulama bağlantısı gönderildi. Lütfen gelen kutunuzu kontrol ediniz.'
            );
            this.router.navigate(['/login']);
          } else {
            const parsed = parseAuthError(res);
            this.parsedError.set(parsed);
            this.toastService.error('Kayıt Hatası', parsed.generalMessage);
          }
        },
        error: (err: any) => {
          this.isLoading.set(false);
          const parsed = parseAuthError(err);
          this.parsedError.set(parsed);
          this.toastService.error(parsed.title, parsed.generalMessage);
        }
      });
    }
  }
}

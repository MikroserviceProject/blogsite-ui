import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { parseAuthError, ParsedAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (authService.isRegisterModalOpen()) {
      <div class="modal-backdrop" (click)="close($event)">
        <div class="modal-dialog register-dialog" (click)="$event.stopPropagation()">

          <!-- Modal Tabs Switcher -->
          <div class="modal-tabs-header">
            <button type="button" class="modal-tab-btn" (click)="authService.openLoginModal()">
              🔐 Giriş Yap
            </button>
            <button type="button" class="modal-tab-btn tab-active">
              ✨ Kayıt Ol
            </button>
            <button type="button" class="modal-tab-btn" (click)="authService.openConfirmModal(email)">
              ✉️ E-Posta Doğrula
            </button>
          </div>

          <!-- STEP 1: Kayıt Formu -->
          @if (currentStep() === 'register') {
            <div class="modal-header">
              <div>
                <h2 class="modal-title">Hesap Oluştur</h2>
                <p class="modal-subtitle">Lumina topluluğuna katılın, yazın ve keşfedin</p>
              </div>
              <button class="modal-close" (click)="authService.closeAllModals()">✕</button>
            </div>

            <form (ngSubmit)="onRegisterSubmit()">
              <div class="form-group">
                <label class="form-label">Kullanıcı Adı</label>
                <input type="text" class="form-control" [(ngModel)]="username" name="username"
                  placeholder="Örn: salihacicek" required />
                <div class="form-hint">3-50 karakter, sadece harf, rakam ve alt çizgi (_)</div>
              </div>

              <div class="form-group">
                <label class="form-label">E-Posta Adresi</label>
                <input type="email" class="form-control" [(ngModel)]="email" name="email"
                  placeholder="sahilcicek44@gmail.com" required />
              </div>

              <div class="form-group">
                <label class="form-label">Şifre</label>
                <div class="password-input-wrapper">
                  <input [type]="showPassword() ? 'text' : 'password'" class="form-control"
                    [(ngModel)]="password" name="password"
                    (ngModelChange)="onPasswordChange($event)"
                    placeholder="Güçlü bir şifre oluşturun (Örn: Saliha123!*)" required />
                  <button type="button" class="toggle-password-btn" (click)="togglePassword()">
                    {{ showPassword() ? '🙈' : '👁️' }}
                  </button>
                </div>

                @if (password) {
                  <div class="password-strength">
                    <div class="strength-bar-track">
                      <div class="strength-bar-fill" [style.width.%]="passwordStrengthPercent()"
                        [ngClass]="passwordStrengthClass()"></div>
                    </div>
                    <span class="strength-label" [ngClass]="passwordStrengthClass()">{{ passwordStrengthLabel() }}</span>
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

              <!-- Rol Seçimi - Üyelik Planları -->
              <div class="form-group">
                <label class="form-label">Üyelik Planı</label>
                <div class="plan-cards plan-cards-2">
                  <!-- User -->
                  <div class="plan-card" [class.plan-selected]="role === 'User'" (click)="role = 'User'">
                    <div class="plan-header-strip plan-free-strip"></div>
                    <div class="plan-body">
                      <div class="plan-emoji">👤</div>
                      <div class="plan-name">Okur</div>
                      <div class="plan-price">Ücretsiz</div>
                      <ul class="plan-features">
                        <li>✓ Yazıları oku</li>
                        <li>✓ Yorum yap</li>
                        <li class="feat-disabled">✗ Blog yazma</li>
                        <li class="feat-disabled">✗ Fotoğraf yükleme</li>
                      </ul>
                    </div>
                  </div>

                  <!-- Author (Premium) -->
                  <div class="plan-card plan-premium-card" [class.plan-selected]="role === 'Author'" (click)="role = 'Author'">
                    <div class="plan-header-strip plan-admin-strip">
                      <span class="premium-tag">⭐ PREMİUM</span>
                    </div>
                    <div class="plan-body">
                      <div class="plan-emoji">✍️</div>
                      <div class="plan-name">Yazar</div>
                      <div class="plan-price">
                        <span class="price-amount">₺99</span>
                        <span class="price-period">/ay (İlk Ay ₺0)</span>
                      </div>
                      <ul class="plan-features">
                        <li>✓ Yazıları oku & yorum yap</li>
                        <li>✓ <strong>Blog & köşe yazısı yaz</strong></li>
                        <li>✓ <strong>📸 Fotoğraf yükleme</strong></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Detaylı & Anlaşılır Hata Kutusu -->
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

              <button type="submit" class="btn btn-primary btn-block btn-lg"
                [disabled]="isLoading()">
                @if (role === 'Author') {
                  <span>Ödeme Adımına Geç (₺0 İlk Ay) →</span>
                } @else {
                  @if (isLoading()) { <span>Hesap Oluşturuluyor...</span> }
                  @else { <span>Kayıt Ol</span> }
                }
              </button>
            </form>

            <div class="modal-footer">
              <span>Zaten bir hesabınız var mı?</span>
              <button class="link-btn" (click)="authService.openLoginModal()">Giriş Yapın</button>
            </div>
          }

          <!-- STEP 2: Yazar Premium Ödeme Ekranı (Göstermelik) -->
          @if (currentStep() === 'payment') {
            <div class="modal-header">
              <div>
                <h2 class="modal-title">⭐ Premium Yazar Üyeliği</h2>
                <p class="modal-subtitle">Güvenli ödeme ile blog yazma ve fotoğraf yükleme özelliklerini açın</p>
              </div>
              <button class="modal-close" (click)="authService.closeAllModals()">✕</button>
            </div>

            <!-- Sipariş Özeti -->
            <div class="order-summary">
              <div class="order-row">
                <span>✍️ Yazar Premium Planı</span>
                <span class="order-price">₺99/ay</span>
              </div>
              <div class="order-row order-discount">
                <span>🎁 İlk Ay Kampanyası</span>
                <span>-₺99,00</span>
              </div>
              <div class="order-divider"></div>
              <div class="order-row order-total">
                <span>Bugün Ödenecek Tutar</span>
                <span class="order-total-price">₺0,00</span>
              </div>
              <div class="order-note">
                ℹ️ İlk ay tamamen ücretsiz. İptal etmezseniz 2. ay ₺99 yansıtılır.
              </div>
            </div>

            <form (ngSubmit)="onPaymentSubmit()">
              <div class="form-group">
                <label class="form-label">Kart Üzerindeki İsim</label>
                <input type="text" class="form-control" [(ngModel)]="cardName" name="cardName"
                  placeholder="SALIHA ÇİÇEK" required />
              </div>

              <div class="form-group">
                <label class="form-label">Kart Numarası</label>
                <div class="card-input-wrapper">
                  <input type="text" class="form-control card-number-input" [(ngModel)]="cardNumber"
                    name="cardNumber" placeholder="4242  4242  4242  4242" maxlength="19"
                    (ngModelChange)="formatCardNumber($event)" required />
                  <div class="card-brand">
                    @if (cardBrand() === 'visa') { <span class="brand-visa">VISA</span> }
                    @else if (cardBrand() === 'mastercard') { <span class="brand-mc">MC</span> }
                    @else { <span class="brand-generic">💳</span> }
                  </div>
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Son Kullanma</label>
                  <input type="text" class="form-control" [(ngModel)]="cardExpiry" name="cardExpiry"
                    placeholder="MM/YY" maxlength="5" (ngModelChange)="formatExpiry($event)" required />
                </div>
                <div class="form-group">
                  <label class="form-label">CVV / CVC</label>
                  <input type="password" class="form-control" [(ngModel)]="cardCvv" name="cardCvv"
                    placeholder="•••" maxlength="3" required />
                </div>
              </div>

              <!-- Güvenlik Bilgileri -->
              <div class="security-badges">
                <span class="sec-badge">🔒 256-bit SSL</span>
                <span class="sec-badge">🏦 3D Secure</span>
                <span class="sec-badge">✅ PCI DSS Uyumlu</span>
              </div>

              @if (errorMessage()) {
                <div class="error-alert">
                  <span>⚠️</span>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <button type="submit" class="btn btn-premium btn-block btn-lg" [disabled]="isPaymentProcessing()">
                @if (isPaymentProcessing()) {
                  <span class="processing-anim">
                    <span class="dot-pulse"></span>
                    Ödeme Doğrulanıyor...
                  </span>
                } @else {
                  <span>🔒 Güvenli Ödeme Yap (₺0,00)</span>
                }
              </button>

              <button type="button" class="btn btn-secondary btn-block" style="margin-top: 8px;"
                (click)="currentStep.set('register')">← Geri Dön</button>
            </form>
          }

          <!-- STEP 3: Ödeme Başarılı Animasyonu -->
          @if (currentStep() === 'payment-success') {
            <div class="payment-success-screen">
              <div class="success-check-circle">
                <span class="success-check">✓</span>
              </div>
              <h2 class="success-title">Ödeme Onaylandı!</h2>
              <p class="success-desc">
                Premium Yazar üyeliğiniz aktif edildi.<br/>
                Hesabınız <strong>{{ username }}</strong> olarak oluşturuldu.
              </p>
              <div class="success-receipt">
                <div class="receipt-row">
                  <span>İşlem No</span>
                  <span class="font-mono">TXN-{{ transactionId() }}</span>
                </div>
                <div class="receipt-row">
                  <span>Plan</span>
                  <span>Yazar Premium (Blog & Fotoğraf Yetkisi)</span>
                </div>
                <div class="receipt-row">
                  <span>Tutar</span>
                  <span>₺0,00 (İlk ay ücretsiz)</span>
                </div>
                <div class="receipt-row">
                  <span>Kart</span>
                  <span>**** {{ cardLast4() }}</span>
                </div>
              </div>
              <p class="success-next">Şimdi e-posta doğrulama adımına yönlendiriliyorsunuz...</p>
            </div>
          }

        </div>
      </div>
    }
  `,
  styles: [`
    .register-dialog { max-width: 560px; }

    .modal-subtitle { font-size: 13px; color: var(--text-muted); margin-top: 2px; }

    .password-input-wrapper { position: relative; }
    .toggle-password-btn {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; font-size: 16px; padding: 2px;
    }

    .password-strength { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
    .strength-bar-track { flex: 1; height: 6px; background: var(--bg-muted); border-radius: var(--radius-full); overflow: hidden; }
    .strength-bar-fill { height: 100%; border-radius: var(--radius-full); transition: width 0.3s ease, background 0.3s ease; }
    .strength-weak { background: var(--danger); color: var(--danger); }
    .strength-fair { background: var(--warning); color: #b45309; }
    .strength-good { background: #22c55e; color: #16a34a; }
    .strength-strong { background: var(--success); color: var(--success); }
    .strength-label { font-size: 12px; font-weight: 700; white-space: nowrap; }

    .password-rules { list-style: none; padding: 0; margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 8px; }
    .password-rules li { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; padding: 2px 0; transition: color 0.2s ease; }
    .rule-pass { color: var(--success) !important; }
    .rule-icon { font-size: 12px; }

    /* Plan Cards */
    .plan-cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .plan-cards.plan-cards-2 { grid-template-columns: 1fr 1fr; gap: 14px; }
    .plan-card {
      border: 2px solid var(--border); border-radius: var(--radius-md); cursor: pointer;
      transition: var(--transition); overflow: hidden; position: relative;
    }
    .plan-card:hover { border-color: var(--text-light); }
    .plan-selected { border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15); }
    .plan-premium-card { border-color: #d4af37; }
    .plan-premium-card.plan-selected { border-color: #d4af37 !important; box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.2); }

    .plan-header-strip { height: 4px; }
    .plan-free-strip { background: var(--text-light); }
    .plan-author-strip { background: var(--primary-gradient); }
    .plan-admin-strip { background: linear-gradient(135deg, #d4af37 0%, #f0d060 50%, #d4af37 100%); position: relative; height: 22px; display: flex; align-items: center; justify-content: center; }

    .premium-tag { font-size: 9px; font-weight: 800; color: #5a3e00; letter-spacing: 1.5px; }

    .plan-body { padding: 12px 10px; text-align: center; }
    .plan-emoji { font-size: 24px; margin-bottom: 4px; }
    .plan-name { font-family: var(--font-heading); font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
    .plan-price { font-size: 14px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
    .price-amount { font-size: 18px; background: linear-gradient(135deg, #d4af37, #b8860b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .price-period { font-size: 12px; font-weight: 500; color: var(--text-muted); }

    .plan-features { list-style: none; padding: 0; font-size: 11px; text-align: left; display: flex; flex-direction: column; gap: 3px; }
    .plan-features li { color: var(--text-secondary); }
    .feat-disabled { color: var(--text-light) !important; text-decoration: line-through; }

    /* Payment Form */
    .order-summary { background: var(--bg-subtle); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px; }
    .order-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; padding: 4px 0; }
    .order-price { font-weight: 700; }
    .order-discount { color: var(--success); font-weight: 600; }
    .order-divider { height: 1px; background: var(--border); margin: 8px 0; }
    .order-total { font-weight: 800; font-size: 16px; }
    .order-total-price { color: var(--success); font-size: 20px; }
    .order-note { font-size: 11px; color: var(--text-muted); margin-top: 8px; padding: 6px 8px; background: var(--bg-surface); border-radius: var(--radius-sm); border: 1px dashed var(--border); }

    .card-input-wrapper { position: relative; }
    .card-number-input { font-family: var(--font-mono); letter-spacing: 2px; font-size: 15px; padding-right: 60px; }
    .card-brand { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); }
    .brand-visa { font-family: var(--font-heading); font-size: 14px; font-weight: 800; color: #1a1f71; background: #f7f8fc; padding: 2px 6px; border-radius: 3px; border: 1px solid #ccc; }
    .brand-mc { font-family: var(--font-heading); font-size: 12px; font-weight: 800; color: #fff; background: linear-gradient(135deg, #eb001b, #f79e1b); padding: 2px 6px; border-radius: 3px; }
    .brand-generic { font-size: 18px; }

    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .security-badges { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .sec-badge { font-size: 11px; font-weight: 600; color: var(--text-muted); background: var(--bg-subtle); border: 1px solid var(--border); padding: 4px 8px; border-radius: var(--radius-sm); }

    .btn-premium {
      background: linear-gradient(135deg, #d4af37 0%, #f0d060 50%, #d4af37 100%);
      color: #3d2800; font-weight: 800; border: none;
      box-shadow: 0 8px 20px -5px rgba(212, 175, 55, 0.4);
    }
    .btn-premium:hover { filter: brightness(1.08); box-shadow: 0 10px 24px -5px rgba(212, 175, 55, 0.5); }

    .processing-anim { display: flex; align-items: center; gap: 8px; }
    .dot-pulse { width: 8px; height: 8px; background: #3d2800; border-radius: 50%; animation: pulse-dot 0.8s infinite alternate; }
    @keyframes pulse-dot { from { opacity: 0.3; transform: scale(0.8); } to { opacity: 1; transform: scale(1.2); } }

    /* Payment Success */
    .payment-success-screen { text-align: center; padding: 20px 0; animation: fadeIn 0.3s ease-out; }
    .success-check-circle {
      width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 16px auto;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
      animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .success-check { color: #fff; font-size: 32px; font-weight: 800; }
    @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }

    .success-title { font-size: 22px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
    .success-desc { font-size: 14px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.5; }

    .success-receipt { background: var(--bg-subtle); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px; text-align: left; }
    .receipt-row { display: flex; justify-content: space-between; font-size: 13px; padding: 5px 0; border-bottom: 1px solid var(--border); }
    .receipt-row:last-child { border-bottom: none; }
    .font-mono { font-family: var(--font-mono); font-size: 12px; }

    .success-next { font-size: 13px; color: var(--primary); font-weight: 600; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

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

    .custom-error-alert {
      background: #fef2f2;
      border: 1.5px solid #ef4444;
      border-radius: var(--radius-md);
      padding: 12px;
      margin-bottom: 16px;
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

    .modal-footer { margin-top: 20px; text-align: center; font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; gap: 6px; }
    .link-btn { background: none; border: none; color: var(--primary); font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
    .link-btn:hover { text-decoration: underline; }
  `]
})
export class RegisterModalComponent {
  authService = inject(AuthService);
  toastService = inject(ToastService);

  // Step yönetimi
  currentStep = signal<'register' | 'payment' | 'payment-success'>('register');

  // Kayıt formu
  username = '';
  email = '';
  password = '';
  role = 'Author';
  showPassword = signal(false);
  isLoading = signal(false);
  parsedError = signal<ParsedAuthError | null>(null);

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  // Ödeme formu
  cardName = '';
  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  isPaymentProcessing = signal(false);
  transactionId = signal('');

  // Şifre kuralları
  rules = signal({ hasMinLength: false, hasUpperCase: false, hasLowerCase: false, hasDigit: false, hasSpecial: false });

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

  cardBrand = computed(() => {
    const num = this.cardNumber.replace(/\s/g, '');
    if (num.startsWith('4')) return 'visa';
    if (num.startsWith('5') || num.startsWith('2')) return 'mastercard';
    return 'generic';
  });

  cardLast4 = computed(() => {
    const num = this.cardNumber.replace(/\s/g, '');
    return num.slice(-4) || '0000';
  });

  onPasswordChange(value: string) {
    this.rules.set({
      hasMinLength: value.length >= 8,
      hasUpperCase: /[A-Z]/.test(value),
      hasLowerCase: /[a-z]/.test(value),
      hasDigit: /[0-9]/.test(value),
      hasSpecial: /[^a-zA-Z0-9]/.test(value)
    });
  }

  formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, '').substring(0, 16);
    this.cardNumber = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  formatExpiry(value: string) {
    const digits = value.replace(/\D/g, '').substring(0, 4);
    if (digits.length > 2) {
      this.cardExpiry = digits.substring(0, 2) + '/' + digits.substring(2);
    } else {
      this.cardExpiry = digits;
    }
  }

  close(event: MouseEvent) {
    this.authService.closeAllModals();
    this.currentStep.set('register');
  }

  onRegisterSubmit() {
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
        generalMessage: 'Girdiğiniz şifre güvenlik kurallarına uymuyor. Lütfen aşağıdaki eksikleri tamamlayınız:',
        passwordErrors: missingRules,
        emailErrors: [],
        usernameErrors: [],
        otherErrors: [],
        isPasswordError: true
      });
      this.toastService.warning('Şifre Güvenliği Yetersiz', 'Lütfen şifre kurallarını tamamlayınız.');
      return;
    }

    this.parsedError.set(null);

    // Author (Premium) seçildiyse ödeme ekranına yönlendir
    if (this.role === 'Author') {
      this.cardName = this.username.toUpperCase();
      this.currentStep.set('payment');
      return;
    }

    // User (Okur) — doğrudan kayıt
    this.submitRegistration();
  }

  onPaymentSubmit() {
    const num = this.cardNumber.replace(/\s/g, '');
    if (!this.cardName || num.length < 16 || !this.cardExpiry || !this.cardCvv) {
      this.toastService.warning('Eksik Bilgi', 'Lütfen tüm kart bilgilerini eksiksiz doldurunuz.');
      return;
    }

    this.isPaymentProcessing.set(true);

    // Göstermelik 2 saniyelik ödeme işlemi simülasyonu
    setTimeout(() => {
      this.transactionId.set(this.generateTransactionId());
      this.isPaymentProcessing.set(false);
      this.currentStep.set('payment-success');
      this.toastService.success('Ödeme Onaylandı! 💳', 'Premium yazar üyeliğiniz aktif edildi.');

      // 2 saniye sonra gerçek kayıt işlemini başlat
      setTimeout(() => {
        this.submitRegistration();
      }, 2000);
    }, 2000);
  }

  private submitRegistration() {
    this.isLoading.set(true);
    this.parsedError.set(null);

    this.authService.register({
      username: this.username,
      email: this.email,
      password: this.password,
      role: this.role
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.toastService.success('Kayıt Başarılı!', 'Aktivasyon kodunuz hazır. Lütfen e-postanızı doğrulayınız.');
          const targetEmail = this.email;
          this.currentStep.set('register');
          this.authService.openConfirmModal(targetEmail);
        } else {
          this.currentStep.set('register');
          const parsed = parseAuthError(res);
          this.parsedError.set(parsed);
          this.toastService.error('Kayıt Hatası', parsed.generalMessage);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.currentStep.set('register');
        const parsed = parseAuthError(err);
        this.parsedError.set(parsed);
        this.toastService.error(parsed.title, parsed.generalMessage);
      }
    });
  }

  private generateTransactionId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

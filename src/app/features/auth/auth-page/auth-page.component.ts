import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { parseAuthError, ParsedAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page-container">
      <div class="container auth-content-wrapper">
        
        <!-- Header & Breadcrumb -->
        <div class="auth-page-header">
          <a routerLink="/" class="back-home-link">← Ana Sayfaya Dön</a>
          <div class="brand-badge-pill">✨ Lumina Blog Güvenli Kimlik Doğrulama</div>
          <h1 class="auth-main-title">
            @if (activeTab() === 'register') {
              Lumina Topluluğuna Katılın
            } @else if (activeTab() === 'login') {
              Hesabınıza Giriş Yapın
            } @else {
              E-Posta Doğrulama
            }
          </h1>
          <p class="auth-main-desc">
            @if (activeTab() === 'register') {
              Okur veya Yazar olarak kaydolun, teknoloji ve mimari yazılarını keşfedin.
            } @else if (activeTab() === 'login') {
              Güvenli oturum açarak yazılarınızı yönetin ve içerikleri takip edin.
            } @else {
              Hesabınızı aktifleştirmek için 6 haneli doğrulama kodunu giriniz.
            }
          </p>
        </div>

        <!-- Central Auth Card -->
        <div class="card auth-main-card">
          
          <!-- Unified Auth Navigation Tabs -->
          <div class="auth-tabs-nav">
            <button
              class="auth-tab-btn"
              [class.tab-active]="activeTab() === 'login'"
              (click)="switchTab('login')"
            >
              🔐 1. Giriş Yap
            </button>
            <button
              class="auth-tab-btn"
              [class.tab-active]="activeTab() === 'register'"
              (click)="switchTab('register')"
            >
              ✨ 2. Kayıt Ol
            </button>
            <button
              class="auth-tab-btn"
              [class.tab-active]="activeTab() === 'confirm'"
              (click)="switchTab('confirm')"
            >
              ✉️ 3. E-Posta Doğrula
            </button>
          </div>

          <!-- ======================================================== -->
          <!-- 1. TAB: KAYIT OL (REGISTER)                             -->
          <!-- ======================================================== -->
          @if (activeTab() === 'register') {
            @if (registerStep() === 'form') {
              <form (ngSubmit)="onRegisterSubmit()" class="auth-form">
                
                <!-- Plan Seçimi: Okur vs Yazar (Premium) -->
                <div class="form-group">
                  <label class="form-label">Üyelik Türünü Seçiniz</label>
                  <div class="plan-selector-grid">
                    <!-- Okur (Ücretsiz) -->
                    <div
                      class="plan-card"
                      [class.plan-selected]="registerRole === 'User'"
                      (click)="registerRole = 'User'"
                    >
                      <div class="plan-badge plan-badge-free">Ücretsiz Plan</div>
                      <div class="plan-title">👤 Okur</div>
                      <div class="plan-price">₺0<span class="price-period">/ömür boyu</span></div>
                      <ul class="plan-features">
                        <li>✓ Tüm yazıları okuma</li>
                        <li>✓ Yorum yapabilme</li>
                        <li>✓ Yazarları takip etme</li>
                      </ul>
                    </div>

                    <!-- Yazar (Premium) -->
                    <div
                      class="plan-card plan-premium-card"
                      [class.plan-selected]="registerRole === 'Author'"
                      (click)="registerRole = 'Author'"
                    >
                      <div class="plan-badge plan-badge-premium">⭐ EN ÇOK TERCİH EDİLEN</div>
                      <div class="plan-title">✍️ Yazar (Premium)</div>
                      <div class="plan-price">₺99<span class="price-period">/ay (İlk Ay ₺0)</span></div>
                      <ul class="plan-features">
                        <li>✓ Tüm Okur yetkileri</li>
                        <li>✓ <strong>Blog & Köşe yazısı yazma</strong></li>
                        <li>✓ <strong>📸 Bilgisayardan Fotoğraf Yükleme</strong></li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div class="form-row-2">
                  <div class="form-group">
                    <label class="form-label">Kullanıcı Adı</label>
                    <input
                      type="text"
                      class="form-control"
                      [(ngModel)]="registerUsername"
                      name="registerUsername"
                      placeholder="orn: saliha_cicek"
                      required
                    />
                    <div class="field-hint">Harf, rakam ve alt çizgi (_) içerebilir</div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">E-Posta Adresi</label>
                    <input
                      type="email"
                      class="form-control"
                      [(ngModel)]="registerEmail"
                      name="registerEmail"
                      placeholder="sahilcicek44@gmail.com"
                      required
                    />
                    <div class="field-hint">Doğrulama kodu bu adrese iletilecektir</div>
                  </div>
                </div>

                <!-- Şifre Alanı & Canlı Güvenlik Kontrolü -->
                <div class="form-group">
                  <label class="form-label">Şifre Belirleyin</label>
                  <div class="password-input-wrapper">
                    <input
                      [type]="showRegisterPassword() ? 'text' : 'password'"
                      class="form-control"
                      [class.input-invalid]="hasAttemptedRegisterSubmit() && !isPasswordValid()"
                      [(ngModel)]="registerPassword"
                      name="registerPassword"
                      placeholder="Güçlü bir şifre giriniz (Örn: Saliha2026!*)"
                      required
                    />
                    <button
                      type="button"
                      class="password-toggle-btn"
                      (click)="showRegisterPassword.set(!showRegisterPassword())"
                    >
                      {{ showRegisterPassword() ? '🙈 Gizle' : '👁️ Göster' }}
                    </button>
                  </div>

                  <!-- Canlı Şifre Güçlülük Çubuğu -->
                  @if (registerPassword) {
                    <div class="strength-bar-wrapper">
                      <div
                        class="strength-bar-fill"
                        [style.width]="passwordStrengthPercentage() + '%'"
                        [style.background]="passwordStrengthColor()"
                      ></div>
                    </div>
                    <div class="strength-label" [style.color]="passwordStrengthColor()">
                      Güvenlik Seviyesi: <strong>{{ passwordStrengthLabel() }}</strong>
                    </div>
                  }

                  <!-- 5 Temel Şifre Kuralı Göstergesi -->
                  <div class="password-rules-card" [class.rules-card-alert]="hasAttemptedRegisterSubmit() && !isPasswordValid()">
                    <div class="rules-header">
                      <span class="rules-icon">🔒</span>
                      <strong>Şifre Güvenlik Kriterleri</strong>
                    </div>
                    <div class="rules-grid">
                      <div class="rule-item" [class.rule-met]="hasMinLength()">
                        <span class="rule-indicator">{{ hasMinLength() ? '✅' : '❌' }}</span>
                        <span>En az <strong>8 karakter</strong></span>
                      </div>
                      <div class="rule-item" [class.rule-met]="hasUpperCase()">
                        <span class="rule-indicator">{{ hasUpperCase() ? '✅' : '❌' }}</span>
                        <span>En az 1 <strong>BÜYÜK HARF</strong> (A-Z)</span>
                      </div>
                      <div class="rule-item" [class.rule-met]="hasLowerCase()">
                        <span class="rule-indicator">{{ hasLowerCase() ? '✅' : '❌' }}</span>
                        <span>En az 1 <strong>küçük harf</strong> (a-z)</span>
                      </div>
                      <div class="rule-item" [class.rule-met]="hasDigit()">
                        <span class="rule-indicator">{{ hasDigit() ? '✅' : '❌' }}</span>
                        <span>En az 1 <strong>rakam</strong> (0-9)</span>
                      </div>
                      <div class="rule-item" [class.rule-met]="hasSpecialChar()">
                        <span class="rule-indicator">{{ hasSpecialChar() ? '✅' : '❌' }}</span>
                        <span>En az 1 <strong>özel karakter</strong> (!&#64;#$%^&*)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Özel Şifre & Alan Hata Kutusu -->
                @if (parsedError()) {
                  <div class="custom-error-box" [class.error-box-password]="parsedError()?.isPasswordError">
                    <div class="ceb-header">
                      <span class="ceb-icon">{{ parsedError()?.isPasswordError ? '🔒' : '⚠️' }}</span>
                      <strong class="ceb-title">{{ parsedError()?.title }}</strong>
                    </div>
                    <p class="ceb-desc">{{ parsedError()?.generalMessage }}</p>
                    
                    @if (parsedError()?.passwordErrors?.length) {
                      <div class="ceb-details-box">
                        <div class="ceb-details-title">Şifre Hataları:</div>
                        <ul>
                          @for (pErr of parsedError()?.passwordErrors; track pErr) {
                            <li>❌ {{ pErr }}</li>
                          }
                        </ul>
                      </div>
                    }

                    @if (parsedError()?.emailErrors?.length) {
                      <div class="ceb-details-box">
                        <div class="ceb-details-title">E-Posta Hatası:</div>
                        <ul>
                          @for (eErr of parsedError()?.emailErrors; track eErr) {
                            <li>📧 {{ eErr }}</li>
                          }
                        </ul>
                      </div>
                    }

                    @if (parsedError()?.usernameErrors?.length) {
                      <div class="ceb-details-box">
                        <div class="ceb-details-title">Kullanıcı Adı Hatası:</div>
                        <ul>
                          @for (uErr of parsedError()?.usernameErrors; track uErr) {
                            <li>👤 {{ uErr }}</li>
                          }
                        </ul>
                      </div>
                    }

                    @if (parsedError()?.otherErrors?.length) {
                      <div class="ceb-details-box">
                        <ul>
                          @for (oErr of parsedError()?.otherErrors; track oErr) {
                            <li>⚠️ {{ oErr }}</li>
                          }
                        </ul>
                      </div>
                    }
                  </div>
                }

                <!-- Submit Button -->
                <button
                  type="submit"
                  class="btn btn-primary btn-block btn-lg"
                  [disabled]="isRegisterLoading()"
                >
                  @if (registerRole === 'Author') {
                    <span>💳 Yazar Premium Planına Geç (₺0 İlk Ay) →</span>
                  } @else {
                    @if (isRegisterLoading()) { <span>Hesap Oluşturuluyor...</span> }
                    @else { <span>✨ Okur Hesabını Oluştur</span> }
                  }
                </button>
              </form>
            }

            <!-- STEP 2: YAZAR PREMİUM ÖDEME ADIMI -->
            @if (registerStep() === 'payment') {
              <div class="payment-step-wrapper">
                <div class="payment-header">
                  <span class="payment-icon">💳</span>
                  <h2>Yazar Premium Üyelik Onayı</h2>
                  <p>Blog ve köşe yazısı yazma yetkisi için aboneliğinizi başlatın</p>
                </div>

                <div class="order-summary-box">
                  <div class="order-line">
                    <span>✍️ Lumina Yazar Premium Aboneliği</span>
                    <span class="order-val">₺99,00/ay</span>
                  </div>
                  <div class="order-line discount-line">
                    <span>🎁 Yeni Yazar Tanıtım İndirimi (İlk Ay)</span>
                    <span class="order-val">-₺99,00</span>
                  </div>
                  <div class="order-divider"></div>
                  <div class="order-line total-line">
                    <span>Bugün Tahsil Edilecek Tutar</span>
                    <span class="total-val">₺0,00</span>
                  </div>
                  <div class="order-subtext">
                    🔒 Bu bir test ortamıdır, kartınızdan hiçbir ücret çekilmeyecektir.
                  </div>
                </div>

                <form (ngSubmit)="onPaymentSubmit()" class="payment-form">
                  <div class="form-group">
                    <label class="form-label">Kart Üzerindeki İsim</label>
                    <input
                      type="text"
                      class="form-control"
                      [(ngModel)]="cardName"
                      name="cardName"
                      placeholder="AD SOYAD"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label">Kart Numarası</label>
                    <input
                      type="text"
                      class="form-control"
                      [(ngModel)]="cardNumber"
                      name="cardNumber"
                      (input)="formatCardNumber($any($event.target).value)"
                      maxlength="19"
                      placeholder="4543 •••• •••• 4242"
                      required
                    />
                  </div>

                  <div class="form-row-2">
                    <div class="form-group">
                      <label class="form-label">Son Kullanma (AA/YY)</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="cardExpiry"
                        name="cardExpiry"
                        (input)="formatExpiry($any($event.target).value)"
                        maxlength="5"
                        placeholder="12/28"
                        required
                      />
                    </div>
                    <div class="form-group">
                      <label class="form-label">CVV / Güvenlik Kodu</label>
                      <input
                        type="password"
                        class="form-control"
                        [(ngModel)]="cardCvv"
                        name="cardCvv"
                        maxlength="3"
                        placeholder="•••"
                        required
                      />
                    </div>
                  </div>

                  <div class="payment-actions">
                    <button
                      type="button"
                      class="btn btn-secondary"
                      (click)="registerStep.set('form')"
                    >
                      ← Bilgileri Düzenle
                    </button>
                    <button
                      type="submit"
                      class="btn btn-primary btn-lg flex-1"
                      [disabled]="isPaymentProcessing()"
                    >
                      @if (isPaymentProcessing()) {
                        <span>Ödeme Doğrulanıyor...</span>
                      } @else {
                        <span>₺0,00 İle Kaydı Tamamla 🚀</span>
                      }
                    </button>
                  </div>
                </form>
              </div>
            }

            <!-- STEP 3: ÖDEME BAŞARILI MAKBUZU -->
            @if (registerStep() === 'payment-success') {
              <div class="payment-success-card">
                <div class="success-check-icon">🎉</div>
                <h2 class="success-title">Ödeme ve Yetkilendirme Başarılı!</h2>
                <p class="success-desc">
                  Tebrikler! <strong>Yazar Premium</strong> üyeliğiniz tanımlandı.
                </p>
                <div class="receipt-box">
                  <div class="receipt-row">
                    <span>İşlem Kodu:</span>
                    <strong>#{{ transactionId() }}</strong>
                  </div>
                  <div class="receipt-row">
                    <span>Plan:</span>
                    <strong>Lumina Yazar (₺99/ay)</strong>
                  </div>
                  <div class="receipt-row">
                    <span>Durum:</span>
                    <strong style="color: var(--success);">Aktif / Onaylandı</strong>
                  </div>
                </div>
                <p class="redirect-hint">E-posta aktivasyon adımına aktarılıyorsunuz...</p>
              </div>
            }
          }

          <!-- ======================================================== -->
          <!-- 2. TAB: GİRİŞ YAP (LOGIN)                                -->
          <!-- ======================================================== -->
          @if (activeTab() === 'login') {
            @if (authService.sessionWarning()) {
              <div class="session-warning-banner">
                <div class="swb-icon">🛡️</div>
                <div class="swb-body">
                  <div class="swb-title">Oturum Güvenliği Bildirimi</div>
                  <div class="swb-desc">{{ authService.sessionWarning() }}</div>
                </div>
                <button type="button" class="swb-dismiss" (click)="authService.clearSessionWarning()">✕</button>
              </div>
            }

            <form (ngSubmit)="onLoginSubmit()" class="auth-form">
              
              <div class="form-group">
                <label class="form-label">Kullanıcı Adı veya E-Posta</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="loginEmailOrUsername"
                  name="loginEmailOrUsername"
                  placeholder="Kullanıcı adınız veya e-postanız"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Şifreniz</label>
                <div class="password-input-wrapper">
                  <input
                    [type]="showLoginPassword() ? 'text' : 'password'"
                    class="form-control"
                    [(ngModel)]="loginPassword"
                    name="loginPassword"
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    class="password-toggle-btn"
                    (click)="showLoginPassword.set(!showLoginPassword())"
                  >
                    {{ showLoginPassword() ? '🙈 Gizle' : '👁️ Göster' }}
                  </button>
                </div>
              </div>

              <!-- Hata Kutusu -->
              @if (loginError()) {
                <div class="custom-error-box">
                  <div class="ceb-header">
                    <span class="ceb-icon">⚠️</span>
                    <strong class="ceb-title">Giriş Yapılamadı</strong>
                  </div>
                  <p class="ceb-desc">{{ loginError() }}</p>
                </div>
              }

              <!-- E-Posta Doğrulanmamış Uyarısı & Yönlendirme -->
              @if (isLoginEmailUnconfirmed()) {
                <div class="unconfirmed-email-banner">
                  <div class="ueb-text">
                    <strong>✉️ E-Posta Onayı Gerekli</strong>
                    <p>Hesabınız henüz onaylanmamış. Aktivasyon kodunuzu girerek hemen aktifleştirebilirsiniz.</p>
                  </div>
                  <button
                    type="button"
                    class="btn btn-warning btn-sm"
                    (click)="goToConfirmWithEmail()"
                  >
                    Doğrulama Sekmesine Git →
                  </button>
                </div>
              }

              <button
                type="submit"
                class="btn btn-primary btn-block btn-lg"
                [disabled]="isLoginLoading()"
              >
                @if (isLoginLoading()) {
                  <span>Giriş Yapılıyor...</span>
                } @else {
                  <span>🔐 Giriş Yap</span>
                }
              </button>

              <div class="demo-accounts-card">
                <div class="dac-title">💡 Test & Demo Giriş Bilgileri</div>
                <div class="dac-grid">
                  <div class="dac-item" (click)="fillDemoAdmin()">
                    <span class="badge badge-admin">Yönetici (Admin)</span>
                    <code>admin</code> / <code>Admin123!*</code>
                  </div>
                  <div class="dac-item" (click)="fillDemoAuthor()">
                    <span class="badge badge-author">Yazar (Premium)</span>
                    <code>yazar_saliha</code> / <code>StrongPass123!</code>
                  </div>
                </div>
              </div>
            </form>
          }

          <!-- ======================================================== -->
          <!-- 3. TAB: E-POSTA DOĞRULA (CONFIRM EMAIL)                 -->
          <!-- ======================================================== -->
          @if (activeTab() === 'confirm') {
            <form (ngSubmit)="onConfirmSubmit()" class="auth-form">
              
              <div class="form-group">
                <label class="form-label">E-Posta Adresi</label>
                <input
                  type="email"
                  class="form-control"
                  [(ngModel)]="confirmEmail"
                  name="confirmEmail"
                  placeholder="ornek@alanadi.com"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">6 Haneli Aktivasyon Kodu</label>
                <input
                  type="text"
                  class="form-control code-input"
                  [(ngModel)]="confirmToken"
                  name="confirmToken"
                  placeholder="123456"
                  maxlength="6"
                  required
                />
                <div class="field-hint">
                  E-postanıza (veya geliştirme konsoluna) gönderilen 6 haneli kodu giriniz.
                </div>
              </div>

              @if (extractedCode()) {
                <div class="code-helper-card">
                  <div class="chc-badge">💡 Geliştirme Ortamı Bildirimi</div>
                  <div class="chc-text">
                    Aktivasyon kodunuz: <strong>{{ extractedCode() }}</strong>
                  </div>
                  <div class="chc-sub">Kod otomatik olarak kutucuğa aktarıldı. Doğrudan aşağıdaki butona basarak hesabınızı onaylayabilirsiniz.</div>
                </div>
              }

              @if (confirmError()) {
                <div class="custom-error-box">
                  <div class="ceb-header">
                    <span class="ceb-icon">⚠️</span>
                    <strong class="ceb-title">Doğrulama Hatası</strong>
                  </div>
                  <p class="ceb-desc">{{ confirmError() }}</p>
                </div>
              }

              <button
                type="submit"
                class="btn btn-primary btn-block btn-lg"
                [disabled]="isConfirmLoading()"
              >
                @if (isConfirmLoading()) {
                  <span>Doğrulanıyor...</span>
                } @else {
                  <span>✉️ Hesabımı Doğrula ve Girişe Geç</span>
                }
              </button>
            </form>
          }

        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page-container {
      min-height: calc(100vh - 72px);
      padding: 40px 0 60px 0;
      background: linear-gradient(180deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 1) 100%);
    }

    .auth-content-wrapper {
      max-width: 640px;
      margin: 0 auto;
    }

    .auth-page-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .back-home-link {
      display: inline-block;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 12px;
      transition: var(--transition);
    }
    .back-home-link:hover {
      color: var(--primary);
    }

    .brand-badge-pill {
      display: inline-block;
      background: var(--primary-light);
      color: var(--primary);
      font-size: 12px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: var(--radius-full);
      margin-bottom: 10px;
    }

    .auth-main-title {
      font-family: var(--font-heading);
      font-size: 28px;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }

    .auth-main-desc {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .auth-main-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      padding: 28px;
    }

    /* Tab Switcher */
    .auth-tabs-nav {
      display: flex;
      background: var(--bg-subtle);
      padding: 4px;
      border-radius: var(--radius-md);
      gap: 4px;
      margin-bottom: 24px;
      border: 1px solid var(--border);
    }

    .auth-tab-btn {
      flex: 1;
      padding: 10px 14px;
      border: none;
      background: none;
      font-family: var(--font-heading);
      font-size: 13px;
      font-weight: 700;
      color: var(--text-secondary);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .auth-tab-btn:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.6);
    }

    .auth-tab-btn.tab-active {
      background: #ffffff;
      color: var(--primary);
      box-shadow: var(--shadow-sm);
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    @media (max-width: 540px) {
      .form-row-2 { grid-template-columns: 1fr; }
    }

    .field-hint {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    /* Plan Seçici */
    .plan-selector-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 6px;
    }

    @media (max-width: 540px) {
      .plan-selector-grid { grid-template-columns: 1fr; }
    }

    .plan-card {
      border: 2px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px;
      cursor: pointer;
      transition: var(--transition);
      background: var(--bg-surface);
      position: relative;
    }

    .plan-card:hover {
      border-color: var(--primary);
      box-shadow: var(--shadow-sm);
    }

    .plan-selected {
      border-color: var(--primary) !important;
      background: rgba(79, 70, 229, 0.03) !important;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15) !important;
    }

    .plan-badge {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 6px;
    }

    .plan-badge-free {
      background: var(--bg-subtle);
      color: var(--text-secondary);
    }

    .plan-badge-premium {
      background: #fef3c7;
      color: #b45309;
    }

    .plan-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 2px;
    }

    .plan-price {
      font-size: 18px;
      font-weight: 800;
      color: var(--primary);
    }

    .price-period {
      font-size: 11px;
      font-weight: 500;
      color: var(--text-muted);
    }

    .plan-features {
      list-style: none;
      padding: 0;
      margin: 10px 0 0 0;
      font-size: 11.5px;
      color: var(--text-secondary);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    /* Şifre Alanı */
    .password-input-wrapper {
      position: relative;
    }

    .password-toggle-btn {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .strength-bar-wrapper {
      height: 4px;
      background: var(--border);
      border-radius: 2px;
      overflow: hidden;
      margin-top: 6px;
    }

    .strength-bar-fill {
      height: 100%;
      transition: width 0.3s ease, background 0.3s ease;
    }

    .strength-label {
      font-size: 11px;
      margin-top: 4px;
    }

    /* Şifre Kural Kutusu */
    .password-rules-card {
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 12px;
      margin-top: 10px;
      transition: var(--transition);
    }

    .rules-card-alert {
      background: #fef2f2;
      border-color: #f87171;
    }

    .rules-header {
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
      color: var(--text-primary);
    }

    .rules-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    @media (max-width: 500px) {
      .rules-grid { grid-template-columns: 1fr; }
    }

    .rule-item {
      font-size: 11.5px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .rule-item.rule-met {
      color: var(--success);
      font-weight: 600;
    }

    /* Açıklayıcı Hata Kutusu */
    .custom-error-box {
      background: #fef2f2;
      border: 1.5px solid #ef4444;
      border-radius: var(--radius-md);
      padding: 14px;
      color: #991b1b;
      animation: shake 0.3s ease-in-out;
    }

    .error-box-password {
      background: #fff1f2;
      border-color: #f43f5e;
    }

    .ceb-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .ceb-desc {
      font-size: 13px;
      line-height: 1.4;
      margin-bottom: 6px;
    }

    .ceb-details-box {
      background: rgba(255, 255, 255, 0.7);
      border-radius: var(--radius-sm);
      padding: 8px 12px;
      margin-top: 6px;
      font-size: 12px;
    }

    .ceb-details-title {
      font-weight: 700;
      margin-bottom: 4px;
    }

    .ceb-details-box ul {
      margin: 0;
      padding-left: 16px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-4px); }
      40%, 80% { transform: translateX(4px); }
    }

    /* Ödeme Adımı */
    .payment-step-wrapper {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .payment-header {
      text-align: center;
      margin-bottom: 8px;
    }

    .payment-icon {
      font-size: 32px;
      display: block;
      margin-bottom: 6px;
    }

    .order-summary-box {
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px;
    }

    .order-line {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }

    .discount-line {
      color: var(--success);
      font-weight: 600;
    }

    .order-divider {
      height: 1px;
      background: var(--border);
      margin: 8px 0;
    }

    .total-line {
      font-size: 15px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .total-val {
      color: var(--primary);
      font-size: 18px;
    }

    .order-subtext {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 6px;
    }

    .payment-actions {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }

    .flex-1 { flex: 1; }

    /* Success Card */
    .payment-success-card {
      text-align: center;
      padding: 20px 0;
    }

    .success-check-icon {
      font-size: 44px;
      margin-bottom: 12px;
    }

    .receipt-box {
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px;
      max-width: 320px;
      margin: 16px auto;
      text-align: left;
      font-size: 13px;
    }

    .receipt-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    /* Unconfirmed email banner */
    .unconfirmed-email-banner {
      background: #fffbeb;
      border: 1.5px solid #f59e0b;
      border-radius: var(--radius-md);
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .ueb-text strong {
      display: block;
      color: #b45309;
      font-size: 13px;
      margin-bottom: 2px;
    }

    .ueb-text p {
      font-size: 12px;
      color: #92400e;
      margin: 0;
    }

    .demo-accounts-card {
      background: var(--bg-subtle);
      border: 1px dashed var(--border);
      border-radius: var(--radius-md);
      padding: 12px;
      margin-top: 10px;
    }

    .dac-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .dac-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .dac-item {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 6px 8px;
      font-size: 11px;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .dac-item:hover {
      border-color: var(--primary);
      box-shadow: var(--shadow-sm);
    }

    .code-input {
      font-family: var(--font-mono);
      font-size: 24px;
      letter-spacing: 8px;
      text-align: center;
      font-weight: 800;
    }

    .code-helper-card {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: var(--radius-md);
      padding: 14px;
      margin-bottom: 20px;
      animation: fadeIn 0.3s ease;
    }

    .chc-badge {
      display: inline-block;
      background: #059669;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: var(--radius-full);
      margin-bottom: 6px;
    }

    .chc-text {
      font-size: 15px;
      color: #065f46;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .chc-text strong {
      font-size: 18px;
      font-family: var(--font-mono);
      letter-spacing: 2px;
      color: #047857;
      background: #d1fae5;
      padding: 2px 8px;
      border-radius: 4px;
      margin-left: 6px;
    }

    .chc-sub {
      font-size: 12px;
      color: #047857;
      line-height: 1.4;
    }

    .session-warning-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: #fef2f2;
      border: 1.5px solid #fca5a5;
      border-radius: var(--radius-md);
      margin-bottom: 20px;
      animation: fadeIn 0.3s ease;
    }

    .swb-icon {
      font-size: 24px;
      line-height: 1;
    }

    .swb-body {
      flex: 1;
    }

    .swb-title {
      font-weight: 700;
      font-size: 14px;
      color: #991b1b;
      margin-bottom: 4px;
    }

    .swb-desc {
      font-size: 13px;
      color: #b91c1c;
      line-height: 1.4;
    }

    .swb-dismiss {
      background: transparent;
      border: none;
      font-size: 16px;
      color: #991b1b;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .swb-dismiss:hover {
      opacity: 1;
    }
  `]
})
export class AuthPageComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  authService = inject(AuthService);
  toastService = inject(ToastService);

  activeTab = signal<'login' | 'register' | 'confirm'>('register');

  // Register Fields
  registerUsername = '';
  registerEmail = '';
  registerPassword = '';
  registerRole: 'User' | 'Author' = 'Author';
  showRegisterPassword = signal(false);
  isRegisterLoading = signal(false);
  hasAttemptedRegisterSubmit = signal(false);
  parsedError = signal<ParsedAuthError | null>(null);

  registerStep = signal<'form' | 'payment' | 'payment-success'>('form');

  // Payment simulation fields
  cardName = '';
  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  isPaymentProcessing = signal(false);
  transactionId = signal('');

  // Login Fields
  loginEmailOrUsername = '';
  loginPassword = '';
  showLoginPassword = signal(false);
  isLoginLoading = signal(false);
  loginError = signal<string | null>(null);
  isLoginEmailUnconfirmed = signal(false);

  // Confirm Fields
  confirmEmail = '';
  confirmToken = '';
  extractedCode = signal<string>('');
  isConfirmLoading = signal(false);
  confirmError = signal<string | null>(null);

  ngOnInit() {
    this.route.url.subscribe(segments => {
      const path = segments[0]?.path;
      if (path === 'login') {
        this.activeTab.set('login');
      } else if (path === 'confirm-email') {
        this.activeTab.set('confirm');
      } else {
        this.activeTab.set('register');
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.confirmEmail = params['email'];
        this.loginEmailOrUsername = params['email'];
      }
      if (params['tab']) {
        const tab = params['tab'];
        if (tab === 'login' || tab === 'register' || tab === 'confirm') {
          this.activeTab.set(tab);
        }
      }
    });
  }

  switchTab(tab: 'login' | 'register' | 'confirm') {
    this.activeTab.set(tab);
    this.parsedError.set(null);
    this.loginError.set(null);
    this.confirmError.set(null);
    
    // URL senkronizasyonu
    if (tab === 'login') this.router.navigate(['/login']);
    else if (tab === 'confirm') this.router.navigate(['/confirm-email'], { queryParams: { email: this.confirmEmail || this.registerEmail } });
    else this.router.navigate(['/register']);
  }

  // Password Validations
  hasMinLength(): boolean {
    return (this.registerPassword || '').length >= 8;
  }
  hasUpperCase(): boolean {
    return /[A-Z]/.test(this.registerPassword || '');
  }
  hasLowerCase(): boolean {
    return /[a-z]/.test(this.registerPassword || '');
  }
  hasDigit(): boolean {
    return /[0-9]/.test(this.registerPassword || '');
  }
  hasSpecialChar(): boolean {
    return /[^a-zA-Z0-9]/.test(this.registerPassword || '');
  }
  isPasswordValid(): boolean {
    return this.hasMinLength() && this.hasUpperCase() && this.hasLowerCase() && this.hasDigit() && this.hasSpecialChar();
  }

  passwordStrengthPercentage(): number {
    let score = 0;
    if (this.hasMinLength()) score += 20;
    if (this.hasUpperCase()) score += 20;
    if (this.hasLowerCase()) score += 20;
    if (this.hasDigit()) score += 20;
    if (this.hasSpecialChar()) score += 20;
    return score;
  }

  passwordStrengthColor(): string {
    const p = this.passwordStrengthPercentage();
    if (p <= 40) return '#ef4444';
    if (p <= 60) return '#f59e0b';
    if (p <= 80) return '#3b82f6';
    return '#10b981';
  }

  passwordStrengthLabel(): string {
    const p = this.passwordStrengthPercentage();
    if (p === 0) return 'Belirtilmedi';
    if (p <= 40) return 'Zayıf (Güvensiz)';
    if (p <= 60) return 'Orta Düzey';
    if (p <= 80) return 'İyi';
    return 'Çok Güçlü & Güvenli 🛡️';
  }

  // Formats
  formatCardNumber(val: string) {
    const digits = val.replace(/\D/g, '').substring(0, 16);
    const groups = digits.match(/.{1,4}/g);
    this.cardNumber = groups ? groups.join(' ') : digits;
  }

  formatExpiry(val: string) {
    const digits = val.replace(/\D/g, '').substring(0, 4);
    if (digits.length > 2) {
      this.cardExpiry = digits.substring(0, 2) + '/' + digits.substring(2);
    } else {
      this.cardExpiry = digits;
    }
  }

  // Register Submit
  onRegisterSubmit() {
    this.hasAttemptedRegisterSubmit.set(true);

    if (!this.registerUsername || !this.registerEmail || !this.registerPassword) {
      this.parsedError.set({
        title: '⚠️ Eksik Alanlar',
        generalMessage: 'Lütfen kullanıcı adı, e-posta ve şifre alanlarını eksiksiz doldurunuz.',
        passwordErrors: !this.registerPassword ? ['Şifre alanı boş bırakılamaz.'] : [],
        emailErrors: !this.registerEmail ? ['E-posta alanı boş bırakılamaz.'] : [],
        usernameErrors: !this.registerUsername ? ['Kullanıcı adı boş bırakılamaz.'] : [],
        otherErrors: [],
        isPasswordError: !this.registerPassword
      });
      return;
    }

    if (!this.isPasswordValid()) {
      const missingRules: string[] = [];
      if (!this.hasMinLength()) missingRules.push('En az 8 karakter olmalıdır.');
      if (!this.hasUpperCase()) missingRules.push('En az 1 BÜYÜK HARF (A-Z) içermelidir.');
      if (!this.hasLowerCase()) missingRules.push('En az 1 küçük harf (a-z) içermelidir.');
      if (!this.hasDigit()) missingRules.push('En az 1 rakam (0-9) içermelidir.');
      if (!this.hasSpecialChar()) missingRules.push('En az 1 özel karakter (!@#$%^&*) içermelidir.');

      this.parsedError.set({
        title: '🔒 Şifre Güvenlik Hatası',
        generalMessage: 'Girdiğiniz şifre güvenlik kurallarına uymuyor. Lütfen aşağıdaki eksikleri gideriniz:',
        passwordErrors: missingRules,
        emailErrors: [],
        usernameErrors: [],
        otherErrors: [],
        isPasswordError: true
      });
      this.toastService.warning('Şifre Güvenliği Yetersiz', 'Lütfen şifre kurallarının tamamını sağlayınız.');
      return;
    }

    this.parsedError.set(null);

    // Yazar seçildiyse ödeme adımına aktar
    if (this.registerRole === 'Author') {
      this.cardName = this.registerUsername.toUpperCase();
      this.registerStep.set('payment');
      return;
    }

    this.executeRegisterApi();
  }

  onPaymentSubmit() {
    const num = this.cardNumber.replace(/\s/g, '');
    if (!this.cardName || num.length < 16 || !this.cardExpiry || !this.cardCvv) {
      this.toastService.warning('Eksik Bilgi', 'Lütfen tüm kart alanlarını doldurunuz.');
      return;
    }

    this.isPaymentProcessing.set(true);

    setTimeout(() => {
      this.isPaymentProcessing.set(false);
      this.transactionId.set(this.generateTransactionId());
      this.registerStep.set('payment-success');
      this.toastService.success('Ödeme Onaylandı! 💳', 'Yazar üyeliğiniz aktif edildi.');

      setTimeout(() => {
        this.executeRegisterApi();
      }, 2000);
    }, 2000);
  }

  private executeRegisterApi() {
    this.isRegisterLoading.set(true);
    this.parsedError.set(null);

    this.authService.register({
      username: this.registerUsername,
      email: this.registerEmail,
      password: this.registerPassword,
      role: this.registerRole
    }).subscribe({
      next: (res) => {
        this.isRegisterLoading.set(false);
        if (res.success) {
          const match = res.message?.match(/\((\d{6})\)/);
          if (match && match[1]) {
            this.confirmToken = match[1];
            this.extractedCode.set(match[1]);
          }
          this.toastService.success('Kayıt Başarılı! 🎉', res.message || 'Doğrulama kodunuz e-posta adresinize gönderildi.');
          this.confirmEmail = this.registerEmail;
          this.switchTab('confirm');
        } else {
          this.registerStep.set('form');
          const parsed = parseAuthError(res);
          this.parsedError.set(parsed);
          this.toastService.error('Kayıt Hatası', parsed.generalMessage);
        }
      },
      error: (err) => {
        this.isRegisterLoading.set(false);
        this.registerStep.set('form');
        const parsed = parseAuthError(err);
        this.parsedError.set(parsed);
        this.toastService.error(parsed.title, parsed.generalMessage);
      }
    });
  }

  // Login Submit
  onLoginSubmit() {
    if (!this.loginEmailOrUsername || !this.loginPassword) {
      this.loginError.set('Lütfen kullanıcı adı/e-posta ve şifrenizi giriniz.');
      return;
    }

    this.isLoginLoading.set(true);
    this.loginError.set(null);
    this.isLoginEmailUnconfirmed.set(false);

    this.authService.login({
      emailOrUsername: this.loginEmailOrUsername,
      password: this.loginPassword
    }).subscribe({
      next: (res) => {
        this.isLoginLoading.set(false);
        if (res.success && res.data) {
          this.toastService.success('Giriş Başarılı! 🚀', `Hoş geldiniz, ${res.data.user.username}`);
          this.router.navigate(['/']);
        } else {
          this.loginError.set(res.message);
          this.isLoginEmailUnconfirmed.set(
            res.message?.toLowerCase().includes('doğrulanmamış') ||
            res.message?.toLowerCase().includes('onaylanmamış') ||
            false
          );
        }
      },
      error: (err) => {
        this.isLoginLoading.set(false);
        const parsed = parseAuthError(err);
        this.loginError.set(parsed.generalMessage);
        this.isLoginEmailUnconfirmed.set(
          parsed.generalMessage.toLowerCase().includes('doğrulanmamış') ||
          parsed.generalMessage.toLowerCase().includes('onaylanmamış')
        );
        this.toastService.error('Giriş Hatası', parsed.generalMessage);
      }
    });
  }

  goToConfirmWithEmail() {
    this.confirmEmail = this.loginEmailOrUsername.includes('@') ? this.loginEmailOrUsername : this.confirmEmail;
    this.switchTab('confirm');
  }

  // Confirm Submit
  onConfirmSubmit() {
    if (!this.confirmEmail || !this.confirmToken) {
      this.confirmError.set('Lütfen e-posta ve 6 haneli aktivasyon kodunu giriniz.');
      return;
    }

    this.isConfirmLoading.set(true);
    this.confirmError.set(null);

    this.authService.confirmEmail({
      email: this.confirmEmail,
      token: this.confirmToken
    }).subscribe({
      next: (res) => {
        this.isConfirmLoading.set(false);
        if (res.success) {
          this.toastService.success('E-Posta Doğrulandı! 🎉', 'Hesabınız aktif edildi. Şimdi giriş yapabilirsiniz.');
          this.loginEmailOrUsername = this.confirmEmail;
          this.switchTab('login');
        } else {
          this.confirmError.set(res.message);
        }
      },
      error: (err) => {
        this.isConfirmLoading.set(false);
        const parsed = parseAuthError(err);
        this.confirmError.set(parsed.generalMessage);
        this.toastService.error('Doğrulama Hatası', parsed.generalMessage);
      }
    });
  }

  fillDemoAdmin() {
    this.loginEmailOrUsername = 'admin';
    this.loginPassword = 'Admin123!*';
    this.toastService.info('Demo Yönetici Bilgileri Dolduruldu', 'Giriş Yap butonuna basabilirsiniz.');
  }

  fillDemoAuthor() {
    this.loginEmailOrUsername = 'yazar_saliha';
    this.loginPassword = 'StrongPass123!';
    this.toastService.info('Demo Yazar Bilgileri Dolduruldu', 'Giriş Yap butonuna basabilirsiniz.');
  }

  private generateTransactionId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-container container">
      @if (authService.isLoggedIn()) {
        <!-- Giriş Yapmış Kullanıcı Dashboard -->
        <div class="welcome-banner card">
          <div class="welcome-content">
            <div class="welcome-avatar">
              @if (authService.currentUser()?.profilePictureUrl) {
                <img 
                  [src]="authService.getAvatarUrl(authService.currentUser()?.profilePictureUrl)" 
                  alt="Avatar" 
                  class="welcome-avatar-img" 
                />
              } @else {
                <span>{{ authService.currentUser()?.username?.charAt(0)?.toUpperCase() || 'U' }}</span>
              }
            </div>
            <div class="welcome-text">
              <div class="welcome-greeting">
                <h1>Hoş Geldiniz, {{ authService.currentUser()?.username }}! 👋</h1>
                <span class="badge" [ngClass]="'badge-' + (authService.userRole()?.toLowerCase() || 'user')">
                  {{ authService.userRole() }}
                </span>
              </div>
              <p class="welcome-desc">
                Lumina Kimlik ve Erişim Yönetimi sistemine başarıyla giriş yaptınız. Hesabınızı güvenle yönetebilirsiniz.
              </p>
            </div>
          </div>
        </div>

        @if (!authService.currentUser()?.isEmailConfirmed) {
          <div class="alert-banner warning-banner">
            <div class="alert-icon">⚠️</div>
            <div class="alert-body">
              <strong>E-Posta Adresiniz Doğrulanmadı!</strong>
              <p>Hesap güvenliğiniz için lütfen e-posta adresinize gönderilen kodu onaylayınız.</p>
            </div>
            <a routerLink="/confirm-email" class="btn btn-warning btn-sm">✉️ Hemen Doğrula</a>
          </div>
        }

        <!-- Hızlı Erişim Kartları -->
        <div class="dashboard-grid">
          <div class="dashboard-card card">
            <div class="card-icon-box primary-box">👤</div>
            <h3>Profil & Hesap Yönetimi</h3>
            <p>Kullanıcı adı ve e-posta bilgilerinizi güncelleyin, hesap detaylarınızı görüntüleyin.</p>
            <a routerLink="/profile" class="btn btn-primary btn-sm">Hesabıma Git →</a>
          </div>

          <div class="dashboard-card card">
            <div class="card-icon-box success-box">🛡️</div>
            <h3>Güvenlik & Oturum</h3>
            <p>Hesabınız tekil oturum koruması altındadır. Farklı bir cihazdan giriş yapıldığında önceki oturum güvenle sonlandırılır.</p>
            <div class="status-indicator">
              <span class="status-dot"></span> Oturum Koruması Aktif
            </div>
          </div>

          <div class="dashboard-card card">
            <div class="card-icon-box info-box">✉️</div>
            <h3>E-Posta Durumu</h3>
            <p>
              Mevcut E-Posta: <strong>{{ authService.currentUser()?.email }}</strong>
            </p>
            @if (authService.currentUser()?.isEmailConfirmed) {
              <div class="confirmed-badge">✓ E-Posta Onaylanmış</div>
            } @else {
              <a routerLink="/confirm-email" class="btn btn-secondary btn-sm">Doğrulama Ekranı</a>
            }
          </div>
        </div>
      } @else {
        <!-- Giriş Yapmamış Kullanıcı Karşılama Ekranı -->
        <div class="hero-section">
          <div class="hero-badge">🔐 Lumina Kimlik Portalı</div>
          <h1 class="hero-title">Güvenli Kimlik & Erişim Yönetimi</h1>
          <p class="hero-subtitle">
            Merkezi kimlik doğrulama, tekil oturum güvenliği ve e-posta onaylı hesap altyapısıyla güvenle bağlanın.
          </p>

          <div class="hero-cta-group">
            <a routerLink="/login" class="btn btn-primary btn-lg">
              <span>🔐</span> Giriş Yap
            </a>
            <a routerLink="/register" class="btn btn-secondary btn-lg">
              <span>✨</span> Hesap Oluştur
            </a>
            <a routerLink="/confirm-email" class="btn btn-subtle btn-lg">
              <span>✉️</span> E-Posta Doğrula
            </a>
          </div>

          <div class="features-grid">
            <div class="feature-card card">
              <div class="feat-icon">🛡️</div>
              <h4>Tekil Oturum Koruması</h4>
              <p>Hesabınıza başka bir cihazdan giriş yapıldığında eski oturum güvenlik amacıyla anında kapatılır.</p>
            </div>

            <div class="feature-card card">
              <div class="feat-icon">🔒</div>
              <h4>Güçlü Şifreleme</h4>
              <p>PBKDF2 HMAC-SHA512 ve 100.000 iterasyon ile endüstri standardı şifre güvenliği.</p>
            </div>

            <div class="feature-card card">
              <div class="feat-icon">✉️</div>
              <h4>E-Posta Doğrulama</h4>
              <p>Tek tıkla güvenli aktivasyon bağlantısı ile doğrulanmış kullanıcı hesabı yönetimi.</p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .home-container {
      padding-top: 20px;
      padding-bottom: 50px;
    }

    /* Welcome Banner */
    .welcome-banner {
      padding: 30px;
      margin-bottom: 24px;
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-lg);
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.4);
    }

    .welcome-content {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .welcome-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #eff6ff;
      border: 2px solid #1e3a8a;
      color: #1e3a8a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      font-weight: 800;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
      overflow: hidden;
    }

    .welcome-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .welcome-text {
      flex: 1;
    }

    .welcome-greeting {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;
      flex-wrap: wrap;
    }

    .welcome-greeting h1 {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .welcome-desc {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }

    /* Alert Banner */
    .alert-banner {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      border-radius: var(--radius-md);
      margin-bottom: 24px;
    }

    .warning-banner {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }

    .alert-icon {
      font-size: 24px;
    }

    .alert-body {
      flex: 1;
    }

    .alert-body strong {
      display: block;
      font-size: 14px;
      margin-bottom: 2px;
      color: #b45309;
    }

    .alert-body p {
      font-size: 13px;
      margin: 0;
      color: #78350f;
    }

    /* Dashboard Grid */
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    @media (max-width: 860px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }

    .dashboard-card {
      padding: 26px;
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-lg);
      box-shadow: 0 15px 30px -8px rgba(0, 0, 0, 0.35);
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .card-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .primary-box { background: #eff6ff; color: #1e3a8a; border: 1px solid #bfdbfe; }
    .success-box { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
    .info-box { background: #f8fafc; color: #0284c7; border: 1px solid #e2e8f0; }

    .dashboard-card h3 {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .dashboard-card p {
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
      margin: 0;
      flex: 1;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #16a34a;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #16a34a;
      box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2);
    }

    .confirmed-badge {
      font-size: 12px;
      font-weight: 700;
      color: #15803d;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
    }

    /* Hero Section (Unauthenticated) */
    .hero-section {
      text-align: center;
      padding: 40px 10px 20px 10px;
    }

    .hero-badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(30, 58, 138, 0.4);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.4);
      font-size: 12px;
      font-weight: 700;
      border-radius: var(--radius-full);
      margin-bottom: 16px;
    }

    .hero-title {
      font-size: 36px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }

    .hero-subtitle {
      font-size: 16px;
      color: #cbd5e1;
      max-width: 580px;
      margin: 0 auto 32px auto;
      line-height: 1.6;
    }

    .hero-cta-group {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 48px;
    }

    .btn-subtle {
      background: rgba(255, 255, 255, 0.08);
      color: #e2e8f0;
      border: 1px solid rgba(255, 255, 255, 0.16);
    }

    .btn-subtle:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.3);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      text-align: left;
    }

    @media (max-width: 820px) {
      .features-grid {
        grid-template-columns: 1fr;
      }
      .hero-title {
        font-size: 28px;
      }
    }

    .feature-card {
      padding: 26px;
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-lg);
      box-shadow: 0 15px 30px -8px rgba(0, 0, 0, 0.35);
    }

    .feat-icon {
      font-size: 28px;
      margin-bottom: 12px;
    }

    .feature-card h4 {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
    }

    .feature-card p {
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
      margin: 0;
    }
  `]
})
export class HomeComponent {
  authService = inject(AuthService);
}

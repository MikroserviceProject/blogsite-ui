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
      padding: 28px;
      margin-bottom: 24px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
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
      background: var(--primary-gradient);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      font-weight: 800;
      box-shadow: 0 8px 16px -4px rgba(79, 70, 229, 0.4);
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
      color: var(--text-primary);
      margin: 0;
    }

    .welcome-desc {
      font-size: 14px;
      color: var(--text-secondary);
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
    }

    .alert-body p {
      font-size: 13px;
      margin: 0;
      color: #b45309;
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
      padding: 24px;
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

    .primary-box { background: var(--primary-light); color: var(--primary); }
    .success-box { background: var(--success-light); color: var(--success); }
    .info-box { background: #e0f2fe; color: #0284c7; }

    .dashboard-card h3 {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .dashboard-card p {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
      flex: 1;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--success);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
    }

    .confirmed-badge {
      font-size: 12px;
      font-weight: 700;
      color: var(--success);
      background: var(--success-light);
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
      background: var(--primary-light);
      color: var(--primary);
      font-size: 12px;
      font-weight: 700;
      border-radius: var(--radius-full);
      margin-bottom: 16px;
    }

    .hero-title {
      font-size: 36px;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }

    .hero-subtitle {
      font-size: 16px;
      color: var(--text-secondary);
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
      background: var(--bg-surface);
      color: var(--text-secondary);
      border: 1px solid var(--border);
    }

    .btn-subtle:hover {
      background: var(--bg-subtle);
      color: var(--text-primary);
      border-color: var(--text-light);
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
      padding: 24px;
    }

    .feat-icon {
      font-size: 28px;
      margin-bottom: 12px;
    }

    .feature-card h4 {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .feature-card p {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
    }
  `]
})
export class HomeComponent {
  authService = inject(AuthService);
}

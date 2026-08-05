import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="footer">
      <div class="container footer-container">
        <div class="footer-top">
          <div class="footer-brand">
            <div class="footer-logo">
              <span class="logo-icon">✨</span>
              <span class="brand-name">Lumina</span>
              <span class="brand-sub">Kimlik Portalı</span>
            </div>
            <p class="brand-desc">
              Güvenli oturum, tekil cihaz koruması ve e-posta onaylı hesap yönetimi altyapısı.
            </p>
          </div>

          <div class="footer-links">
            <div class="footer-column">
              <h4 class="column-title">Hızlı Erişim</h4>
              <a routerLink="/">Ana Sayfa</a>
              <a routerLink="/login">Giriş Yap</a>
              <a routerLink="/register">Kayıt Ol</a>
              <a routerLink="/confirm-email">E-Posta Doğrulama</a>
            </div>

            <div class="footer-column">
              <h4 class="column-title">Hesap & Güvenlik</h4>
              <a routerLink="/profile">Hesabım</a>
              <a routerLink="/profile">Oturum Durumu</a>
              <a routerLink="/confirm-email">Aktivasyon</a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© 2026 Lumina Kimlik & Erişim Yönetimi. Tüm hakları saklıdır.</p>
          <div class="footer-security-note">
            <span>🔒 Güvenli Bağlantı & Tekil Oturum Koruması</span>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: var(--bg-surface);
      border-top: 1px solid var(--border);
      padding: 40px 0 24px 0;
      margin-top: auto;
    }

    .footer-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 40px;
      margin-bottom: 30px;
    }

    @media (max-width: 768px) {
      .footer-top {
        flex-direction: column;
        gap: 24px;
      }
    }

    .footer-brand {
      max-width: 380px;
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .logo-icon {
      font-size: 20px;
    }

    .brand-name {
      font-family: var(--font-heading);
      font-size: 18px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .brand-sub {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
    }

    .brand-desc {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
    }

    .footer-links {
      display: flex;
      gap: 50px;
    }

    @media (max-width: 500px) {
      .footer-links {
        gap: 30px;
      }
    }

    .column-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .footer-column {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .footer-column a {
      font-size: 13px;
      color: var(--text-secondary);
      text-decoration: none;
      transition: var(--transition);
    }

    .footer-column a:hover {
      color: var(--primary);
    }

    .footer-bottom {
      border-top: 1px solid var(--border);
      padding-top: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: var(--text-muted);
      flex-wrap: wrap;
      gap: 10px;
    }

    .footer-security-note {
      font-weight: 600;
      color: var(--text-secondary);
    }
  `]
})
export class FooterComponent {}

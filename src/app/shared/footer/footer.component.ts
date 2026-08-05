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
            </div>
            <p class="brand-desc">
              Fikirlerin, derinlikli makalelerin ve güncel köşe yazılarının buluştuğu modern yayıncılık platformu.
            </p>
          </div>

          <div class="footer-links-grid">
            <div class="footer-column">
              <h4 class="column-title">Keşfet</h4>
              <a routerLink="/">Son Yazılar</a>
              <a routerLink="/">Köşe Yazarları</a>
              <a routerLink="/">Haftanın Seçkisi</a>
            </div>
            <div class="footer-column">
              <h4 class="column-title">Kategoriler</h4>
              <a routerLink="/">Yazılım & Mimari</a>
              <a routerLink="/">Tasarım & UI/UX</a>
              <a routerLink="/">Yapay Zeka</a>
            </div>
            <div class="footer-column">
              <h4 class="column-title">Platform</h4>
              <a routerLink="/profile">Hesabım</a>
              <a href="http://localhost:5001/scalar/v1" target="_blank">API Dokümantasyonu</a>
              <a href="http://localhost:5001" target="_blank">Auth Test Konsolu</a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© 2026 Lumina Platform. Güvenli Kimlik Doğrulama Servisi ile güçlendirilmiştir.</p>
          <div class="footer-badges">
            <span class="tech-badge">.NET 10 Web API</span>
            <span class="tech-badge">Angular 19</span>
            <span class="tech-badge">PostgreSQL</span>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: var(--bg-surface);
      border-top: 1px solid var(--border);
      padding: 60px 0 30px 0;
      margin-top: auto;
    }

    .footer-top {
      display: grid;
      grid-template-columns: 1.5fr 3fr;
      gap: 60px;
      margin-bottom: 40px;
    }

    @media (max-width: 820px) {
      .footer-top {
        grid-template-columns: 1fr;
        gap: 32px;
      }
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .logo-icon {
      font-size: 20px;
    }

    .brand-name {
      font-family: var(--font-heading);
      font-size: 20px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .brand-desc {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.6;
      max-width: 320px;
    }

    .footer-links-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 30px;
    }

    @media (max-width: 560px) {
      .footer-links-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .column-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .footer-column {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .footer-column a {
      font-size: 14px;
      color: var(--text-secondary);
      transition: var(--transition);
    }

    .footer-column a:hover {
      color: var(--primary);
    }

    .footer-bottom {
      border-top: 1px solid var(--border);
      padding-top: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      color: var(--text-muted);
      flex-wrap: wrap;
      gap: 12px;
    }

    .footer-badges {
      display: flex;
      gap: 8px;
    }

    .tech-badge {
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
    }
  `]
})
export class FooterComponent {}

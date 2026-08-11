import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer">
      <div class="container footer-container">
        <div class="footer-logo">
          <span class="logo-icon">✨</span>
          <span class="brand-name">Lumina</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: rgba(7, 13, 30, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding: 40px 0 24px 0;
      margin-top: auto;
      position: relative;
      z-index: 10;
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo-icon {
      font-size: 20px;
    }

    .brand-name {
      font-family: var(--font-heading);
      font-size: 18px;
      font-weight: 800;
      color: #ffffff;
    }
  `]
})
export class FooterComponent {}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="navbar-header">
      <div class="container navbar-container">
        <!-- Logo -->
        <a [routerLink]="authService.isLoggedIn() ? '/profile' : '/login'" class="navbar-logo">
          <div class="logo-icon">✨</div>
          <div class="logo-text">
            <span class="brand-name">Lumina</span>
            <span class="brand-badge">Kimlik Portalı</span>
          </div>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="navbar-nav">
          @if (authService.isLoggedIn()) {
            <a routerLink="/profile" routerLinkActive="nav-active" class="nav-link">
              👤 Hesabım
            </a>
            @if (authService.isAdmin()) {
              <a routerLink="/admin/author-approvals" routerLinkActive="nav-active" class="nav-link nav-admin">
                👑 Yazar Başvuruları
              </a>
            }
          }
          <a routerLink="/" routerLinkActive="nav-active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">Ana Sayfa</a>
          <a routerLink="/bloglar" routerLinkActive="nav-active" class="nav-link">Bloglar</a>
          <a routerLink="/kose-yazilari" routerLinkActive="nav-active" class="nav-link">Köşe Yazıları</a>
        </nav>

        <!-- Right Side Actions -->
        <div class="navbar-actions">
          <button
            class="theme-toggle"
            [class.is-light]="themeService.theme() === 'light'"
            (click)="themeService.toggle()"
            [attr.aria-label]="themeService.theme() === 'light' ? 'Koyu temaya geç' : 'Aydınlık temaya geç'"
          >
            <span class="theme-toggle-knob">{{ themeService.theme() === 'light' ? '☀️' : '🌙' }}</span>
          </button>

          @if (!authService.isLoggedIn()) {
            <a routerLink="/login" class="btn btn-navy-outline btn-sm">
              🔐 Giriş Yap
            </a>
            <a routerLink="/register" class="btn btn-navy-outline btn-sm">
              ✨ Kayıt Ol
            </a>
          } @else {
            @if (authService.isAuthor() || authService.isAdmin()) {
              <a routerLink="/create-post" class="btn btn-primary btn-sm">
                <span>✍️</span> Gönderi Oluştur
              </a>
            }
            <!-- User Menu Dropdown -->
            <div class="user-menu-wrapper">
              <button class="user-menu-btn" (click)="toggleDropdown()">
                <div class="user-avatar">
                  @if (authService.currentUser()?.profilePictureUrl) {
                    <img 
                      [src]="authService.getAvatarUrl(authService.currentUser()?.profilePictureUrl)" 
                      alt="Avatar" 
                      class="user-avatar-img" 
                    />
                  } @else {
                    <span>{{ authService.currentUser()?.username?.charAt(0)?.toUpperCase() || 'U' }}</span>
                  }
                </div>
                <div class="user-details">
                  <span class="user-name">{{ authService.currentUser()?.username }}</span>
                  <span class="badge" [ngClass]="'badge-' + (authService.userRole()?.toLowerCase() || 'user')">
                    {{ authService.roleDisplayName() }}
                  </span>
                </div>
                <span class="dropdown-chevron">▾</span>
              </button>

              <!-- Dropdown Menu -->
              @if (isDropdownOpen()) {
                <div class="dropdown-menu">
                  <div class="dropdown-header">
                    <div class="dh-name">{{ authService.currentUser()?.username }}</div>
                    <div class="dh-email">{{ authService.currentUser()?.email }}</div>
                  </div>
                  <div class="dropdown-divider"></div>
                  <a routerLink="/profile" class="dropdown-item" (click)="closeDropdown()">
                    <span>👤</span> Profilim & Hesap Ayarları
                  </a>
                  @if (authService.isAuthor() || authService.isAdmin()) {
                    <a routerLink="/create-post" class="dropdown-item" (click)="closeDropdown()">
                      <span>✍️</span> Yeni Gönderi Oluştur
                    </a>
                    <a routerLink="/taslaklarim" class="dropdown-item" (click)="closeDropdown()">
                      <span>📝</span> Taslaklarım
                    </a>
                  }
                  @if (authService.isAdmin()) {
                    <a routerLink="/admin/author-approvals" class="dropdown-item dropdown-admin-item" (click)="closeDropdown()">
                      <span>👑</span> Yazar Başvuru Yönetimi
                    </a>
                  }
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item dropdown-logout" (click)="logout()">
                    <span>🚪</span> Çıkış Yap
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 72px;
      background: rgba(7, 13, 30, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      z-index: 900;
      display: flex;
      align-items: center;
    }

    :host-context(.light-theme) .navbar-header {
      background: #ffffff;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border-bottom: 1px solid rgba(15, 23, 42, 0.1);
    }

    .theme-toggle {
      position: relative;
      width: 52px;
      height: 28px;
      border-radius: var(--radius-full);
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      padding: 2px;
      transition: var(--transition);
      flex-shrink: 0;
    }

    .theme-toggle-knob {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--primary-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      line-height: 1;
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateX(0);
    }

    .theme-toggle.is-light .theme-toggle-knob {
      transform: translateX(24px);
    }

    .navbar-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .navbar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }

    .logo-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
      border: 1px solid rgba(245, 158, 11, 0.5);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
    }

    .logo-text {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-name {
      font-family: var(--font-heading);
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }

    :host-context(.light-theme) .brand-name {
      color: #4f46e5;
    }

    .brand-badge {
      font-size: 11px;
      font-weight: 700;
      background: rgba(30, 58, 138, 0.6);
      color: #93c5fd;
      border: 1px solid rgba(147, 197, 253, 0.3);
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .navbar-nav {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    @media (max-width: 768px) {
      .navbar-nav { display: none; }
    }

    .nav-link {
      font-family: var(--font-heading);
      font-size: 14px;
      font-weight: 600;
      color: #cbd5e1;
      transition: var(--transition);
      position: relative;
      text-decoration: none;
    }

    .nav-link:hover, .nav-active {
      color: #ffffff;
    }

    :host-context(.light-theme) .nav-link {
      color: #475569;
    }

    :host-context(.light-theme) .nav-link:hover,
    :host-context(.light-theme) .nav-active {
      color: #0f172a;
    }

    .nav-unconfirmed {
      color: #f59e0b !important;
      font-weight: 700;
    }

    .nav-active::after {
      content: '';
      position: absolute;
      bottom: -16px;
      left: 0;
      right: 0;
      height: 2px;
      background: #f59e0b;
      border-radius: 2px;
    }

    .navbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-navy-outline {
      background-color: #ffffff;
      border: 1.5px solid #1e3a8a;
      color: #1e3a8a;
      font-weight: 700;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      text-decoration: none;
    }

    .btn-navy-outline:hover {
      background-color: #eff6ff;
      border-color: #2563eb;
      color: #1d4ed8;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
      transform: translateY(-1px);
    }

    .btn-navy-outline:active {
      transform: translateY(0);
    }

    .btn-ghost {
      background: none;
      border: 1px solid transparent;
      color: #cbd5e1;
    }

    .btn-ghost:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }

    .user-menu-wrapper {
      position: relative;
    }

    .user-menu-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-full);
      padding: 4px 12px 4px 4px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: var(--transition);
    }

    :host-context(.light-theme) .user-menu-btn {
      background: #f1f5f9;
      border: 1px solid rgba(15, 23, 42, 0.14);
    }

    :host-context(.light-theme) .user-menu-btn:hover {
      background: #e2e8f0;
    }

    .user-menu-btn:hover {
      background: rgba(255, 255, 255, 0.18);
      border-color: #f59e0b;
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.3);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      overflow: hidden;
      flex-shrink: 0;
      border: 1px solid rgba(245, 158, 11, 0.5);
    }

    .user-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .user-details {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-name {
      font-family: var(--font-heading);
      font-size: 13px;
      font-weight: 700;
      color: #ffffff;
    }

    :host-context(.light-theme) .user-name {
      color: #0f172a;
    }

    .dropdown-chevron {
      font-size: 12px;
      color: #cbd5e1;
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 240px;
      background: #0d1b3e;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-md);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      padding: 6px;
      animation: fadeIn 0.15s ease-out;
      z-index: 1000;
    }

    .dropdown-header {
      padding: 10px 12px;
    }

    .dh-name {
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
    }

    .dh-email {
      font-size: 12px;
      color: #94a3b8;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dropdown-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 4px 0;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 500;
      color: #cbd5e1;
      text-decoration: none;
      width: 100%;
      border: none;
      background: none;
      cursor: pointer;
      text-align: left;
      transition: var(--transition);
    }

    .dropdown-item:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }

    .dropdown-logout {
      color: #f87171;
    }

    .dropdown-logout:hover {
      background: rgba(239, 68, 68, 0.15);
      color: #fca5a5;
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  isDropdownOpen = signal<boolean>(false);

  toggleDropdown() {
    this.isDropdownOpen.update(v => !v);
  }

  closeDropdown() {
    this.isDropdownOpen.set(false);
  }

  logout() {
    this.closeDropdown();
    this.authService.logout();
  }
}

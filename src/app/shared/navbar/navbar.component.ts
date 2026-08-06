import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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
            @if (!authService.currentUser()?.isEmailConfirmed) {
              <a routerLink="/confirm-email" routerLinkActive="nav-active" class="nav-link nav-unconfirmed">
                ⚠️ E-Postayı Doğrula
              </a>
            }
          }
        </nav>

        <!-- Right Side Actions -->
        <div class="navbar-actions">
          @if (!authService.isLoggedIn()) {
            <a routerLink="/confirm-email" class="btn btn-ghost btn-sm">
              ✉️ Doğrula
            </a>
            <a routerLink="/login" class="btn btn-secondary btn-sm">
              🔐 Giriş Yap
            </a>
            <a routerLink="/register" class="btn btn-primary btn-sm">
              ✨ Kayıt Ol
            </a>
          } @else {
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
                    {{ authService.userRole() }}
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
                  <a routerLink="/confirm-email" class="dropdown-item" (click)="closeDropdown()">
                    <span>✉️</span> E-Posta Doğrulama
                  </a>
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
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      z-index: 900;
      display: flex;
      align-items: center;
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
      background: var(--primary-gradient);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);
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
      color: var(--text-primary);
      letter-spacing: -0.5px;
    }

    .brand-badge {
      font-size: 11px;
      font-weight: 700;
      background: var(--primary-light);
      color: var(--primary);
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
      color: var(--text-secondary);
      transition: var(--transition);
      position: relative;
      text-decoration: none;
    }

    .nav-link:hover, .nav-active {
      color: var(--primary);
    }

    .nav-unconfirmed {
      color: #d97706 !important;
      font-weight: 700;
    }

    .nav-active::after {
      content: '';
      position: absolute;
      bottom: -16px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--primary);
      border-radius: 2px;
    }

    .navbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-ghost {
      background: none;
      border: 1px solid transparent;
      color: var(--text-secondary);
    }

    .btn-ghost:hover {
      background: var(--bg-subtle);
      color: var(--text-primary);
      border-color: var(--border);
    }

    .user-menu-wrapper {
      position: relative;
    }

    .user-menu-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-full);
      padding: 4px 12px 4px 4px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: var(--transition);
    }

    .user-menu-btn:hover {
      border-color: var(--primary);
      box-shadow: var(--shadow-sm);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary-gradient);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      overflow: hidden;
      flex-shrink: 0;
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
      color: var(--text-primary);
    }

    .dropdown-chevron {
      font-size: 12px;
      color: var(--text-light);
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 240px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
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
      color: var(--text-primary);
    }

    .dh-email {
      font-size: 12px;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dropdown-divider {
      height: 1px;
      background: var(--border);
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
      color: var(--text-secondary);
      text-decoration: none;
      width: 100%;
      border: none;
      background: none;
      cursor: pointer;
      text-align: left;
      transition: var(--transition);
    }

    .dropdown-item:hover {
      background: var(--bg-subtle);
      color: var(--text-primary);
    }

    .dropdown-logout {
      color: var(--danger);
    }

    .dropdown-logout:hover {
      background: var(--danger-light);
      color: var(--danger);
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
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

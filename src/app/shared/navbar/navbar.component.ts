import { Component, inject, signal, computed, effect, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
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
        <a routerLink="/" class="navbar-logo">
          <div class="logo-text">
            <span class="brand-name">Lumina</span>
          </div>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="navbar-nav">
          @if (!authService.isBanned()) {
            <a routerLink="/" routerLinkActive="nav-active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">Ana Sayfa</a>
            <a routerLink="/bloglar" routerLinkActive="nav-active" class="nav-link">Bloglar</a>
            <a routerLink="/kose-yazilari" routerLinkActive="nav-active" class="nav-link">Köşe Yazıları</a>
          }
        </nav>

        <!-- Right Side Actions -->
        <div class="navbar-actions">
          @if (!authService.isLoggedIn()) {
            <button
              class="theme-toggle"
              (click)="themeService.toggle()"
              [attr.aria-label]="themeService.theme() === 'light' ? 'Karanlık temaya geç' : 'Aydınlık temaya geç'"
            >
              {{ themeService.theme() === 'light' ? '🌙' : '☀️' }}
            </button>
            <a routerLink="/login" class="btn btn-navy-outline btn-sm">
              Giriş Yap
            </a>
            <a routerLink="/register" class="btn btn-navy-outline btn-sm">
              Kayıt Ol
            </a>
          } @else {
            @if (!authService.isBanned() && (authService.isAuthor() || authService.isAdmin())) {
              @if (!authService.currentUser()?.isEmailConfirmed) {
                <button class="btn-create-post" disabled title="Lütfen e-posta adresinizi onaylayın" style="opacity:0.6; cursor:not-allowed;">
                  Gönderi Oluştur
                </button>
              } @else {
                <a routerLink="/create-post" class="btn-create-post">
                  Gönderi Oluştur
                </a>
              }
            }
            <button
              class="theme-toggle"
              (click)="themeService.toggle()"
              [attr.aria-label]="themeService.theme() === 'light' ? 'Karanlık temaya geç' : 'Aydınlık temaya geç'"
            >
              {{ themeService.theme() === 'light' ? '🌙' : '☀️' }}
            </button>
            
            <!-- Bildirim İkonu -->
            <div class="notif-menu-wrapper">
              <button class="notif-btn" title="Bildirimler" (click)="toggleNotif()">
                <i class="fa-solid fa-bell" style="font-size: 16px;"></i>
                @if (authService.unreadNotificationCount() > 0) {
                  <span class="notif-badge-red">{{ authService.unreadNotificationCount() }}</span>
                }
              </button>

              @if (isNotifOpen()) {
                <div class="notif-dropdown">
                  <div class="nd-header">
                    <span class="nd-title">Bildirimler</span>
                  </div>
                  <div class="nd-body">
                    @if (isLoadingNotifs()) {
                      <div class="nd-loading">Yükleniyor...</div>
                    } @else if (allNotifs().length === 0) {
                      <div class="nd-empty">Bildiriminiz bulunmuyor.</div>
                    } @else {
                      @for (n of paginatedNotifs(); track n.id) {
                        <button type="button" class="nd-item" [class.nd-unread]="!n.isRead" (click)="openNotifModal(n)">
                          <div class="nd-item-title">{{ n.title }}</div>
                          <div class="nd-item-msg">{{ n.message }}</div>
                          <div class="nd-item-time">{{ n.createdAt | date:'dd MMM HH:mm' }}</div>
                        </button>
                      }
                    }
                  </div>
                  
                  @if (allNotifs().length > 3) {
                    <div class="nd-pagination" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                      <button class="btn btn-sm btn-secondary" [disabled]="currentNotifPage() === 1" (click)="prevNotifPage($event)">Önceki</button>
                      <span style="font-size: 12px;">Sayfa {{ currentNotifPage() }} / {{ Math.ceil(allNotifs().length / 3) }}</span>
                      <button class="btn btn-sm btn-secondary" [disabled]="currentNotifPage() >= Math.ceil(allNotifs().length / 3)" (click)="nextNotifPage($event)">Sonraki</button>
                    </div>
                  }
                  
                  <a routerLink="/profile" [queryParams]="{tab: 'NOTIFICATIONS'}" class="nd-footer" (click)="closeNotif()">
                    Tüm Bildirimleri Gör
                  </a>
                </div>
              }
            </div>

            <!-- Bildirim Okuma Modalı -->
            @if (activeModalNotif()) {
              <div class="modal-backdrop notif-modal-backdrop">
                <div class="modal-card" style="max-width: 600px; padding: 24px;">
                  <div class="modal-header">
                    <h3 class="modal-title" style="font-size: 1.3rem;">{{ activeModalNotif()?.title }}</h3>
                    <button type="button" class="btn-close" (click)="closeNotifModal()"></button>
                  </div>
                  <div class="modal-body">
                    <p style="font-size: 16px; line-height: 1.7;">{{ activeModalNotif()?.message }}</p>
                  </div>
                  <div class="modal-footer text-muted" style="font-size: 13px; display: flex; justify-content: space-between;">
                    <span>{{ activeModalNotif()?.createdAt | date:'d MMMM yyyy, HH:mm' }}</span>
                    <button type="button" class="btn btn-secondary" (click)="closeNotifModal()">Kapat</button>
                  </div>
                </div>
              </div>
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
                    Profilim & Hesap Ayarları
                  </a>
                  @if (!authService.isBanned() && (authService.isAuthor() || authService.isAdmin())) {
                    @if (!authService.currentUser()?.isEmailConfirmed) {
                      <button class="dropdown-item dropdown-item-cta" disabled title="Lütfen e-posta adresinizi onaylayın" style="opacity:0.6; cursor:not-allowed;">
                        Yeni Gönderi Oluştur
                      </button>
                    } @else {
                      <a routerLink="/create-post" class="dropdown-item dropdown-item-cta" (click)="closeDropdown()">
                        Yeni Gönderi Oluştur
                      </a>
                    }
                  }
                  @if (authService.isAdmin()) {
                    <a routerLink="/profile" [queryParams]="{tab: 'ADMIN_USERS'}" class="dropdown-item dropdown-admin-item" (click)="closeDropdown()">
                      Kullanıcı & İçerik Yönetimi
                    </a>
                    <a routerLink="/profile" [queryParams]="{tab: 'ADMIN_AUTHORS'}" class="dropdown-item dropdown-admin-item" (click)="closeDropdown()">
                      Yazar Başvuru Yönetimi
                    </a>
                  }
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item dropdown-logout" (click)="logout()">
                    Çıkış Yap
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
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      line-height: 1;
      transition: var(--transition);
      flex-shrink: 0;
    }

    :host-context(.light-theme) .theme-toggle {
      background: #ffffff;
    }

    .theme-toggle:hover {
      background: var(--bg-muted);
      border-color: var(--primary);
    }

    .notif-menu-wrapper {
      position: relative;
    }
    
    .notif-btn {
      position: relative;
      height: 38px;
      padding: 0 16px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: var(--transition);
      text-decoration: none;
      flex-shrink: 0;
      color: #fff;
    }
    .notif-btn:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); }
    :host-context(.light-theme) .notif-btn { background: #ffffff; border-color: rgba(15, 23, 42, 0.1); color: #0f172a; }
    :host-context(.light-theme) .notif-btn:hover { background: #f1f5f9; }
    
    .notif-badge-red {
      position: absolute;
      top: 4px;
      right: 4px;
      background: #ef4444;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 999px;
      border: 2px solid var(--bg-card);
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
    }
    :host-context(.light-theme) .notif-badge-red { border-color: #ffffff; }

    .notif-dropdown {
      position: absolute;
      top: 100%;
      right: 50%;
      transform: translateX(50%);
      width: 400px;
      margin-top: 10px;
      background: var(--bg-card);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-md);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      animation: fadeIn 0.15s ease-out;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    :host-context(.light-theme) .notif-dropdown {
      background: #ffffff;
      border: 1px solid rgba(15, 23, 42, 0.12);
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
    }
    .nd-header {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      font-weight: 700;
      font-size: 14px;
      color: #fff;
    }
    :host-context(.light-theme) .nd-header {
      border-bottom-color: rgba(15,23,42,0.1);
      color: #0f172a;
    }
    .nd-body {
      max-height: 400px;
      overflow-y: auto;
    }
    .nd-loading, .nd-empty {
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #94a3b8;
    }
    .nd-item {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      text-decoration: none;
      display: block;
      transition: background 0.2s;
      background: none;
      border: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
    }
    .nd-item:last-child { border-bottom: none; }
    .nd-item:hover { background: rgba(255, 255, 255, 0.03); }
    :host-context(.light-theme) .nd-item { border-bottom-color: rgba(15, 23, 42, 0.05); }
    :host-context(.light-theme) .nd-item:hover { background: #f8fafc; }
    
    .nd-unread { border-left: 3px solid #3b82f6; background: rgba(59, 130, 246, 0.05); }
    :host-context(.light-theme) .nd-unread { background: rgba(59, 130, 246, 0.05); }

    .nd-item-title {
      font-size: 13px;
      font-weight: 700;
      color: #fff;
    }
    :host-context(.light-theme) .nd-item-title { color: #0f172a; }
    .nd-item-msg {
      font-size: 12px;
      color: #cbd5e1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    :host-context(.light-theme) .nd-item-msg { color: #475569; }
    .nd-item-time {
      font-size: 11px;
      color: #64748b;
    }
    .nd-footer {
      padding: 10px;
      text-align: center;
      background: rgba(255, 255, 255, 0.05);
      font-size: 13px;
      font-weight: 600;
      color: #3b82f6;
      text-decoration: none;
      transition: background 0.2s;
    }
    .nd-footer:hover { background: rgba(255, 255, 255, 0.1); }
    :host-context(.light-theme) .nd-footer { background: #f8fafc; }
    :host-context(.light-theme) .nd-footer:hover { background: #f1f5f9; }

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
      background-color: var(--bg-surface);
      border: 1.5px solid rgba(255, 255, 255, 0.3);
      color: #ffffff;
      font-weight: 700;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .btn-navy-outline:hover {
      background-color: var(--bg-subtle);
      border-color: rgba(255, 255, 255, 0.5);
      transform: translateY(-1px);
    }

    .btn-navy-outline:active {
      transform: translateY(0);
    }

    :host-context(.light-theme) .btn-navy-outline {
      border-color: var(--primary);
      color: var(--primary);
    }

    :host-context(.light-theme) .btn-navy-outline:hover {
      border-color: var(--primary-hover);
      color: var(--primary-hover);
    }

    .btn-create-post {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background-color: #2563eb;
      border: 1.5px solid #3b82f6;
      color: #ffffff;
      font-weight: 700;
      font-size: 14px;
      padding: 8px 16px;
      border-radius: var(--radius-md);
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
    }

    .btn-create-post:hover {
      background-color: #1d4ed8;
      border-color: #2563eb;
      color: #ffffff;
    }

    /* Light Theme Button Override */
    :host-context(.light-theme) .btn-create-post {
      background-color: #eff6ff; /* Çok açık mavi/beyazımsı */
      border-color: #bfdbfe;
      color: #1e40af; /* Yazı rengi koyu mavi */
      box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
    }

    :host-context(.light-theme) .btn-create-post:hover {
      background-color: #dbeafe; /* Hover'da biraz daha koyulaşır */
      border-color: #93c5fd;
      color: #1e3a8a;
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
      background: #ffffff;
      border: 1px solid rgba(15, 23, 42, 0.14);
    }

    :host-context(.light-theme) .user-menu-btn:hover {
      background: #f8fafc;
    }

    .user-menu-btn:hover {
      background: rgba(255, 255, 255, 0.18);
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

    :host-context(.light-theme) .dropdown-menu {
      background: #ffffff;
      border: 1px solid rgba(15, 23, 42, 0.12);
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
    }

    .dropdown-header {
      padding: 10px 12px;
    }

    .dh-name {
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
    }

    :host-context(.light-theme) .dh-name {
      color: #0f172a;
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

    :host-context(.light-theme) .dropdown-divider {
      background: rgba(15, 23, 42, 0.1);
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

    .dropdown-item.dropdown-item-cta {
      font-weight: 700;
    }

    .dropdown-item:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }

    :host-context(.light-theme) .dropdown-item {
      color: #475569;
    }

    :host-context(.light-theme) .dropdown-item:hover {
      background: #f1f5f9;
      color: #0f172a;
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
  router = inject(Router);
  elRef = inject(ElementRef);
  isDropdownOpen = signal<boolean>(false);
  isNotifOpen = signal<boolean>(false);
  recentNotifs = signal<any[]>([]); // Geriye dönük uyumluluk için bırakılabilir veya kaldırılabilir
  allNotifs = signal<any[]>([]);
  currentNotifPage = signal<number>(1);
  paginatedNotifs = computed(() => {
    const start = (this.currentNotifPage() - 1) * 3;
    return this.allNotifs().slice(start, start + 3);
  });
  isLoadingNotifs = signal<boolean>(false);
  activeModalNotif = signal<any>(null);
  
  Math = Math; // Template'de kullanmak için
  
  private lastNotifCheckTime = 0;

  constructor() {
    effect(() => {
      const count = this.authService.unreadNotificationCount();
      if (this.authService.isLoggedIn()) {
        this.fetchNotifs();
      }
    }, { allowSignalWrites: true });
  }

  fetchNotifs(silent: boolean = false) {
    if (!silent) {
      this.isLoadingNotifs.set(true);
    }
    this.authService.getUserNotifications().subscribe({
      next: (res: any) => {
        if (!silent) {
          this.isLoadingNotifs.set(false);
        }
        if (res.success && res.data) {
          const unreadOnly = res.data.filter((n: any) => !n.isRead);
          const sorted = [...unreadOnly].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          this.allNotifs.set(sorted);
          this.authService.unreadNotificationCount.set(unreadOnly.length);
          this.currentNotifPage.set(1);
        }
      },
      error: () => {
        this.isLoadingNotifs.set(false);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    // If a modal is open, we don't close the dropdowns here
    // The modal backdrop click handles modal closing if we wanted it to, but user asked for it NOT to close when clicking outside.
    if (!this.elRef.nativeElement.contains(event.target) && !(event.target as HTMLElement).closest('.notif-modal-backdrop')) {
      this.isNotifOpen.set(false);
      this.isDropdownOpen.set(false);
    }

    // Ekranın herhangi bir yerine tıklandığında bildirimleri sessizce güncelle
    // (Spam yapmamak için en az 15 saniyede bir çalışmasına izin veriyoruz)
    if (this.authService.isLoggedIn()) {
      const now = Date.now();
      if (now - this.lastNotifCheckTime > 15000) {
        this.lastNotifCheckTime = now;
        // Eğer dropdown zaten açıksa ve bir yere tıkladıysa, UI'da 'Yükleniyor' çıkmaması için sessiz(fetchNotifs(true)) yaparız
        this.fetchNotifs(true);
      }
    }
  }

  openNotifModal(notif: any) {
    this.activeModalNotif.set(notif);

    // Backend'e okundu olarak işaretleme isteği atılabilir (eğer gerekiyorsa, Profil'deki gibi)
    if (!notif.isRead) {
      this.authService.markNotificationAsRead(notif.id).subscribe({
        next: () => {
          this.fetchNotifs(); // update counts
        }
      });
    }
  }

  closeNotifModal() {
    this.activeModalNotif.set(null);
  }
  
  prevNotifPage(e: Event) {
    e.stopPropagation(); // Dropdown kapanmasını engelle
    if (this.currentNotifPage() > 1) {
      this.currentNotifPage.update(p => p - 1);
    }
  }

  nextNotifPage(e: Event) {
    e.stopPropagation(); // Dropdown kapanmasını engelle
    const maxPage = Math.ceil(this.allNotifs().length / 3);
    if (this.currentNotifPage() < maxPage) {
      this.currentNotifPage.update(p => p + 1);
    }
  }

  switchTabToNotifications() {
    this.isNotifOpen.set(false);
    this.router.navigate(['/profile'], { queryParams: { tab: 'NOTIFICATIONS' } });
  }

  toggleNotif() {
    if (this.authService.unreadNotificationCount() === 0) {
      this.isNotifOpen.set(false);
      this.switchTabToNotifications();
      return;
    }

    this.isNotifOpen.update(v => !v);
    this.isDropdownOpen.set(false); // user menüsünü kapat
    if (this.isNotifOpen() && this.authService.isLoggedIn()) {
      this.fetchNotifs();
    }
  }

  closeNotif() {
    this.isNotifOpen.set(false);
  }

  toggleDropdown() {
    this.isDropdownOpen.update(v => !v);
    this.isNotifOpen.set(false); // notif menüsünü kapat
  }

  closeDropdown() {
    this.isDropdownOpen.set(false);
  }

  logout() {
    this.closeDropdown();
    this.authService.logout();
  }
}

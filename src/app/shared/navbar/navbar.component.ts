import { Component, inject, signal, computed, effect, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { SocialService, PublicUser } from '../../core/services/social/social.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  socialService = inject(SocialService);
  router = inject(Router);
  elRef = inject(ElementRef);
  
  // Search state
  searchQuery = signal<string>('');
  searchResults = signal<PublicUser[]>([]);
  isSearchOpen = signal<boolean>(false);
  isSearching = signal<boolean>(false);
  searchTimeout: any;
  isDropdownOpen = signal<boolean>(false);
  isNotifOpen = signal<boolean>(false);
  recentNotifs = signal<any[]>([]); // Geriye dönük uyumluluk için bırakılabilir veya kaldırılabilir
  allNotifs = signal<any[]>([]);
  currentNotifPage = signal<number>(1);
  paginatedNotifs = computed(() => this.allNotifs());
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

    // Otomatik olarak her 10 saniyede bir bildirimleri kontrol et
    setInterval(() => {
      if (this.authService.isLoggedIn()) {
        this.fetchNotifs(true);
      }
    }, 10000);
  }

  fetchNotifs(silent: boolean = false) {
    if (!silent) {
      this.isLoadingNotifs.set(true);
    }
    // Navbar shows 3 notifications per page, and we only fetch unread notifications for the dropdown
    this.authService.getUserNotifications(this.currentNotifPage(), 3, true).subscribe({
      next: (res: any) => {
        if (!silent) {
          this.isLoadingNotifs.set(false);
        }
        if (res.success && res.data) {
          const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
          this.allNotifs.set(items);
          if (res.data.extraData && res.data.extraData.UnreadCount !== undefined) {
            this.authService.unreadNotificationCount.set(res.data.extraData.UnreadCount);
          } else if (Array.isArray(res.data)) {
            const unreadOnly = res.data.filter((n: any) => !n.isRead);
            this.authService.unreadNotificationCount.set(unreadOnly.length);
          }
          // The backend already handles TotalPages
          this.paginatedNotifsTotalPages = res.data.totalPages || 1;
        }
      },
      error: () => {
        this.isLoadingNotifs.set(false);
      }
    });
  }

  paginatedNotifsTotalPages: number = 1;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    // If a modal is open, we don't close the dropdowns here
    if (!this.elRef.nativeElement.contains(event.target) && !(event.target as HTMLElement).closest('.notif-modal-backdrop')) {
      this.isNotifOpen.set(false);
      this.isDropdownOpen.set(false);
      this.isSearchOpen.set(false);
    }

    // Ekranın herhangi bir yerine tıklandığında bildirimleri sessizce güncelle
    // (Spam yapmamak için en az 5 saniyede bir çalışmasına izin veriyoruz)
    if (this.authService.isLoggedIn()) {
      const now = Date.now();
      if (now - this.lastNotifCheckTime > 5000) {
        this.lastNotifCheckTime = now;
        // Eğer dropdown zaten açıksa ve bir yere tıkladıysa, UI'da 'Yükleniyor' çıkmaması için sessiz(fetchNotifs(true)) yaparız
        this.fetchNotifs(true);
      }
    }
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    
    if (!this.searchQuery() || this.searchQuery().length < 2) {
      this.searchResults.set([]);
      this.isSearchOpen.set(false);
      return;
    }

    this.isSearching.set(true);
    this.isSearchOpen.set(true);

    this.searchTimeout = setTimeout(() => {
      this.socialService.searchUsers(this.searchQuery()).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.searchResults.set(res.data);
          }
          this.isSearching.set(false);
        },
        error: () => {
          this.isSearching.set(false);
          this.searchResults.set([]);
        }
      });
    }, 400); // 400ms debounce
  }

  closeSearch() {
    this.isSearchOpen.set(false);
    this.searchQuery.set('');
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
      this.fetchNotifs(true);
    }
  }

  nextNotifPage(e: Event) {
    e.stopPropagation(); // Dropdown kapanmasını engelle
    if (this.currentNotifPage() < this.paginatedNotifsTotalPages) {
      this.currentNotifPage.update(p => p + 1);
      this.fetchNotifs(true);
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

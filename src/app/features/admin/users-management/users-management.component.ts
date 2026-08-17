import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BlogService } from '../../../core/services/blog.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminUserDto, UserNotification, PaginatedResult } from '../../../core/models/auth.model';
import { BlogPost } from '../../../core/models/blog.model';
import { parseAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './users-management.component.html',
  styleUrl: './users-management.component.css'
})
export class UsersManagementComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  blogService = inject(BlogService);
  toastService = inject(ToastService);

  users = signal<AdminUserDto[]>([]);
  paginatedData = signal<PaginatedResult<AdminUserDto> | null>(null);
  isLoading = signal<boolean>(false);

  // Filters & Search
  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  selectedRoleFilter = signal<string>('ALL');
  selectedStatusFilter = signal<string>('ALL');

  // Stats computed
  adminCount = computed(() => this.users().filter(u => u.role === 'Admin').length);
  authorCount = computed(() => this.users().filter(u => u.role === 'Author').length);
  readerCount = computed(() => this.users().filter(u => u.role === 'User').length);
  bannedCount = computed(() => this.users().filter(u => u.isBanned).length);

  // Filtered list (client side fallback for role/status if needed, but search is server side)
  filteredUsers = computed(() => {
    let list = this.users();

    if (this.selectedRoleFilter() !== 'ALL') {
      list = list.filter(u => u.role === this.selectedRoleFilter());
    }

    if (this.selectedStatusFilter() === 'ACTIVE') {
      list = list.filter(u => !u.isBanned);
    } else if (this.selectedStatusFilter() === 'BANNED') {
      list = list.filter(u => u.isBanned);
    }

    return list;
  });

  // Modal 1: User Posts State
  selectedUserForPosts = signal<AdminUserDto | null>(null);
  userPosts = signal<BlogPost[]>([]);
  isLoadingPosts = signal<boolean>(false);

  // Modal 2: Delete Post State
  selectedPostForDeletion = signal<BlogPost | null>(null);
  deletePostReason = '';
  sendDeletePostEmail = true;
  isDeletingPost = signal<boolean>(false);

  // Modal 3: Ban User State
  selectedUserForBan = signal<AdminUserDto | null>(null);
  banDurationType = signal<string>('PERMANENT'); // 'PERMANENT', '1H', '1D', '7D', '30D', 'CUSTOM'
  customBanMinutes: number = 60;
  banReason: string = '';
  banReasonError = signal<boolean>(false);
  isSubmittingBan = signal<boolean>(false);

  // Modal 4: Direct Message / Notification State
  selectedUserForMessage = signal<AdminUserDto | null>(null);
  messageTitle = '';
  messageBody = '';
  messageType: 'Warning' | 'Info' | 'PostDeleted' = 'Warning';
  isSendingMessage = signal<boolean>(false);

  ngOnInit() {
    this.loadUsers();
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  private updateBodyScrollLock() {
    const anyModalOpen = !!this.selectedUserForPosts() || !!this.selectedPostForDeletion() ||
      !!this.selectedUserForBan() || !!this.selectedUserForMessage();
    document.body.style.overflow = anyModalOpen ? 'hidden' : '';
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadUsers();
  }

  clearSearch() {
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.loadUsers();
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadUsers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  loadUsers() {
    this.isLoading.set(true);
    this.authService.getAllUsers(this.currentPage(), this.pageSize(), this.searchQuery()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.paginatedData.set(res.data);
          this.users.set(res.data.items);
        } else {
          this.toastService.error('Hata', res.message || 'Kullanıcılar getirilemedi.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const parsed = parseAuthError(err, 'Kullanıcı listesi yüklenemedi.');
        this.toastService.error('Hata', parsed.generalMessage);
      }
    });
  }

  // --- POSTS VIEWING & DELETION ---
  viewUserPosts(user: AdminUserDto) {
    this.selectedUserForPosts.set(user);
    this.isLoadingPosts.set(true);
    this.userPosts.set([]);
    this.updateBodyScrollLock();

    this.blogService.getByAuthor(user.id).subscribe({
      next: (posts) => {
        this.isLoadingPosts.set(false);
        this.userPosts.set(posts || []);
      },
      error: () => {
        this.isLoadingPosts.set(false);
        this.toastService.error('Hata', 'Kullanıcının yazıları alınamadı.');
      }
    });
  }

  closePostsModal() {
    this.selectedUserForPosts.set(null);
    this.userPosts.set([]);
    this.updateBodyScrollLock();
  }

  openDeletePostModal(post: BlogPost) {
    this.selectedPostForDeletion.set(post);
    this.deletePostReason = '';
    this.sendDeletePostEmail = true;
    this.updateBodyScrollLock();
  }

  closeDeletePostModal() {
    this.selectedPostForDeletion.set(null);
    this.deletePostReason = '';
    this.updateBodyScrollLock();
  }

  confirmDeletePost() {
    const post = this.selectedPostForDeletion();
    if (!post || !this.deletePostReason.trim()) {
      this.toastService.warning('Uyarı', 'Lütfen yazının silinme gerekçesini belirtiniz.');
      return;
    }

    this.isDeletingPost.set(true);
    this.blogService.adminDelete(post.id, {
      reason: this.deletePostReason.trim(),
      sendEmailNotification: this.sendDeletePostEmail
    }).subscribe({
      next: (res) => {
        this.isDeletingPost.set(false);
        this.toastService.success('Yazı Kaldırıldı ', 'Yazı başarıyla silindi ve yazara bildirim/mail iletildi.');
        this.userPosts.update(list => list.filter(p => p.id !== post.id));
        this.closeDeletePostModal();
      },
      error: (err) => {
        this.isDeletingPost.set(false);
        this.toastService.error('Silme Başarısız', err?.error?.message || 'Yazı silinirken bir hata oluştu.');
      }
    });
  }

  // --- BAN / UNBAN ---
  openBanModal(user: AdminUserDto) {
    this.selectedUserForBan.set(user);
    this.banDurationType.set('PERMANENT');
    this.customBanMinutes = 0;
    this.banReason = '';
    this.banReasonError.set(false);
    this.updateBodyScrollLock();
  }

  closeBanModal() {
    this.selectedUserForBan.set(null);
    this.banReason = '';
    this.banReasonError.set(false);
    this.updateBodyScrollLock();
  }

  confirmBanUser() {
    const user = this.selectedUserForBan();
    if (!user) return;

    if (!this.banReason || !this.banReason.trim()) {
      this.banReasonError.set(true);
      return;
    }
    this.banReasonError.set(false);

    let durationMinutes: number | null = null;
    switch (this.banDurationType()) {
      case '1H': durationMinutes = 60; break;
      case '1D': durationMinutes = 1440; break;
      case '7D': durationMinutes = 10080; break;
      case '30D': durationMinutes = 43200; break;
      case 'CUSTOM': durationMinutes = Number(this.customBanMinutes) || 60; break;
      case 'PERMANENT':
      default:
        durationMinutes = null;
        break;
    }

    this.isSubmittingBan.set(true);
    this.authService.banUser({
      userId: user.id,
      isBanned: true,
      durationMinutes: durationMinutes,
      banReason: this.banReason.trim(),
      reason: this.banReason.trim()
    }).subscribe({
      next: (res) => {
        this.isSubmittingBan.set(false);
        if (res.success) {
          this.toastService.success('Kullanıcı Yasaklandı ', `${user.username} adlı kullanıcı başarıyla banlandı ve e-posta bildirimi iletildi.`);
          this.closeBanModal();
          this.loadUsers();
        } else {
          this.toastService.error('Hata', res.message);
        }
      },
      error: (err) => {
        this.isSubmittingBan.set(false);
        const parsed = parseAuthError(err, 'Kullanıcı yasaklanamadı.');
        this.toastService.error('Hata', parsed.generalMessage);
      }
    });
  }

  unbanUser(user: AdminUserDto) {
    if (!confirm(`${user.username} kullanıcısının yasağını kaldırmak istediğinize emin misiniz?`)) {
      return;
    }

    this.authService.unbanUser(user.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.success('Yasak Kaldırıldı ', `${user.username} kullanıcısının hesabı yeniden aktif edildi.`);
          this.loadUsers();
        } else {
          this.toastService.error('Hata', res.message);
        }
      },
      error: (err) => {
        const parsed = parseAuthError(err, 'Yasak kaldırılamadı.');
        this.toastService.error('Hata', parsed.generalMessage);
      }
    });
  }

  // --- MESSAGE / NOTIFICATION ---
  openMessageModal(user: AdminUserDto) {
    this.selectedUserForMessage.set(user);
    this.messageTitle = '';
    this.messageBody = '';
    this.messageType = 'Warning';
    this.updateBodyScrollLock();
  }

  closeMessageModal() {
    this.selectedUserForMessage.set(null);
    this.messageTitle = '';
    this.messageBody = '';
    this.updateBodyScrollLock();
  }

  confirmSendMessage() {
    const user = this.selectedUserForMessage();
    if (!user || !this.messageTitle.trim() || !this.messageBody.trim()) {
      this.toastService.warning('Uyarı', 'Lütfen başlık ve mesaj içeriğini doldurunuz.');
      return;
    }

    this.isSendingMessage.set(true);
    this.authService.sendAdminNotification({
      userId: user.id,
      title: this.messageTitle.trim(),
      message: this.messageBody.trim(),
      type: this.messageType
    }).subscribe({
      next: (res) => {
        this.isSendingMessage.set(false);
        if (res.success) {
          this.toastService.success('Bildirim Gönderildi ', `${user.username} kullanıcısına bildirim ve e-posta iletildi.`);
          this.closeMessageModal();
        } else {
          this.toastService.error('Hata', res.message);
        }
      },
      error: (err) => {
        this.isSendingMessage.set(false);
        const parsed = parseAuthError(err, 'Bildirim gönderilemedi.');
        this.toastService.error('Hata', parsed.generalMessage);
      }
    });
  }

  getExcerpt(content: string): string {
    if (!content) return '';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }
}

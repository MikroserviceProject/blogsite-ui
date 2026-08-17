import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BlogService } from '../../../core/services/blog.service';
import { ToastService } from '../../../core/services/toast.service';
import { BlogPost, UpdatePostRequest } from '../../../core/models/blog.model';
import { UserNotification } from '../../../core/models/auth.model';
import { parseAuthError } from '../../../core/utils/auth-error-parser';

import { UsersManagementComponent } from '../../admin/users-management/users-management.component';
import { AuthorApprovalsComponent } from '../../admin/author-approvals/author-approvals.component';

interface PasswordRules {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasDigit: boolean;
  hasSpecial: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UsersManagementComponent, AuthorApprovalsComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  blogService = inject(BlogService);
  toastService = inject(ToastService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  // Active Tab: 'PROFILE', 'POSTS', 'NOTIFICATIONS', 'SETTINGS'
  activeTab = signal<string>('PROFILE');

  // --- Profile Edit State ---
  isEditing = signal<boolean>(false);
  editUsername: string = '';
  editEmail: string = '';
  isSaving = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  isUploadingAvatar = signal<boolean>(false);
  isResending = signal<boolean>(false);

  // --- Password Change State ---
  isChangingPassword = signal<boolean>(false);
  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  isSavingPassword = signal<boolean>(false);
  passwordError = signal<string | null>(null);

  rules = signal<PasswordRules>({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasDigit: false,
    hasSpecial: false
  });

  isNewPasswordValid = computed(() => {
    const r = this.rules();
    return r.hasMinLength && r.hasUpperCase && r.hasLowerCase && r.hasDigit && r.hasSpecial;
  });

  // --- Author Posts Management State ---
  myPosts = signal<BlogPost[]>([]);
  isLoadingMyPosts = signal<boolean>(false);
  postTypeFilter = signal<string>('ALL'); // 'ALL', 'Blog', 'Koseyazisi', 'Draft'
  postSearchQuery: string = '';

  filteredMyPosts = computed(() => {
    let list = this.myPosts();
    const filter = this.postTypeFilter();
    const q = this.postSearchQuery.trim().toLowerCase();

    if (filter === 'Blog') {
      list = list.filter(p => p.type === 'Blog' && p.status === 'Published');
    } else if (filter === 'Koseyazisi') {
      list = list.filter(p => p.type === 'Koseyazisi' && p.status === 'Published');
    } else if (filter === 'Draft') {
      list = list.filter(p => p.status === 'Draft');
    }

    if (q) {
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
    }

    return list;
  });

  // --- Edit Post Modal State ---
  editingPost = signal<BlogPost | null>(null);
  editPostTitle: string = '';
  editPostContent: string = '';
  editPostStatus: 'Draft' | 'Published' = 'Published';
  newPostPhotoFile: File | null = null;
  removeExistingPhoto: boolean = false;
  isSavingPost = signal<boolean>(false);

  // --- User Notifications State ---
  notifications = signal<UserNotification[]>([]);
  isLoadingNotifications = signal<boolean>(false);
  unreadNotificationCount = computed(() => this.notifications().filter(n => !n.isRead).length);
  
  currentNotifPage = signal<number>(1);
  totalNotificationPages = signal<number>(1);
  paginatedNotifications = computed(() => this.notifications());
  
  Math = Math;


  // --- Account Deletion State ---
  showAccountDeletionModal = signal<boolean>(false);
  deletionLinkSent = signal<boolean>(false);
  isRequestingDeletionCode = signal<boolean>(false);
  isDeletingAccount = signal<boolean>(false);

  // --- Account Deactivation State ---
  showAccountDeactivationModal = signal<boolean>(false);
  isDeactivating = signal<boolean>(false);

  // --- Support Request State ---
  supportRequestType: string = 'Istek';
  supportRequestMessage: string = '';
  isSubmittingSupport = signal<boolean>(false);

  // --- Author Application State ---
  showAuthorForm = signal<boolean>(false);
  authorApplyUniversity: string = '';
  authorApplyCvFile: File | null = null;
  isApplyingAuthor = signal<boolean>(false);
  
  // --- Selected Notification State ---
  selectedNotification = signal<UserNotification | null>(null);
  expandNotifId: string | null = null;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.switchTab(params['tab']);
      }
      if (params['expandId']) {
        this.expandNotifId = params['expandId'];
        if (this.notifications().length > 0) {
          this.autoExpandNotification();
        }
      }
    });
    this.initFormData();
    this.loadUserData();
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  loadUserData() {
    this.authService.getMe().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.initFormData();
          if (this.authService.isAuthor() || this.authService.isAdmin()) {
            this.loadMyPosts();
          }
          this.loadNotifications();
        }
      }
    });
  }

  switchTab(tab: string) {
    this.activeTab.set(tab);
    if (tab === 'POSTS') {
      this.loadMyPosts();
    } else if (tab === 'NOTIFICATIONS') {
      this.loadNotifications();
    }
  }

  initFormData() {
    const user = this.authService.currentUser();
    if (user) {
      this.editUsername = user.username;
      this.editEmail = user.email;
    }
  }

  // --- MY POSTS MANAGEMENT ---
  loadMyPosts() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.isLoadingMyPosts.set(true);
    this.blogService.getByAuthor(user.id).subscribe({
      next: (posts) => {
        this.isLoadingMyPosts.set(false);
        this.myPosts.set(posts || []);
      },
      error: () => {
        this.isLoadingMyPosts.set(false);
      }
    });
  }

  openEditPostModal(post: BlogPost) {
    this.editingPost.set(post);
    this.editPostTitle = post.title;
    this.editPostContent = post.content;
    this.editPostStatus = post.status;
    this.newPostPhotoFile = null;
    this.removeExistingPhoto = false;
    document.body.style.overflow = 'hidden';
  }

  closeEditPostModal() {
    this.editingPost.set(null);
    this.newPostPhotoFile = null;
    this.removeExistingPhoto = false;
    document.body.style.overflow = '';
  }

  onPostPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.newPostPhotoFile = input.files[0];
      this.removeExistingPhoto = false;
    }
  }

  computeEditPostType(): 'Blog' | 'Koseyazisi' {
    const hasPhoto = this.newPostPhotoFile !== null
      || (!!this.editingPost()?.photoUrl && !this.removeExistingPhoto);
    return hasPhoto ? 'Blog' : 'Koseyazisi';
  }

  savePostChanges() {
    const post = this.editingPost();
    if (!post || !this.editPostTitle.trim() || !this.editPostContent.trim()) {
      this.toastService.warning('Uyarı', 'Başlık ve içerik alanları zorunludur.');
      return;
    }

    this.isSavingPost.set(true);
    const updateReq: UpdatePostRequest = {
      title: this.editPostTitle.trim(),
      content: this.editPostContent.trim(),
      status: this.editPostStatus,
      photo: this.newPostPhotoFile,
      removePhoto: this.removeExistingPhoto
    };

    this.blogService.update(post.id, updateReq).subscribe({
      next: (updated) => {
        this.isSavingPost.set(false);
        this.toastService.success('Yazı Güncellendi ', 'Değişiklikleriniz başarıyla kaydedildi.');
        this.closeEditPostModal();
        this.loadMyPosts();
      },
      error: (err) => {
        this.isSavingPost.set(false);
        this.toastService.error('Güncelleme Başarısız', err?.error?.message || 'Yazı güncellenirken bir hata oluştu.');
      }
    });
  }

  deletePost(post: BlogPost) {
    if (!confirm(`"${post.title}" başlıklı yazınızı silmek istediğinize emin misiniz?`)) {
      return;
    }

    this.blogService.delete(post.id).subscribe({
      next: () => {
        this.toastService.success('Yazı Silindi ', 'Yazınız başarıyla kaldırıldı.');
        this.myPosts.update(list => list.filter(p => p.id !== post.id));
      },
      error: (err) => {
        this.toastService.error('Silme Hatası', err?.error?.message || 'Yazı silinemedi.');
      }
    });
  }

  getSnippet(content: string): string {
    if (!content) return '';
    return content.length > 120 ? content.substring(0, 120) + '...' : content;
  }

  // --- NOTIFICATIONS ---
  loadNotifications(page: number = 1) {
    this.isLoadingNotifications.set(true);
    this.authService.getUserNotifications(page, 10, false).subscribe({
      next: (res) => {
        this.isLoadingNotifications.set(false);
        if (res.success && res.data) {
          const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
          this.notifications.set(items);
          this.currentNotifPage.set(res.data.currentPage || 1);
          this.totalNotificationPages.set(res.data.totalPages || 1);
          this.autoExpandNotification();
        }
      },
      error: () => {
        this.isLoadingNotifications.set(false);
      }
    });
  }

  nextNotifPage() {
    if (this.currentNotifPage() < this.totalNotificationPages()) {
      this.loadNotifications(this.currentNotifPage() + 1);
    }
  }

  prevNotifPage() {
    if (this.currentNotifPage() > 1) {
      this.loadNotifications(this.currentNotifPage() - 1);
    }
  }

  autoExpandNotification() {
    if (this.expandNotifId && this.notifications().length > 0) {
      const notifToExpand = this.notifications().find(n => n.id === this.expandNotifId);
      if (notifToExpand) {
        this.toggleNotification(notifToExpand);
        this.expandNotifId = null; // Sadece bir kere aç
      }
    }
  }

  toggleNotification(notif: UserNotification) {
    this.selectedNotification.set(notif);
    if (!notif.isRead) {
      this.markAsRead(notif);
    }
  }
  
  closeNotificationModal() {
    this.selectedNotification.set(null);
  }

  markAsRead(notif: UserNotification) {
    this.authService.markNotificationAsRead(notif.id).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
        );
      }
    });
  }

  // --- ACCOUNT DEACTIVATION ---
  openAccountDeactivationModal() {
    this.showAccountDeactivationModal.set(true);
  }

  closeAccountDeactivationModal() {
    this.showAccountDeactivationModal.set(false);
  }

  deactivateAccount() {
    this.isDeactivating.set(true);
    this.authService.deactivateAccount().subscribe({
      next: (res: any) => {
        this.isDeactivating.set(false);
        if(res.success) {
          this.toastService.success('Hesap Donduruldu ❄️', 'Hesabınız başarıyla donduruldu. Çıkış yapılıyor...');
          this.closeAccountDeactivationModal();
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      },
      error: (err: any) => {
        this.isDeactivating.set(false);
        this.toastService.error('Hata', 'Hesap dondurma işlemi başarısız oldu.');
      }
    });
  }

  // --- ACCOUNT DELETION ---
  openAccountDeletionModal() {
    this.showAccountDeletionModal.set(true);
    this.deletionLinkSent.set(false);
  }

  closeAccountDeletionModal() {
    this.showAccountDeletionModal.set(false);
    this.deletionLinkSent.set(false);
  }

  requestDeletionLink() {
    this.isRequestingDeletionCode.set(true);
    this.authService.requestAccountDeletion().subscribe({
      next: (res) => {
        this.isRequestingDeletionCode.set(false);
        if (res.success) {
          this.deletionLinkSent.set(true);
          this.toastService.success('Bağlantı Gönderildi ', 'Hesap silme onay bağlantınız e-posta adresinize iletildi.');
        } else {
          this.toastService.error('Hata', res.message);
        }
      },
      error: (err) => {
        this.isRequestingDeletionCode.set(false);
        const parsed = parseAuthError(err, 'Silme bağlantısı gönderilemedi.');
        this.toastService.error('Hata', parsed.generalMessage);
      }
    });
  }

  // --- PROFILE EDITING ---
  startEditing() {
    this.initFormData();
    this.errorMessage.set(null);
    this.isEditing.set(true);
  }

  cancelEditing() {
    this.initFormData();
    this.errorMessage.set(null);
    this.isEditing.set(false);
  }

  saveProfile() {
    if (!this.editUsername.trim() || !this.editEmail.trim()) {
      this.errorMessage.set('Kullanıcı adı ve e-posta alanları boş bırakılamaz.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const prevEmail = this.authService.currentUser()?.email;
    const newEmail = this.editEmail.trim();
    const newUsername = this.editUsername.trim();

    this.authService.updateProfile({
      username: newUsername,
      email: newEmail
    }).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.isEditing.set(false);
          if (prevEmail !== newEmail) {
            this.toastService.warning(
              'E-Posta Değiştirildi!',
              'Güvenlik gereği oturumunuz kapatıldı. Yeni e-posta adresinize gönderilen bağlantı ile hesabınızı doğrulayınız.'
            );
            this.authService.logout();
            this.router.navigate(['/login']);
          } else {
            this.toastService.success('Profil Güncellendi', 'Kullanıcı adı ve bilgileriniz başarıyla kaydedildi.');
          }
        } else {
          this.errorMessage.set(res.message);
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        const parsed = parseAuthError(err);
        this.errorMessage.set(parsed.generalMessage);
        this.toastService.error('Güncelleme Hatası', parsed.generalMessage);
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
      this.toastService.error('Boyut Hatası', 'Profil resmi 5 MB\'dan küçük olmalıdır.');
      return;
    }

    this.isUploadingAvatar.set(true);
    this.authService.uploadAvatar(file).subscribe({
      next: (res) => {
        this.isUploadingAvatar.set(false);
        if (res.success) {
          this.toastService.success('Fotoğraf Güncellendi ', 'Yeni profil resminiz başarıyla kaydedildi.');
        } else {
          this.toastService.error('Hata', res.message);
        }
        input.value = '';
      },
      error: (err) => {
        this.isUploadingAvatar.set(false);
        const parsed = parseAuthError(err);
        this.toastService.error('Yükleme Başarısız', parsed.generalMessage);
        input.value = '';
      }
    });
  }

  removeAvatar() {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    this.isUploadingAvatar.set(true);
    this.authService.updateProfile({
      username: currentUser.username,
      email: currentUser.email,
      profilePictureUrl: ''
    }).subscribe({
      next: (res) => {
        this.isUploadingAvatar.set(false);
        if (res.success) {
          this.toastService.info('Profil Resmi Kaldırıldı', 'Varsayılan harfli profil görseline dönüldü.');
        } else {
          this.toastService.error('Hata', res.message);
        }
      },
      error: (err) => {
        this.isUploadingAvatar.set(false);
        const parsed = parseAuthError(err);
        this.toastService.error('Hata', parsed.generalMessage);
      }
    });
  }

  // --- PASSWORD CHANGE ---
  onNewPasswordChange(value: string) {
    this.rules.set({
      hasMinLength: value.length >= 8,
      hasUpperCase: /[A-Z]/.test(value),
      hasLowerCase: /[a-z]/.test(value),
      hasDigit: /[0-9]/.test(value),
      hasSpecial: /[^a-zA-Z0-9]/.test(value)
    });
  }

  cancelPasswordChange() {
    this.isChangingPassword.set(false);
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmNewPassword = '';
    this.passwordError.set(null);
  }

  changePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmNewPassword) {
      this.passwordError.set('Lütfen tüm şifre alanlarını doldurunuz.');
      return;
    }

    if (this.currentPassword === this.newPassword) {
      this.passwordError.set('Yeni şifre eski şifrenizle aynı olamaz. Lütfen farklı bir şifre belirleyiniz.');
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.passwordError.set('Yeni şifreler eşleşmiyor.');
      return;
    }

    if (!this.isNewPasswordValid()) {
      this.passwordError.set('Yeni şifre belirlenen güvenlik kurallarını sağlamıyor.');
      return;
    }

    this.isSavingPassword.set(true);
    this.passwordError.set(null);

    this.authService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: (res) => {
        this.isSavingPassword.set(false);
        if (res.success) {
          this.toastService.success('Şifreniz Değiştirildi ', 'Yeni şifreniz başarıyla kaydedildi.');
          this.cancelPasswordChange();
        } else {
          this.passwordError.set(res.message);
          this.toastService.error('Hata', res.message);
        }
      },
      error: (err) => {
        this.isSavingPassword.set(false);
        const parsed = parseAuthError(err, 'Şifre değiştirilemedi.');
        this.passwordError.set(parsed.generalMessage);
        this.toastService.error('Hata', parsed.generalMessage);
      }
    });
  }



  // --- AUTHOR APPLICATION ---
  onAuthorApplyCvSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        this.toastService.error('Geçersiz Dosya', 'Lütfen sadece PDF formatında CV dosyası yükleyiniz.');
        input.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        this.toastService.error('Boyut Sınırı', 'Dosya boyutu en fazla 10 MB olabilir.');
        input.value = '';
        return;
      }
      this.authorApplyCvFile = file;
    }
  }

  removeAuthorApplyCv(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.authorApplyCvFile = null;
    const input = document.getElementById('author-cv-input') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  getFormattedFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onApplyAuthorSubmit() {
    if (!this.authorApplyUniversity || !this.authorApplyUniversity.trim() || !this.authorApplyCvFile) {
      this.toastService.warning('Eksik Bilgi', 'Lütfen üniversite bilginizi giriniz ve CV dosyanızı yükleyiniz.');
      return;
    }

    const formData = new FormData();
    formData.append('university', this.authorApplyUniversity.trim());
    formData.append('cvFile', this.authorApplyCvFile);

    this.isApplyingAuthor.set(true);
    this.authService.applyForAuthor(formData).subscribe({
      next: (res) => {
        this.isApplyingAuthor.set(false);
        if (res.success) {
          this.toastService.success('Başvuru Gönderildi', res.message || 'Yazar başvurunuz başarıyla alınmıştır.');
          this.authorApplyUniversity = '';
          this.authorApplyCvFile = null;
          this.loadUserData(); // Reload to update status to Pending
        } else {
          this.toastService.error('Başvuru Hatası', res.message || 'Başvuru gönderilirken bir sorun oluştu.');
        }
      },
      error: (err) => {
        this.isApplyingAuthor.set(false);
        this.toastService.error('Bağlantı Hatası', err?.error?.message || 'Yazar başvurusu tamamlanamadı.');
      }
    });
  }

  resendCode() {
    const email = this.authService.currentUser()?.email;
    if (!email) return;

    this.isResending.set(true);
    this.authService.resendEmailConfirmation(email).subscribe({
      next: (res) => {
        this.isResending.set(false);
        if (res.success) {
          this.toastService.success('Bağlantı Gönderildi ', 'Doğrulama bağlantısı e-posta adresinize iletildi.');
        } else {
          this.toastService.error('Hata', res.message);
        }
      },
      error: (err) => {
        this.isResending.set(false);
        const parsed = parseAuthError(err);
        this.toastService.error('Hata', parsed.generalMessage);
      }
    });
  }

  submitSupportRequest() {
    if (this.supportRequestMessage.trim().length < 10) return;
    
    this.isSubmittingSupport.set(true);
    this.authService.sendSupportRequest(this.supportRequestType, this.supportRequestMessage).subscribe({
      next: (res) => {
        this.isSubmittingSupport.set(false);
        if (res.success) {
          this.toastService.success('Başarılı', res.message);
          this.supportRequestMessage = '';
        } else {
          this.toastService.error('Hata', res.message);
        }
      },
      error: (err) => {
        this.isSubmittingSupport.set(false);
        const parsed = parseAuthError(err);
        this.toastService.error('Hata', parsed.generalMessage);
      }
    });
  }

  logout() {
    this.authService.logout();
    this.toastService.info('Oturum Kapatıldı', 'Güvenli bir şekilde çıkış yaptınız.');
  }
}

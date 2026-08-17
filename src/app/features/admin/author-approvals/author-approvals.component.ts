import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthorApplication } from '../../../core/models/auth.model';
import { parseAuthError } from '../../../core/utils/auth-error-parser';

type TabType = 'pending' | 'approved' | 'rejected' | 'all';

@Component({
  selector: 'app-author-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './author-approvals.component.html',
  styleUrl: './author-approvals.component.css'
})
export class AuthorApprovalsComponent implements OnInit {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  sanitizer = inject(DomSanitizer);

  allAuthors = signal<AuthorApplication[]>([]);
  activeTab = signal<TabType>('pending');
  searchQuery = '';
  isLoading = signal(false);
  processingIds = signal<Set<string>>(new Set());

  // Modal States
  rejectModalAuthor = signal<AuthorApplication | null>(null);
  rejectionReason = '';

  cvPreviewModal = signal<AuthorApplication | null>(null);
  safeCvPreviewUrl: SafeResourceUrl | null = null;

  // Computed Lists
  pendingList = computed(() => 
    this.allAuthors().filter(a => this.isStatus(a, 'Pending'))
  );

  approvedList = computed(() => 
    this.allAuthors().filter(a => this.isStatus(a, 'Approved'))
  );

  rejectedList = computed(() => 
    this.allAuthors().filter(a => this.isStatus(a, 'Rejected'))
  );

  displayedAuthors = computed(() => {
    switch (this.activeTab()) {
      case 'pending': return this.pendingList();
      case 'approved': return this.approvedList();
      case 'rejected': return this.rejectedList();
      default: return this.allAuthors();
    }
  });

  filteredAuthors = computed(() => {
    const list = this.displayedAuthors();
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return list;
    return list.filter(a => 
      a.username.toLowerCase().includes(query) ||
      a.email.toLowerCase().includes(query) ||
      (a.university && a.university.toLowerCase().includes(query))
    );
  });

  ngOnInit() {
    this.loadAuthors();
  }

  setTab(tab: TabType) {
    this.activeTab.set(tab);
  }

  isStatus(author: AuthorApplication, status: string): boolean {
    const s = author.authorApprovalStatus || 'Pending';
    return s.toLowerCase() === status.toLowerCase();
  }

  isProcessing(id: string): boolean {
    return this.processingIds().has(id);
  }

  loadAuthors() {
    this.isLoading.set(true);
    this.authService.getAuthorApplications().subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.allAuthors.set(res.data);
        } else {
          this.toastService.error('Hata', res.message || 'Başvurular alınamadı.');
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        const parsed = parseAuthError(err, 'Başvurular yüklenirken hata oluştu.');
        this.toastService.error('Hata', parsed.generalMessage);
      }
    });
  }

  onApprove(author: AuthorApplication) {
    if (!confirm(`'${author.username}' kullanıcısının yazar başvurusunu onaylamak istiyor musunuz?\n\nOnaylandığında kullanıcıya e-posta aktivasyon bağlantısı iletilecektir.`)) {
      return;
    }

    const currentSet = new Set(this.processingIds());
    currentSet.add(author.id);
    this.processingIds.set(currentSet);

    this.authService.approveAuthor(author.id).subscribe({
      next: (res: any) => {
        const set = new Set(this.processingIds());
        set.delete(author.id);
        this.processingIds.set(set);

        if (res.success) {
          this.toastService.success(
            'Başvuru Onaylandı ',
            `'${author.username}' başarıyla onaylandı ve aktivasyon e-postası iletildi.`
          );

          // State'i güncelle (Listeden silinmez, "Onaylananlar" sekmesine geçer!)
          this.allAuthors.set(
            this.allAuthors().map((a: AuthorApplication) => 
              a.id === author.id ? { ...a, authorApprovalStatus: 'Approved', authorRejectionReason: undefined } : a
            )
          );
        } else {
          this.toastService.error('Hata', res.message);
        }
      },
      error: (err: any) => {
        const set = new Set(this.processingIds());
        set.delete(author.id);
        this.processingIds.set(set);
        const parsed = parseAuthError(err, 'Onay işlemi başarısız.');
        this.toastService.error('Hata', parsed.generalMessage);
      }
    });
  }

  openRejectModal(author: AuthorApplication) {
    this.rejectModalAuthor.set(author);
    this.rejectionReason = '';
  }

  closeRejectModal() {
    this.rejectModalAuthor.set(null);
    this.rejectionReason = '';
  }

  confirmReject() {
    const author = this.rejectModalAuthor();
    if (!author) return;

    const currentSet = new Set(this.processingIds());
    currentSet.add(author.id);
    this.processingIds.set(currentSet);

    this.authService.rejectAuthor(author.id, this.rejectionReason.trim() || undefined).subscribe({
      next: (res: any) => {
        const set = new Set(this.processingIds());
        set.delete(author.id);
        this.processingIds.set(set);
        this.closeRejectModal();

        if (res.success) {
          this.toastService.info(
            'Başvuru Reddedildi',
            `'${author.username}' kullanıcısının başvurusu reddedildi.`
          );

          // State'i güncelle (Listeden silinmez, "Reddedilenler" sekmesine geçer!)
          this.allAuthors.set(
            this.allAuthors().map(a => 
              a.id === author.id ? { ...a, authorApprovalStatus: 'Rejected', authorRejectionReason: this.rejectionReason.trim() } : a
            )
          );
        } else {
          this.toastService.error('Hata', res.message);
        }
      },
      error: (err: any) => {
        const set = new Set(this.processingIds());
        set.delete(author.id);
        this.processingIds.set(set);
        const parsed = parseAuthError(err, 'Reddetme işlemi başarısız.');
        this.toastService.error('Hata', parsed.generalMessage);
      }
    });
  }

  openCvPreview(author: AuthorApplication) {
    if (!author.cvUrl) return;
    const fullUrl = this.authService.getCvUrl(author.cvUrl);
    if (fullUrl) {
      this.safeCvPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
      this.cvPreviewModal.set(author);
    }
  }

  closeCvPreview() {
    this.cvPreviewModal.set(null);
    this.safeCvPreviewUrl = null;
  }
}

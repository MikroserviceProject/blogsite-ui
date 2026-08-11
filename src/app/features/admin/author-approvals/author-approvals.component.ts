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
  template: `
    <div class="container admin-page">
      <!-- Top Banner Header -->
      <div class="admin-header-card card">
        <div class="admin-header-left">
          <div class="admin-icon-badge">👑</div>
          <div>
            <h1 class="admin-title">Yazar & Başvuru Yönetimi</h1>
            <p class="admin-subtitle">Sisteme yazar olarak başvuran adayların CV belgelerini inceleyin, başvuruları onaylayın veya yönetin.</p>
          </div>
        </div>
        <button class="btn btn-navy-outline btn-sm" (click)="loadAuthors()" [disabled]="isLoading()">
          <span>🔄</span> Listeyi Yenile
        </button>
      </div>

      <!-- Stats Grid / Tabs Switcher -->
      <div class="stats-grid">
        <div 
          class="stat-card card tab-card" 
          [class.active-tab]="activeTab() === 'pending'"
          (click)="setTab('pending')"
        >
          <div class="stat-icon icon-pending">⏳</div>
          <div class="stat-details">
            <span class="stat-label">Onay Bekleyenler</span>
            <span class="stat-value text-warning">{{ pendingList().length }}</span>
          </div>
          @if (activeTab() === 'pending') {
            <span class="tab-indicator"></span>
          }
        </div>

        <div 
          class="stat-card card tab-card" 
          [class.active-tab]="activeTab() === 'approved'"
          (click)="setTab('approved')"
        >
          <div class="stat-icon icon-approved">✅</div>
          <div class="stat-details">
            <span class="stat-label">Onaylanan Yazarlar</span>
            <span class="stat-value text-success">{{ approvedList().length }}</span>
          </div>
          @if (activeTab() === 'approved') {
            <span class="tab-indicator"></span>
          }
        </div>

        <div 
          class="stat-card card tab-card" 
          [class.active-tab]="activeTab() === 'rejected'"
          (click)="setTab('rejected')"
        >
          <div class="stat-icon icon-rejected">❌</div>
          <div class="stat-details">
            <span class="stat-label">Reddedilenler</span>
            <span class="stat-value text-danger">{{ rejectedList().length }}</span>
          </div>
          @if (activeTab() === 'rejected') {
            <span class="tab-indicator"></span>
          }
        </div>

        <div 
          class="stat-card card tab-card" 
          [class.active-tab]="activeTab() === 'all'"
          (click)="setTab('all')"
        >
          <div class="stat-icon icon-all">👥</div>
          <div class="stat-details">
            <span class="stat-label">Toplam Başvuru</span>
            <span class="stat-value text-navy">{{ allAuthors().length }}</span>
          </div>
          @if (activeTab() === 'all') {
            <span class="tab-indicator"></span>
          }
        </div>
      </div>

      <!-- Main Applications Table Card -->
      <div class="card applications-card">
        <div class="card-table-header">
          <div class="tab-title-group">
            <h2 class="tab-current-heading">
              @if (activeTab() === 'pending') { ⏳ Onay Bekleyen Yazar Başvuruları }
              @else if (activeTab() === 'approved') { ✅ Onaylanmış Aktif Yazarlar }
              @else if (activeTab() === 'rejected') { ❌ Reddedilen Başvurular }
              @else { 👥 Tüm Yazar Kayıtları }
            </h2>
            <span class="count-badge">{{ displayedAuthors().length }} Kayıt</span>
          </div>

          <div class="search-box">
            <input 
              type="text" 
              class="form-control form-control-sm search-input" 
              placeholder="İsim, e-posta veya üniversite ara..."
              [(ngModel)]="searchQuery"
            />
          </div>
        </div>

        @if (isLoading()) {
          <div class="loading-container">
            <span class="spinner-icon">⏳</span>
            <p>Veriler yükleniyor, lütfen bekleyin...</p>
          </div>
        } @else if (filteredAuthors().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">
              @if (activeTab() === 'pending') { 🎉 }
              @else if (activeTab() === 'approved') { 📝 }
              @else { 📭 }
            </span>
            <h3>
              @if (activeTab() === 'pending') { Bekleyen Başvuru Bulunmuyor }
              @else if (activeTab() === 'approved') { Henüz Onaylanmış Yazar Yok }
              @else if (activeTab() === 'rejected') { Reddedilen Başvuru Yok }
              @else { Kayıt Bulunamadı }
            </h3>
            <p>
              @if (activeTab() === 'pending') { İnceleme bekleyen yeni bir yazar başvurusu bulunmuyor. }
              @else { Bu filtreleme kriterine uyan herhangi bir kullanıcı listelenemedi. }
            </p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="applications-table">
              <thead>
                <tr>
                  <th>Yazar / Kullanıcı</th>
                  <th>E-Posta</th>
                  <th>Üniversite / Bölüm</th>
                  <th>CV / Özgeçmiş</th>
                  <th>Durum & Doğrulama</th>
                  <th>Tarih</th>
                  <th class="text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                @for (author of filteredAuthors(); track author.id) {
                  <tr class="table-row">
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar-sm">
                          {{ author.username.charAt(0).toUpperCase() }}
                        </div>
                        <div class="user-name-info">
                          <span class="uname">{{ author.username }}</span>
                          <span class="role-subtext">Yazar Adayı</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="email-text">{{ author.email }}</span>
                    </td>
                    <td>
                      <span class="uni-text">{{ author.university || 'Belirtilmemiş' }}</span>
                    </td>
                    <td>
                      @if (author.cvUrl) {
                        <div class="cv-actions">
                          <button 
                            type="button" 
                            class="btn btn-xs btn-preview-cv" 
                            (click)="openCvPreview(author)"
                            title="CV'yi Sayfa İçinde İncele"
                          >
                            👁️ Önizle
                          </button>
                          <a 
                            [href]="authService.getCvUrl(author.cvUrl)" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            class="btn btn-xs btn-open-cv"
                            title="Yeni Sekmede Aç"
                          >
                            📄 PDF ↗
                          </a>
                        </div>
                      } @else {
                        <span class="no-file-text">Dosya yok</span>
                      }
                    </td>
                    <td>
                      <div class="status-cell">
                        <!-- Başvuru Durum Rozeti -->
                        @if (isStatus(author, 'Approved')) {
                          <span class="badge badge-success">✓ Onaylandı</span>
                        } @else if (isStatus(author, 'Rejected')) {
                          <span class="badge badge-danger">✕ Reddedildi</span>
                        } @else {
                          <span class="badge badge-warning">⏳ Onay Bekliyor</span>
                        }

                        <!-- E-Posta Onay Durumu -->
                        @if (author.isEmailConfirmed) {
                          <span class="badge badge-email-confirmed" title="Kullanıcı e-postasını onaylamış ve giriş yapabilir">
                            📧 E-Posta Onaylı
                          </span>
                        } @else {
                          <span class="badge badge-email-unconfirmed" title="Kullanıcı henüz aktivasyon e-postasındaki linke tıklamamış">
                            ✉️ Doğrulama Bekliyor
                          </span>
                        }
                      </div>
                    </td>
                    <td>
                      <span class="date-text">{{ (author.authorApplicationDate || author.createdAt) | date:'d MMM y, HH:mm' }}</span>
                    </td>
                    <td class="text-right">
                      @if (isStatus(author, 'Pending')) {
                        <div class="action-buttons-group">
                          <button 
                            type="button" 
                            class="btn btn-success-action btn-sm" 
                            (click)="onApprove(author)"
                            [disabled]="isProcessing(author.id)"
                          >
                            ✓ Onayla
                          </button>
                          <button 
                            type="button" 
                            class="btn btn-danger-action btn-sm" 
                            (click)="openRejectModal(author)"
                            [disabled]="isProcessing(author.id)"
                          >
                            ✕ Reddet
                          </button>
                        </div>
                      } @else if (isStatus(author, 'Approved')) {
                        <span class="text-success-label">✅ İşlem Tamam</span>
                      } @else if (isStatus(author, 'Rejected')) {
                        <button 
                          type="button" 
                          class="btn btn-secondary btn-xs" 
                          (click)="onApprove(author)"
                          [disabled]="isProcessing(author.id)"
                          title="Fikrinizi değiştirdiyseniz yeniden onaylayabilirsiniz"
                        >
                          Tekrar Onayla
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- CV Görüntüleme Modalı -->
      @if (cvPreviewModal()) {
        <div class="modal-backdrop" (click)="closeCvPreview()">
          <div class="modal-card modal-cv-card card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-header-title">
                <span class="modal-header-icon">📄</span>
                <div>
                  <h3 class="modal-title">{{ cvPreviewModal()?.username }} - Özgeçmiş (CV)</h3>
                  <p class="modal-sub">{{ cvPreviewModal()?.email }} | {{ cvPreviewModal()?.university || 'Üniversite belirtilmemiş' }}</p>
                </div>
              </div>
              <div class="modal-actions-right">
                <a 
                  [href]="authService.getCvUrl(cvPreviewModal()?.cvUrl)" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="btn btn-primary btn-sm"
                >
                  Tam Ekranda Aç ↗
                </a>
                <button type="button" class="btn-close" (click)="closeCvPreview()">✕</button>
              </div>
            </div>
            <div class="modal-body-cv">
              @if (safeCvPreviewUrl) {
                <iframe [src]="safeCvPreviewUrl" class="cv-iframe" title="CV Önizleme"></iframe>
              } @else {
                <div class="empty-state">
                  <p>CV dosyası yüklenemedi veya desteklenmiyor.</p>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Reddetme Modalı -->
      @if (rejectModalAuthor()) {
        <div class="modal-backdrop" (click)="closeRejectModal()">
          <div class="modal-card card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">⚠️ Yazar Başvurusunu Reddet</h3>
              <button type="button" class="btn-close" (click)="closeRejectModal()">✕</button>
            </div>
            <div class="modal-body">
              <p class="modal-desc">
                <strong>{{ rejectModalAuthor()?.username }}</strong> kullanıcısının yazar başvurusunu reddetmek üzeresiniz. 
                Adaya gönderilecek e-postada yer alacak ret gerekçesini belirtebilirsiniz:
              </p>
              <div class="form-group">
                <label class="form-label" for="reject-reason">Ret Gerekçesi (Opsiyonel)</label>
                <textarea
                  id="reject-reason"
                  class="form-control"
                  rows="3"
                  [(ngModel)]="rejectionReason"
                  placeholder="Örn: Yüklenen CV belgesi okunamıyor veya akademik kriterleri karşılamıyor."
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeRejectModal()">İptal</button>
              <button 
                type="button" 
                class="btn btn-danger" 
                (click)="confirmReject()"
                [disabled]="isProcessing(rejectModalAuthor()!.id)"
              >
                Başvuruyu Reddet
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page {
      padding-top: 24px;
      padding-bottom: 60px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Header Banner */
    .admin-header-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }

    .admin-header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .admin-icon-badge {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-lg);
      background: var(--bg-subtle);
      border: 1.5px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      flex-shrink: 0;
    }

    .admin-title {
      font-size: 22px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0 0 4px 0;
      letter-spacing: -0.3px;
    }

    .admin-subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin: 0;
    }

    /* Tabs & Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .tab-card {
      background: var(--bg-card);
      border: 2px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 18px 22px;
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .tab-card:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }

    .tab-card.active-tab {
      border-color: var(--accent);
      background: var(--bg-subtle);
      box-shadow: 0 8px 25px rgba(245, 158, 11, 0.2);
    }

    .tab-indicator {
      position: absolute;
      bottom: 0;
      left: 20px;
      right: 20px;
      height: 3px;
      background: var(--accent);
      border-radius: 3px 3px 0 0;
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }

    .icon-pending { background: rgba(245, 158, 11, 0.15); }
    .icon-approved { background: rgba(16, 185, 129, 0.15); }
    .icon-rejected { background: rgba(239, 68, 68, 0.15); }
    .icon-all { background: var(--bg-subtle); }

    .stat-details {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 800;
      line-height: 1.2;
    }

    .text-warning { color: var(--accent); }
    .text-success { color: var(--success); }
    .text-danger { color: var(--danger); }
    .text-navy { color: var(--text-primary); }

    /* Applications Card */
    .applications-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 26px;
      box-shadow: 0 15px 35px -10px rgba(0, 0, 0, 0.35);
    }

    .card-table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }

    .tab-title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .tab-current-heading {
      font-size: 18px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .count-badge {
      background: var(--bg-subtle);
      color: var(--accent);
      font-size: 12px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      border: 1px solid var(--border);
    }

    .search-input {
      width: 280px;
      background: var(--bg-input);
      border: 1.5px solid var(--border);
      color: var(--text-primary);
      border-radius: var(--radius-md);
      padding: 8px 14px;
      font-size: 13px;
    }

    .search-input:focus {
      background: var(--bg-input);
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
    }

    /* Table Styles */
    .table-responsive {
      overflow-x: auto;
    }

    .applications-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .applications-table th {
      background: var(--bg-subtle);
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 16px;
      border-bottom: 2px solid var(--border);
    }

    .applications-table td {
      padding: 16px;
      border-bottom: 1px solid var(--border);
      color: var(--text-secondary);
      font-size: 13px;
      vertical-align: middle;
    }

    .table-row:hover td {
      background: var(--bg-subtle);
    }

    /* User Cell */
    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar-sm {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      background: var(--primary-gradient);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      flex-shrink: 0;
    }

    .user-name-info {
      display: flex;
      flex-direction: column;
    }

    .uname {
      font-weight: 700;
      color: var(--text-primary);
      font-size: 14px;
    }

    .role-subtext {
      font-size: 11px;
      color: var(--text-muted);
    }

    .email-text {
      color: var(--text-secondary);
      font-weight: 500;
    }

    .uni-text {
      color: var(--text-secondary);
      font-weight: 500;
    }

    /* CV Buttons */
    .cv-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-preview-cv {
      background: var(--bg-subtle);
      color: var(--accent);
      border: 1px solid var(--border);
      font-weight: 700;
      padding: 5px 10px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-preview-cv:hover {
      background: var(--bg-muted);
      border-color: var(--accent);
    }

    .btn-open-cv {
      background: var(--bg-card);
      color: var(--text-secondary);
      border: 1px solid var(--border);
      font-weight: 700;
      padding: 5px 10px;
      border-radius: var(--radius-sm);
      text-decoration: none;
      transition: all 0.2s;
    }

    .btn-open-cv:hover {
      background: var(--bg-subtle);
      color: var(--text-primary);
    }

    .no-file-text {
      color: var(--text-light);
      font-style: italic;
      font-size: 12px;
    }

    /* Status Cell & Badges */
    .status-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: flex-start;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 700;
    }

    .badge-success {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }

    .badge-warning {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    .badge-danger {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }

    .badge-email-confirmed {
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
      font-size: 10px;
    }

    .badge-email-unconfirmed {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
      font-size: 10px;
    }

    .date-text {
      color: var(--text-muted);
      font-size: 12px;
      white-space: nowrap;
    }

    .text-success-label {
      color: var(--success);
      font-weight: 700;
      font-size: 12px;
    }

    /* Actions */
    .action-buttons-group {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    .btn-success-action {
      background: #16a34a;
      color: #ffffff;
      border: none;
      padding: 7px 14px;
      border-radius: var(--radius-sm);
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-success-action:hover:not(:disabled) {
      background: #15803d;
      transform: translateY(-1px);
    }

    .btn-danger-action {
      background: #ef4444;
      color: #ffffff;
      border: none;
      padding: 7px 14px;
      border-radius: var(--radius-sm);
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-danger-action:hover:not(:disabled) {
      background: #dc2626;
      transform: translateY(-1px);
    }

    .btn-navy-outline {
      background: transparent;
      color: var(--accent);
      border: 1.5px solid var(--accent);
      font-weight: 700;
      padding: 7px 16px;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-navy-outline:hover:not(:disabled) {
      background: var(--accent);
      color: #ffffff;
    }

    .text-right {
      text-align: right;
    }

    /* Empty and Loading States */
    .loading-container, .empty-state {
      padding: 60px 20px;
      text-align: center;
      color: var(--text-muted);
    }

    .spinner-icon, .empty-icon {
      font-size: 44px;
      display: block;
      margin-bottom: 12px;
    }

    .empty-state h3 {
      color: var(--text-primary);
      font-size: 18px;
      margin-bottom: 6px;
    }

    .empty-state p {
      color: var(--text-muted);
      font-size: 13px;
      margin: 0;
    }

    /* CV Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(7, 13, 30, 0.8);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
      width: 100%;
      max-width: 520px;
      padding: 24px;
      color: var(--text-primary);
      animation: modalFadeIn 0.2s ease-out;
    }

    .modal-cv-card {
      max-width: 900px;
      height: 85vh;
      display: flex;
      flex-direction: column;
      padding: 20px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }

    .modal-header-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .modal-header-icon {
      font-size: 28px;
    }

    .modal-actions-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0 0 2px 0;
    }

    .modal-sub {
      font-size: 12px;
      color: var(--text-muted);
      margin: 0;
    }

    .btn-close {
      background: var(--bg-subtle);
      border: none;
      font-size: 16px;
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-close:hover {
      background: var(--bg-muted);
      color: var(--text-primary);
    }

    .modal-body-cv {
      flex: 1;
      min-height: 0;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .cv-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    .modal-desc {
      font-size: 14px;
      color: var(--text-secondary);
      margin-bottom: 16px;
      line-height: 1.5;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }

    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.97); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
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
            'Başvuru Onaylandı 🎉',
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

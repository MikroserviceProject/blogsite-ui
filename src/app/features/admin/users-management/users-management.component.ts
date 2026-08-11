import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
  template: `
    <div class="admin-tab-seamless-container">
      <div class="admin-main-card">
        <!-- Header Actions -->
      <div class="page-header" style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
        <div class="header-actions">
          <a routerLink="/admin/author-approvals" class="btn btn-secondary btn-sm" style="display: none;">
            Yazar Başvuruları
          </a>
          <button class="btn btn-primary btn-sm" (click)="loadUsers()" [disabled]="isLoading()">
             Yenile
          </button>
        </div>
      </div>

      <!-- Main Content Card -->
      <div class="table-card">
        <!-- Filter Toolbar -->
        <div class="posts-filter-bar" style="margin-bottom: 20px;">
          <div class="pills-row">
            <button class="filter-pill" [class.active]="selectedRoleFilter() === 'ALL' && selectedStatusFilter() === 'ALL'" (click)="selectedRoleFilter.set('ALL'); selectedStatusFilter.set('ALL')">
              Tümü ({{ users().length }})
            </button>
            <button class="filter-pill" [class.active]="selectedRoleFilter() === 'Admin'" (click)="selectedRoleFilter.set('Admin'); selectedStatusFilter.set('ALL')">
              Yöneticiler ({{ adminCount() }})
            </button>
            <button class="filter-pill" [class.active]="selectedRoleFilter() === 'Author'" (click)="selectedRoleFilter.set('Author'); selectedStatusFilter.set('ALL')">
               Yazarlar ({{ authorCount() }})
            </button>
            <button class="filter-pill" [class.active]="selectedRoleFilter() === 'User'" (click)="selectedRoleFilter.set('User'); selectedStatusFilter.set('ALL')">
              📖 Okurlar ({{ readerCount() }})
            </button>
            <button class="filter-pill" [class.active]="selectedStatusFilter() === 'BANNED'" (click)="selectedStatusFilter.set('BANNED'); selectedRoleFilter.set('ALL')">
               Yasaklı ({{ bannedCount() }})
            </button>
          </div>

          <div class="post-search-box" style="display:flex; gap:8px;">
            <input
              type="text"
              class="form-control form-control-sm"
              [(ngModel)]="searchQuery"
              (keyup.enter)="onSearch()"
              placeholder="Kullanıcı adı veya e-posta ara..."
              style="min-width: 240px;"
            />
            <button class="btn btn-primary btn-sm" (click)="onSearch()">Ara</button>
            @if (searchQuery()) {
              <button class="btn btn-secondary btn-sm" (click)="clearSearch()">✖</button>
            }
          </div>
        </div>

        <!-- Main Users Table / List -->
        @if (isLoading()) {
          <div class="loading-container">
            <div class="spinner-pulse"></div>
            <p>Kullanıcı verileri yükleniyor...</p>
          </div>
        } @else if (filteredUsers().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>Kriterlere Uygun Kullanıcı Bulunamadı</h3>
            <p>Arama filtrenizi temizleyerek tekrar deneyebilirsiniz.</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="users-table">
              <thead>
                <tr>
                  <th>Kullanıcı</th>
                  <th>Rol</th>
                  <th>E-Posta Onayı</th>
                  <th>Hesap Durumu</th>
                  <th>Kayıt Tarihi</th>
                  <th class="text-center" style="white-space: nowrap;">İçerikler</th>
                  <th class="text-center" style="white-space: nowrap;">Mesaj</th>
                  <th class="text-center" style="white-space: nowrap;">Yasaklama</th>
                </tr>
              </thead>
              <tbody>
                @for (u of filteredUsers(); track u.id) {
                  <tr [class.ban-row]="u.isBanned" [class.deactivated-row]="u.isDeactivated">
                    <td>
                      <div class="user-cell">
                        <div class="user-mini-avatar">
                          @if (u.profilePictureUrl) {
                            <img [src]="authService.getAvatarUrl(u.profilePictureUrl)" alt="avatar" />
                          } @else {
                            <span>{{ u.username.charAt(0).toUpperCase() }}</span>
                          }
                        </div>
                        <div class="user-text">
                          <span class="u-name">{{ u.username }}</span>
                          <span class="u-email">{{ u.email }}</span>
                          @if (u.university) {
                            <span class="u-univ"> {{ u.university }}</span>
                          }
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="'badge-' + u.role.toLowerCase()">
                        {{ u.role === 'Admin' ? 'Yönetici' : (u.role === 'Author' ? 'Yazar' : 'Okur') }}
                      </span>
                    </td>
                    <td>
                      @if (u.isEmailConfirmed) {
                        <i class="fa-solid fa-envelope text-success" title="E-Posta Onaylı" style="font-size: 1.2rem;"></i>
                      } @else {
                        <i class="fa-regular fa-envelope text-warning" title="E-Posta Onayı Bekliyor" style="font-size: 1.2rem;"></i>
                      }
                    </td>
                    <td>
                      @if (u.isBanned) {
                        <div class="ban-info-pill" [title]="u.banReason || 'Sebep belirtilmedi'">
                          <i class="fa-solid fa-ban text-danger" title="Hesap Yasaklı" style="font-size: 1.2rem;"></i>
                          <span class="ban-duration-text">
                            {{ u.bannedUntil ? (u.bannedUntil | date:'dd.MM.yy HH:mm') : 'Süresiz' }}
                          </span>
                        </div>
                      } @else if (u.isDeactivated) {
                        <i class="fa-regular fa-snowflake text-warning" title="Hesap Dondurulmuş" style="font-size: 1.2rem;"></i>
                      } @else {
                        <i class="fa-solid fa-circle-check text-success" title="Hesap Aktif" style="font-size: 1.2rem;"></i>
                      }
                    </td>
                    <td>
                      <span class="text-muted text-sm">{{ u.createdAt | date:'dd.MM.yyyy HH:mm' }}</span>
                    </td>
                    <td class="text-center">
                      <button
                        class="btn btn-neutral btn-xs"
                        (click)="viewUserPosts(u)"
                        title="Yazıları İncele"
                        style="padding: 4px 8px;"
                      >
                        <i class="fa-solid fa-file-lines" style="font-size: 1.1rem;"></i>
                      </button>
                    </td>

                    <td class="text-center">
                      <button
                        class="btn btn-neutral btn-xs"
                        (click)="openMessageModal(u)"
                        title="Özel Bildirim Gönder"
                        style="padding: 4px 8px;"
                      >
                        <i class="fa-regular fa-bell" style="font-size: 1.1rem;"></i>
                      </button>
                    </td>

                    <td class="text-center">
                      @if (u.role !== 'Admin') {
                        @if (u.isBanned) {
                          <button
                            class="btn btn-neutral btn-xs"
                            (click)="unbanUser(u)"
                            title="Yasağı Kaldır"
                            style="padding: 4px 8px;"
                          >
                            <i class="fa-solid fa-unlock" style="font-size: 1.1rem;"></i>
                          </button>
                        } @else {
                          <button
                            class="btn btn-neutral btn-xs"
                            (click)="openBanModal(u)"
                            title="Kullanıcıyı Yasakla"
                            style="padding: 4px 8px;"
                          >
                            <i class="fa-solid fa-ban" style="font-size: 1.1rem;"></i>
                          </button>
                        }
                      } @else {
                        <span class="text-muted" style="font-size: 0.85rem;" title="Yöneticiler banlanamaz">-</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          
          <!-- Pagination Controls -->
          @if (paginatedData(); as data) {
            <div class="pagination-controls" style="display: flex; justify-content: space-between; align-items: center; padding: 16px;">
              <div>
                Toplam <strong>{{ data.totalCount }}</strong> kayıt (Sayfa {{ data.currentPage }} / {{ data.totalPages }})
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary btn-sm" [disabled]="!data.hasPreviousPage" (click)="changePage(data.currentPage - 1)">Önceki</button>
                <button class="btn btn-secondary btn-sm" [disabled]="!data.hasNextPage" (click)="changePage(data.currentPage + 1)">Sonraki</button>
              </div>
            </div>
          }
        }
      </div> <!-- End table-card -->
    </div> <!-- Kapanış tag'i admin-main-card -->

      <!-- ============================================== -->
      <!-- MODAL 1: KULLANICININ YAZILARI & SİLME MODALI -->
      <!-- ============================================== -->
      @if (selectedUserForPosts()) {
        <div class="modal-backdrop" (click)="closePostsModal()">
          <div class="modal-card modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <span class="modal-icon"></span>
                <div>
                  <h3 class="modal-title">{{ selectedUserForPosts()?.username }} Kullanıcısının Yazıları</h3>
                  <p class="modal-subtitle">{{ selectedUserForPosts()?.email }} • Toplam {{ userPosts().length }} içerik</p>
                </div>
              </div>
              <button class="modal-close-btn" (click)="closePostsModal()"></button>
            </div>

            <div class="modal-body">
              @if (isLoadingPosts()) {
                <div class="loading-center">
                  <div class="spinner-pulse"></div>
                  <p>Yazılar getiriliyor...</p>
                </div>
              } @else if (userPosts().length === 0) {
                <div class="empty-state-modal">
                  <div class="empty-icon"></div>
                  <h4>Henüz Yayınlanmış veya Taslak Yazısı Yok</h4>
                  <p>Bu kullanıcı henüz herhangi bir blog veya köşe yazısı oluşturmamış.</p>
                </div>
              } @else {
                <div class="posts-list-modal">
                  @for (post of userPosts(); track post.id) {
                    <div class="post-item-modal card">
                      <div class="post-thumb">
                        @if (post.photoUrl) {
                          <img [src]="blogService.getPhotoUrl(post.photoUrl)" [alt]="post.title" />
                        } @else {
                          <div class="thumb-placeholder">{{ post.type === 'Koseyazisi' ? '' : '' }}</div>
                        }
                      </div>
                      <div class="post-details">
                        <div class="post-tags-row">
                          <span class="badge" [class.badge-primary]="post.type === 'Blog'" [class.badge-author]="post.type === 'Koseyazisi'">
                            {{ post.type === 'Koseyazisi' ? ' Köşe Yazısı' : ' Blog' }}
                          </span>
                          <span class="badge badge-success">
                            Yayında
                          </span>
                          <span class="post-date-tag">{{ post.createdAt | date:'dd.MM.yyyy HH:mm' }}</span>
                        </div>
                        <h4 class="post-title">{{ post.title }}</h4>
                        <p class="post-preview-text">{{ getExcerpt(post.content) }}</p>
                      </div>
                      <div class="post-admin-actions">
                        <a [routerLink]="['/post', post.id]" target="_blank" class="btn btn-secondary btn-xs" title="Yeni sekmede aç">
                           İncele
                        </a>
                        <button
                          class="btn btn-danger btn-xs"
                          (click)="openDeletePostModal(post)"
                          title="Yazıyı sebep belirterek yayından kaldır ve sil"
                        >
                           Kaldır & Sil
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closePostsModal()">Kapat</button>
            </div>
          </div>
        </div>
      }

      <!-- ============================================== -->
      <!-- MODAL 2: YAZI SİLME SEBEBİ & BİLDİRİM MODALI   -->
      <!-- ============================================== -->
      @if (selectedPostForDeletion()) {
        <div class="modal-backdrop" (click)="closeDeletePostModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header modal-header-danger">
              <div class="modal-title-wrap">
                <span class="modal-icon"></span>
                <div>
                  <h3 class="modal-title">Yazıyı Kaldır & Sil</h3>
                  <p class="modal-subtitle">"{{ selectedPostForDeletion()?.title }}"</p>
                </div>
              </div>
              <button class="modal-close-btn" (click)="closeDeletePostModal()"></button>
            </div>

            <form (ngSubmit)="confirmDeletePost()">
              <div class="modal-body">
                <div class="alert-box-warning">
                   Bu yazıyı sildiğinizde sistemden kalıcı olarak silinecek, yazara hem <strong>sistem içi bildirim</strong> hem de <strong>e-posta uyarısı</strong> otomatik gönderilecektir.
                </div>

                <div class="form-group">
                  <label class="form-label" for="del-reason">Silinme / Kaldırılma Sebebi (Zorunlu) *</label>
                  <textarea
                    id="del-reason"
                    class="form-control"
                    rows="4"
                    [(ngModel)]="deletePostReason"
                    name="deletePostReason"
                    placeholder="Örn: Topluluk kurallarına ve telif haklarına aykırı içerik tespit edilmiştir..."
                    required
                  ></textarea>
                </div>

                <div class="form-check">
                  <label class="check-container">
                    <input type="checkbox" [(ngModel)]="sendDeletePostEmail" name="sendDeletePostEmail" />
                    <span class="check-text">Kullanıcıya e-posta uyarısı gönder</span>
                  </label>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeDeletePostModal()" [disabled]="isDeletingPost()">
                  İptal
                </button>
                <button type="submit" class="btn btn-danger" [disabled]="isDeletingPost() || !deletePostReason.trim()">
                  @if (isDeletingPost()) {
                    <span>Siliniyor...</span>
                  } @else {
                    <span> Yazıyı Kaldır ve Bildir</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ============================================== -->
      <!-- MODAL 3: KULLANICI BANLAMA (SÜRELİ / SÜRESİZ)   -->
      <!-- ============================================== -->
      @if (selectedUserForBan()) {
        <div class="modal-backdrop" (click)="closeBanModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header modal-header-danger">
              <div class="modal-title-wrap">
                <span class="modal-icon"></span>
                <div>
                  <h3 class="modal-title">Kullanıcıyı Yasakla (Banla)</h3>
                  <p class="modal-subtitle">{{ selectedUserForBan()?.username }} ({{ selectedUserForBan()?.email }})</p>
                </div>
              </div>
              <button class="modal-close-btn" (click)="closeBanModal()"></button>
            </div>

            <form (ngSubmit)="confirmBanUser()">
              <div class="modal-body">
                <div class="alert-box-danger">
                   Yasaklanan kullanıcı hesabına giriş yaptığında ana sayfa veya diğer sayfaları göremez; yalnızca hesabının yasaklandığına dair gerekçeyi görür ve sadece hesabını silme hakkına sahip olur.
                </div>

                <div class="form-group">
                  <label class="form-label">Yasaklama Süresi</label>
                  <div class="duration-options">
                    <button
                      type="button"
                      class="dur-btn"
                      [class.active]="banDurationType() === 'PERMANENT'"
                      (click)="banDurationType.set('PERMANENT')"
                    >
                      ♾️ Süresiz (Kalıcı)
                    </button>
                    <button
                      type="button"
                      class="dur-btn"
                      [class.active]="banDurationType() === '1H'"
                      (click)="banDurationType.set('1H')"
                    >
                      ⏱️ 1 Saat
                    </button>
                    <button
                      type="button"
                      class="dur-btn"
                      [class.active]="banDurationType() === '1D'"
                      (click)="banDurationType.set('1D')"
                    >
                      📅 1 Gün
                    </button>
                    <button
                      type="button"
                      class="dur-btn"
                      [class.active]="banDurationType() === '7D'"
                      (click)="banDurationType.set('7D')"
                    >
                      📅 7 Gün
                    </button>
                    <button
                      type="button"
                      class="dur-btn"
                      [class.active]="banDurationType() === '30D'"
                      (click)="banDurationType.set('30D')"
                    >
                      🗓️ 30 Gün
                    </button>
                    <button
                      type="button"
                      class="dur-btn"
                      [class.active]="banDurationType() === 'CUSTOM'"
                      (click)="banDurationType.set('CUSTOM')"
                    >
                       Özel (Dakika)
                    </button>
                  </div>

                  @if (banDurationType() === 'CUSTOM') {
                    <div class="custom-duration-input mt-2">
                      <label class="form-label-sub">Süre (Dakika cinsinden):</label>
                      <input
                        type="number"
                        class="form-control"
                        [(ngModel)]="customBanMinutes"
                        name="customBanMinutes"
                        min="1"
                        placeholder="Örn: 120"
                      />
                    </div>
                  }
                </div>

                <div class="form-group">
                  <label class="form-label" for="ban-reason-input">Yasaklama Sebebi (Kullanıcıya sadece mail olarak iletilir) *</label>
                  <textarea
                    id="ban-reason-input"
                    class="form-control"
                    rows="4"
                    [(ngModel)]="banReason"
                    name="banReason"
                    placeholder="Örn: Platform kurallarına uygun olmayan davranışlar ve spam paylaşımlar nedeniyle..."
                    required
                  ></textarea>
                  @if (banReasonError()) {
                    <div class="mt-1" style="font-size: 13px; color: #ef4444 !important; font-weight: 600;">⚠️ Bu alan boş bırakılamaz. Lütfen bir sebep girin.</div>
                  }
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeBanModal()" [disabled]="isSubmittingBan()">
                  İptal
                </button>
                <button type="submit" class="btn btn-danger" [disabled]="isSubmittingBan()">
                  @if (isSubmittingBan()) {
                    <span>Yasaklanıyor...</span>
                  } @else {
                    <span> Kullanıcıyı Yasakla & E-Posta Gönder</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ============================================== -->
      <!-- MODAL 4: ÖZEL BİLDİRİM / MESAJ GÖNDERME         -->
      <!-- ============================================== -->
      @if (selectedUserForMessage()) {
        <div class="modal-backdrop" (click)="closeMessageModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <span class="modal-icon"></span>
                <div>
                  <h3 class="modal-title">Kullanıcıya Özel Bildirim Gönder</h3>
                  <p class="modal-subtitle">{{ selectedUserForMessage()?.username }} ({{ selectedUserForMessage()?.email }})</p>
                </div>
              </div>
              <button class="modal-close-btn" (click)="closeMessageModal()"></button>
            </div>

            <form (ngSubmit)="confirmSendMessage()">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Bildirim Türü</label>
                  <select class="form-control" [(ngModel)]="messageType" name="messageType">
                    <option value="Warning">Uyarı Bildirimi</option>
                    <option value="Info">Bilgilendirme</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for="msg-title">Başlık *</label>
                  <input
                    id="msg-title"
                    type="text"
                    class="form-control"
                    [(ngModel)]="messageTitle"
                    name="messageTitle"
                    placeholder="Örn: Profil Bilgileriniz Hakkında Uyarı"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="msg-body">Mesaj İçeriği *</label>
                  <textarea
                    id="msg-body"
                    class="form-control"
                    rows="4"
                    [(ngModel)]="messageBody"
                    name="messageBody"
                    placeholder="Kullanıcıya iletmek istediğiniz detaylı açıklama..."
                    required
                  ></textarea>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeMessageModal()" [disabled]="isSendingMessage()">
                  İptal
                </button>
                <button type="submit" class="btn btn-primary" [disabled]="isSendingMessage() || !messageTitle.trim() || !messageBody.trim()">
                  @if (isSendingMessage()) {
                    <span>Gönderiliyor...</span>
                  } @else {
                    <span> Bildirimi Gönder</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .users-management-page {
      padding-top: 24px;
      padding-bottom: 80px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
    }

    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      margin-bottom: 8px;
    }

    .crumb-link {
      color: #93c5fd;
      text-decoration: none;
      font-weight: 500;
    }

    .crumb-link:hover {
      text-decoration: underline;
    }

    .crumb-sep {
      color: #64748b;
    }

    .crumb-current {
      color: #94a3b8;
    }

    .page-title {
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 6px;
      letter-spacing: -0.5px;
    }

    :host-context(.light-theme) .page-title {
      color: #0f172a;
    }

    .page-subtitle {
      font-size: 14px;
      color: #94a3b8;
    }

    :host-context(.light-theme) .page-subtitle {
      color: #64748b;
    }

    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    /* Stats Ribbon */
    .stats-ribbon {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    
    @media (max-width: 992px) {
      .stats-ribbon {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 576px) {
      .stats-ribbon {
        grid-template-columns: 1fr;
      }
    }

    .stat-card {
      background: var(--bg-card);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-xl);
      border-radius: var(--radius-md);
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      font-size: 28px;
    }

    .stat-meta {
      display: flex;
      flex-direction: column;
    }

    .stat-val {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
    }

    :host-context(.light-theme) .stat-val {
      color: #0f172a;
    }

    .stat-lbl {
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-banned .stat-val {
      color: #f87171;
    }

    /* Empty & Loading */
    .loading-container, .empty-state {
      padding: 40px;
      text-align: center;
      background: rgba(255,255,255,0.02);
      border-radius: var(--radius-md);
      border: 1px dashed rgba(255,255,255,0.1);
    }

    /* Toolbar Card */
    .toolbar-card {
      background: transparent;
      border: none;
      box-shadow: none;
      padding: 0;
      margin-top: 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 20px;
    }

    :host-context(.light-theme) .toolbar-card {
      background: transparent;
      border: none;
    }

    .search-box {
      flex: 1;
      min-width: 260px;
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      color: #94a3b8;
      font-family: var(--font-body);
    }
    
    .admin-main-card {
      background: transparent;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .search-input {
      width: 100%;
      padding: 10px 36px 10px 38px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-full);
      color: #ffffff;
      font-size: 14px;
      transition: var(--transition);
    }

    :host-context(.light-theme) .search-input {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #0f172a;
    }

    .search-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
    }

    .clear-btn {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 12px;
    }

    .filter-pills {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .filter-label {
      font-size: 13px;
      font-weight: 700;
      color: #cbd5e1;
      margin-right: 4px;
    }

    :host-context(.light-theme) .filter-label {
      color: #475569;
    }

    .pill-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      padding: 6px 12px;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    :host-context(.light-theme) .pill-btn {
      background: #f1f5f9;
      border-color: #e2e8f0;
      color: #475569;
    }

    .pill-btn:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
    }

    .pill-btn.active {
      background: #2563eb;
      border-color: #3b82f6;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
    }

    .pill-danger.active {
      background: #dc2626;
      border-color: #ef4444;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
    }

    /* Table Styles */
    .table-card {
      background: var(--bg-card);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      padding: 24px;
    }

    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .users-table th {
      background: rgba(15, 23, 42, 0.8);
      color: #94a3b8;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    :host-context(.light-theme) .users-table th {
      background: #f8fafc;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }

    .users-table td {
      padding: 12px 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      vertical-align: middle;
      font-size: 14px;
    }

    :host-context(.light-theme) .users-table td {
      border-bottom: 1px solid #f1f5f9;
    }

    .users-table tr:last-child td {
      color: #94a3b8;
    }

    .deactivated-row {
      background-color: rgba(234, 179, 8, 0.08) !important;
    }

    .deactivated-row td {
      border-color: rgba(234, 179, 8, 0.2);
    }
    
    .ban-row {
      background-color: rgba(239, 68, 68, 0.08) !important;
    }

    .row-banned td {
      border-bottom-color: rgba(239, 68, 68, 0.1) !important;
    }

    .row-frozen {
      background-color: rgba(245, 158, 11, 0.05) !important;
    }

    .row-frozen td {
      border-bottom-color: rgba(245, 158, 11, 0.15) !important;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-mini-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e3a8a, #0f172a);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 15px;
      flex-shrink: 0;
      border: 1px solid rgba(245, 158, 11, 0.4);
      overflow: hidden;
    }

    .user-mini-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .user-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .u-name {
      font-weight: 700;
      color: #ffffff;
    }

    :host-context(.light-theme) .u-name {
      color: #0f172a;
    }

    .u-email {
      font-size: 12px;
      color: #94a3b8;
    }

    .u-univ {
      font-size: 11px;
      color: #60a5fa;
    }

    .ban-info-pill {
      display: inline-flex;
      flex-direction: row;
      align-items: center;
      gap: 6px;
      background: rgba(220, 38, 38, 0.1);
      padding: 4px 10px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(220, 38, 38, 0.2);
    }

    .ban-duration-text {
      font-size: 11px;
      color: #fca5a5;
      font-weight: 600;
      white-space: nowrap;
    }

    .badge-success-soft {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.3);
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 700;
    }

    .actions-cell {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
      flex-wrap: wrap;
    }

    .text-right {
      text-align: right;
    }

    .btn-xs {
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 6px;
    }

    .btn-neutral {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #cbd5e1;
      cursor: pointer;
      transition: var(--transition);
    }

    .btn-neutral:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }

    :host-context(.light-theme) .btn-neutral {
      background: rgba(0, 0, 0, 0.02);
      border: 1px solid rgba(0, 0, 0, 0.15);
      color: #475569;
    }

    :host-context(.light-theme) .btn-neutral:hover {
      background: rgba(0, 0, 0, 0.08);
      color: #0f172a;
    }

    .btn-outline-warning {
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fbbf24;
      cursor: pointer;
    }

    .btn-outline-warning:hover {
      background: rgba(245, 158, 11, 0.25);
      color: #ffffff;
    }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-card {
      background: #0d1b3e;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 580px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      animation: modalFadeIn 0.2s ease-out;
      overflow: hidden;
    }

    :host-context(.light-theme) .modal-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
    }

    .modal-lg {
      max-width: 820px;
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    :host-context(.light-theme) .modal-header {
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header-danger {
      border-bottom: 2px solid #ef4444;
      background: rgba(239, 68, 68, 0.08);
    }

    .modal-title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .modal-icon {
      font-size: 24px;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
    }

    :host-context(.light-theme) .modal-title {
      color: #0f172a;
    }

    .modal-subtitle {
      font-size: 12px;
      color: #94a3b8;
      margin: 2px 0 0 0;
    }

    .modal-close-btn {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 18px;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
    }

    .modal-close-btn:hover {
      color: #ffffff;
    }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
    }

    .form-label {
      font-size: 13px;
      font-weight: 700;
      color: #f1f5f9;
      display: block;
      margin-bottom: 4px;
    }

    :host-context(.light-theme) .form-label,
    :host-context([data-theme='light']) .form-label {
      color: #0f172a !important;
    }

    .form-label-sub {
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      display: block;
      margin-bottom: 4px;
    }

    :host-context(.light-theme) .form-label-sub,
    :host-context([data-theme='light']) .form-label-sub {
      color: #334155 !important;
    }

    .check-text {
      color: #f1f5f9;
      font-size: 13px;
      font-weight: 500;
    }

    :host-context(.light-theme) .check-text,
    :host-context([data-theme='light']) .check-text {
      color: #0f172a !important;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
    }

    :host-context(.light-theme) .modal-footer {
      border-top: 1px solid #e2e8f0;
    }

    .alert-box-warning {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fef3c7;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 13px;
      line-height: 1.5;
    }

    :host-context(.light-theme) .alert-box-warning {
      color: #92400e;
    }

    .alert-box-danger {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fee2e2;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 13px;
      line-height: 1.5;
    }

    :host-context(.light-theme) .alert-box-danger {
      color: #991b1b;
    }

    /* Filter Bar Styles (borrowed from profile.component.ts) */
    .posts-filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .pills-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .filter-pill {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      padding: 6px 12px;
      border-radius: var(--radius-full);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    .filter-pill:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }

    .filter-pill.active {
      background: #2563eb;
      border-color: #3b82f6;
      color: #ffffff;
    }

    :host-context(.light-theme) .filter-pill {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #475569;
    }

    :host-context(.light-theme) .filter-pill:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    :host-context(.light-theme) .filter-pill.active {
      background: #2563eb;
      border-color: #3b82f6;
      color: #ffffff;
    }

    .duration-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
      margin-top: 6px;
    }

    .dur-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      padding: 8px;
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    :host-context(.light-theme) .dur-btn {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #475569;
    }

    .dur-btn.active {
      background: #dc2626;
      border-color: #ef4444;
      color: #ffffff;
      box-shadow: 0 0 12px rgba(220, 38, 38, 0.4);
    }

    .posts-list-modal {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .post-item-modal {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 16px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-md);
    }

    :host-context(.light-theme) .post-item-modal {
      background: #f8fafc;
      border-color: #e2e8f0;
    }

    .post-thumb {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      background: #1e293b;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .post-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumb-placeholder {
      font-size: 24px;
    }

    .post-details {
      flex: 1;
      min-width: 0;
    }

    .post-tags-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
      flex-wrap: wrap;
    }

    .post-date-tag {
      font-size: 11px;
      color: #94a3b8;
    }

    .post-title {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 4px 0;
    }

    :host-context(.light-theme) .post-title {
      color: #0f172a;
    }

    .post-preview-text {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .post-admin-actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex-shrink: 0;
    }

    .empty-state-modal {
      text-align: center;
      padding: 40px 20px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .loading-center, .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      gap: 16px;
      color: #94a3b8;
    }

    .spinner-pulse {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #3b82f6;
      animation: pulse 1.2s infinite ease-in-out;
    }

    @keyframes pulse {
      0% { transform: scale(0.8); opacity: 0.5; }
      50% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(0.8); opacity: 0.5; }
    }

    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class UsersManagementComponent implements OnInit {
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
  }

  openDeletePostModal(post: BlogPost) {
    this.selectedPostForDeletion.set(post);
    this.deletePostReason = '';
    this.sendDeletePostEmail = true;
  }

  closeDeletePostModal() {
    this.selectedPostForDeletion.set(null);
    this.deletePostReason = '';
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
  }

  closeBanModal() {
    this.selectedUserForBan.set(null);
    this.banReason = '';
    this.banReasonError.set(false);
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
  }

  closeMessageModal() {
    this.selectedUserForMessage.set(null);
    this.messageTitle = '';
    this.messageBody = '';
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

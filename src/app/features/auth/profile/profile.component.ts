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
  template: `
    <div class="container profile-page">
      <div class="profile-container">
        
        <!-- ==================================================== -->
        <!-- DURUM 1: BANLANMIŞ (YASAKLANMIŞ) HESAP EKRANI       -->
        <!-- ==================================================== -->
        @if (authService.isBanned()) {
          <div class="banned-screen-card card">
            <div class="banned-header">
              <div class="banned-icon-wrap"></div>
              <div class="banned-title-wrap">
                <h1 class="banned-title">Hesabınız Askıya Alındı (Yasaklandı)</h1>
                <p class="banned-subtitle">
                  Sayın <strong>{{ authService.currentUser()?.username }}</strong>, hesabınız yönetici tarafından kısıtlanmıştır.
                </p>
              </div>
            </div>

            <div class="banned-body">
              <div class="banned-reason-box">
                <span class="reason-label">Yasaklanma Gerekçesi:</span>
                <p class="reason-text">{{ authService.currentUser()?.banReason || 'Yönetici tarafından platform kuralları gereği askıya alınmıştır.' }}</p>
              </div>

              <div class="banned-meta-grid">
                <div class="banned-meta-item">
                  <span class="meta-lbl">Yasaklama Türü</span>
                  <span class="meta-val font-bold text-danger">
                    {{ authService.currentUser()?.bannedUntil ? 'Süreli Yasaklama' : 'Süresiz (Kalıcı) Yasaklama' }}
                  </span>
                </div>
                @if (authService.currentUser()?.bannedUntil) {
                  <div class="banned-meta-item">
                    <span class="meta-lbl">Yasağın Bitiş Tarihi</span>
                    <span class="meta-val font-bold text-warning">
                      {{ authService.currentUser()?.bannedUntil | date:'d MMMM y, HH:mm' }}
                    </span>
                  </div>
                }
                <div class="banned-meta-item">
                  <span class="meta-lbl">E-Posta Adresiniz</span>
                  <span class="meta-val">{{ authService.currentUser()?.email }}</span>
                </div>
              </div>

              <div class="banned-info-notice">
                ℹ️ Hesabınız yasaklı olduğu süre boyunca içerik üretemez, yorum yapamaz veya platformdaki diğer sayfalara erişemezsiniz. Dilerseniz hesabınızı kalıcı olarak sistemden silebilirsiniz.
              </div>
            </div>

            <!-- Banned User Allowed Actions: Delete Account or Logout -->
            <div class="banned-footer">
              <button class="btn btn-secondary" (click)="logout()">
                <span>🚪</span> Güvenli Çıkış Yap
              </button>
              <button class="btn btn-danger" (click)="openAccountDeletionModal()">
                <span></span> Hesabımı Kalıcı Olarak Sil
              </button>
            </div>
          </div>
        } @else {
          <!-- ==================================================== -->
          <!-- DURUM 2: AKTİF HESAP EKRANI (STANDART PROFİL)        -->
          <!-- ==================================================== -->

          <!-- Profile Top Hero Banner -->
          <div class="profile-header card">
            <!-- Avatar Section with Upload Overlay -->
            <div class="avatar-upload-wrapper">
              <div class="profile-avatar-large" (click)="fileInput.click()" title="Profil resmini değiştirmek için tıklayın">
                @if (authService.currentUser()?.profilePictureUrl) {
                  <img 
                    [src]="authService.getAvatarUrl(authService.currentUser()?.profilePictureUrl)" 
                    alt="Profil Resmi" 
                    class="avatar-img-element"
                  />
                } @else {
                  <span>{{ authService.currentUser()?.username?.charAt(0)?.toUpperCase() || 'U' }}</span>
                }
                <div class="avatar-overlay">
                  @if (isUploadingAvatar()) {
                    <span class="spinner-small"></span>
                  } @else {
                    <span>📷</span>
                  }
                </div>
              </div>
              <input 
                #fileInput 
                type="file" 
                (change)="onFileSelected($event)" 
                accept="image/png, image/jpeg, image/jpg, image/webp, image/gif" 
                style="display: none;" 
              />
              <div class="avatar-quick-actions">
                <button type="button" class="btn-link-action" (click)="fileInput.click()" [disabled]="isUploadingAvatar()">
                  📷 Fotoğraf Seç
                </button>
                @if (authService.currentUser()?.profilePictureUrl) {
                  <span class="action-sep">•</span>
                  <button type="button" class="btn-link-action text-danger" (click)="removeAvatar()" [disabled]="isUploadingAvatar()">
                     Kaldır
                  </button>
                }
              </div>
            </div>

            <div class="profile-main-info">
              <div class="profile-title-row">
                <h1 class="profile-name">{{ authService.currentUser()?.username }}</h1>
                <span class="badge" [ngClass]="'badge-' + (authService.userRole()?.toLowerCase() || 'user')">
                  {{ authService.roleDisplayName() }}
                </span>
                @if (authService.currentUser()?.isEmailConfirmed) {
                  <span class="badge badge-success">✓ E-Posta Onaylı</span>
                } @else {
                  <span class="badge badge-warning"> E-Posta Onay Bekliyor</span>
                }
              </div>
              <p class="profile-email">{{ authService.currentUser()?.email }}</p>
              <p class="profile-meta">
                Kayıt Tarihi: {{ authService.currentUser()?.createdAt | date:'d MMMM y, HH:mm' }}
              </p>
            </div>
            <div class="profile-actions">
              <button class="btn btn-danger btn-sm" (click)="logout()">
                <span>🚪</span> Çıkış Yap
              </button>
            </div>
          </div>

          <!-- E-Posta Doğrulanmamışsa Uyarı Kutusu -->
          @if (!authService.currentUser()?.isEmailConfirmed) {
            <div class="alert-card warning-alert-card card">
              <div class="alert-icon-large"></div>
              <div class="alert-details">
                <h3>E-Posta Adresiniz Doğrulanmamış</h3>
                <p>
                  Hesabınızın tüm özelliklerini kullanabilmek ve güvenliğinizi sağlamak için lütfen e-posta adresinize gönderilen bağlantıya tıklayarak onaylayınız.
                </p>
                <div class="alert-btn-group">
                  <button
                    type="button"
                    class="btn btn-warning btn-sm"
                    (click)="resendCode()"
                    [disabled]="isResending()"
                  >
                    @if (isResending()) {
                      <span>Gönderiliyor...</span>
                    } @else {
                      <span> Doğrulama Bağlantısını Tekrar Gönder</span>
                    }
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- PROFILE NAVIGATION TABS -->
          <div class="profile-nav-tabs">
            <button
              class="tab-btn"
              [class.active]="activeTab() === 'PROFILE'"
              (click)="activeTab.set('PROFILE')"
            >
              Profil & Güvenlik
            </button>

            @if (authService.isAuthor() || authService.isAdmin()) {
              <button
                class="tab-btn"
                [class.active]="activeTab() === 'POSTS'"
                (click)="switchTab('POSTS')"
              >
                Yazılarım & Köşe Yazılarım
                @if (myPosts().length > 0) {
                  <span class="tab-badge">{{ myPosts().length }}</span>
                }
              </button>
            }

            <button
              class="tab-btn"
              [class.active]="activeTab() === 'NOTIFICATIONS'"
              (click)="switchTab('NOTIFICATIONS')"
            >
              Bildirimlerim
              @if (unreadNotificationCount() > 0) {
                <span class="tab-badge badge-unread">{{ unreadNotificationCount() }}</span>
              }
            </button>

            @if (authService.isAdmin()) {
              <button class="tab-btn"
                [class.active]="activeTab() === 'ADMIN_USERS'"
                (click)="activeTab.set('ADMIN_USERS')">
                Kullanıcı Yönetimi
              </button>

              <button class="tab-btn"
                [class.active]="activeTab() === 'ADMIN_AUTHORS'"
                (click)="activeTab.set('ADMIN_AUTHORS')">
                Yazar Onayları
              </button>
            }

            <button
              class="tab-btn"
              [class.active]="activeTab() === 'SUPPORT'"
              (click)="activeTab.set('SUPPORT')"
            >
              Destek & Şikayet
            </button>

            <button
              class="tab-btn tab-btn-warning"
              [class.active]="activeTab() === 'FREEZE'"
              (click)="activeTab.set('FREEZE')"
            >
              Hesap Dondurma
            </button>

            <button
              class="tab-btn tab-btn-danger"
              [class.active]="activeTab() === 'DELETE'"
              (click)="activeTab.set('DELETE')"
            >
              Hesabı Kalıcı Sil
            </button>
          </div>

          <!-- ==================================================== -->
          <!-- TAB 1: PROFİL & GÜVENLİK BİLGİLERİ                   -->
          <!-- ==================================================== -->
          @if (activeTab() === 'PROFILE') {
            <!-- Yazar Bilgileri Kartı (Eğer Rol Yazar İse) -->
            @if (authService.isAuthor()) {
              <div class="card author-details-card">
                <div class="card-header-flex">
                  <div>
                    <h2 class="card-section-title"> Yazar ve Akademik Bilgiler</h2>
                    <p class="card-section-desc">Onaylanmış yazar profilinizin detayları</p>
                  </div>
                </div>
                <div class="info-list">
                  <div class="info-item">
                    <span class="info-label">Mezun Olunan Üniversite / Bölüm</span>
                    <span class="info-value">{{ authService.currentUser()?.university || 'Belirtilmemiş' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Özgeçmiş / CV Belgesi</span>
                    <span class="info-value">
                      @if (authService.currentUser()?.cvUrl) {
                        <a [href]="authService.getCvUrl(authService.currentUser()?.cvUrl)" target="_blank" class="cv-link">
                           Yüklenen CV Dosyasını Görüntüle
                        </a>
                      } @else {
                        <span class="text-muted">CV dosyası bulunmuyor</span>
                      }
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Yazar Başvuru Tarihi</span>
                    <span class="info-value">
                      {{ authService.currentUser()?.authorApplicationDate ? (authService.currentUser()?.authorApplicationDate | date:'d MMMM y, HH:mm') : '—' }}
                    </span>
                  </div>
                </div>
              </div>
            }

            <!-- Yazar Başvurusu Kartı (Eğer Rol User İse) -->
            @if (authService.userRole() === 'User') {
              <div class="card author-details-card mb-4">
                <div class="card-header-flex">
                  <div>
                    <h2 class="card-section-title"> Yazar Olmak İçin Başvurun</h2>
                    <p class="card-section-desc">Lumina platformunda içerik üretmek ve yazar olmak için bilgilerinizi gönderin.</p>
                  </div>
                </div>
                
                @if (authService.currentUser()?.authorApprovalStatus === 'Pending') {
                  <div class="alert-card warning-alert-card mt-3">
                    <div class="alert-details">
                      <h4>Başvurunuz Değerlendirmede</h4>
                      <p>Yazar başvurunuz başarıyla alınmış olup sistem yöneticilerimiz tarafından incelenmektedir. Sonuçlandığında e-posta ve bildirim ile bilgilendirileceksiniz.</p>
                      <p class="mt-2 text-muted" style="font-size:12px;">Başvuru Tarihi: {{ authService.currentUser()?.authorApplicationDate | date:'d MMMM y, HH:mm' }}</p>
                    </div>
                  </div>
                } @else {
                  @if (!showAuthorForm()) {
                    <div class="mt-3 text-center p-3" style="background: rgba(255,255,255,0.05); border-radius: 8px;">
                      <p class="mb-3">Yazar olmak ister misiniz? Profilinize yazar özellikleri eklemek için başvuru yapabilirsiniz.</p>
                      <button type="button" class="btn btn-primary" (click)="showAuthorForm.set(true)">
                        <span>📝</span> Başvuru Formunu Aç
                      </button>
                    </div>
                  } @else {
                    <form (ngSubmit)="onApplyAuthorSubmit()" class="mt-3">
                      <div class="form-group mb-3">
                      <label class="form-label" for="author-university">Mezun Olduğunuz Üniversite / Bölüm <span class="required-star">*</span></label>
                      <input
                        id="author-university"
                        type="text"
                        class="form-control"
                        [(ngModel)]="authorApplyUniversity"
                        name="authorApplyUniversity"
                        placeholder="Örn: Hacettepe Üniversitesi - Bilgisayar Mühendisliği"
                        required
                      />
                    </div>
                    
                    <div class="form-group mb-3">
                      <label class="form-label">Özgeçmiş / CV Dosyası (PDF) <span class="required-star">*</span></label>
                      <div class="file-dropzone" [class.file-selected]="!!authorApplyCvFile">
                        <input
                          type="file"
                          id="author-cv-input"
                          class="file-input-hidden"
                          accept=".pdf"
                          (change)="onAuthorApplyCvSelected($event)"
                        />
                        <label for="author-cv-input" class="file-dropzone-label">
                          @if (authorApplyCvFile) {
                            <div class="file-info-badge">
                              <span class="file-icon">📄</span>
                              <div class="file-text">
                                <span class="file-name">{{ authorApplyCvFile.name }}</span>
                                <span class="file-size">({{ getFormattedFileSize(authorApplyCvFile.size) }})</span>
                              </div>
                              <button type="button" class="btn-remove-file" (click)="removeAuthorApplyCv($event)">✖</button>
                            </div>
                          } @else {
                            <span class="upload-icon">📤</span>
                            <span class="upload-title">CV Dosyanızı Buraya Yükleyin</span>
                            <span class="upload-hint">Yalnızca PDF formatı (Maksimum 10 MB)</span>
                          }
                        </label>
                      </div>
                    </div>
                    
                    <div class="d-flex justify-content-end" style="gap: 12px;">
                      <button type="button" class="btn btn-secondary" (click)="showAuthorForm.set(false)">İptal</button>
                      <button 
                        type="submit" 
                        class="btn btn-primary" 
                        [disabled]="isApplyingAuthor() || !authorApplyUniversity || !authorApplyCvFile"
                      >
                        @if (isApplyingAuthor()) {
                          <span><i class="fa fa-spinner fa-spin" style="margin-right:8px;"></i> Gönderiliyor...</span>
                        } @else {
                          <span> Yazar Başvurusunu Gönder</span>
                        }
                      </button>
                    </div>
                  </form>
                }
                }
              </div>
            }

            <!-- Profil Bilgileri & Düzenleme Kartı -->
            <div class="card profile-info-card">
              <div class="card-header-flex">
                <div>
                  <h2 class="card-section-title"> Profil Bilgileri</h2>
                  <p class="card-section-desc">Kullanıcı adı ve e-posta adresinizi buradan güncelleyebilirsiniz.</p>
                </div>
                @if (!isEditing()) {
                  <button class="btn btn-primary btn-sm" (click)="startEditing()">
                    <span></span> Profili Düzenle
                  </button>
                }
              </div>

              @if (!isEditing()) {
                <div class="info-list">
                  <div class="info-item">
                    <span class="info-label">Kullanıcı Adı</span>
                    <span class="info-value font-bold">{{ authService.currentUser()?.username }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">E-Posta Adresi</span>
                    <span class="info-value">{{ authService.currentUser()?.email }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Hesap Rolü</span>
                    <span class="info-value">
                      <span class="badge" [ngClass]="'badge-' + (authService.userRole()?.toLowerCase() || 'user')">
                        {{ authService.roleDisplayName() }}
                      </span>
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">E-Posta Durumu</span>
                    <span class="info-value">
                      @if (authService.currentUser()?.isEmailConfirmed) {
                        <span class="text-success font-bold">✓ Doğrulanmış</span>
                      } @else {
                        <span class="text-warning font-bold"> Doğrulama Bekliyor</span>
                      }
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Üyelik Tarihi</span>
                    <span class="info-value">{{ authService.currentUser()?.createdAt | date:'d MMMM y, HH:mm' }}</span>
                  </div>
                </div>
              } @else {
                <form (ngSubmit)="saveProfile()" class="edit-form">
                  <div class="form-group">
                    <label class="form-label" for="edit-username">Kullanıcı Adı</label>
                    <input
                      id="edit-username"
                      type="text"
                      class="form-control"
                      [(ngModel)]="editUsername"
                      name="editUsername"
                      placeholder="Yeni kullanıcı adınız"
                      required
                    />
                    <div class="form-hint">3-50 karakter arası geçerli bir kullanıcı adı giriniz.</div>
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="edit-email">E-Posta Adresi</label>
                    <input
                      id="edit-email"
                      type="email"
                      class="form-control"
                      [(ngModel)]="editEmail"
                      name="editEmail"
                      placeholder="Yeni e-posta adresiniz"
                      required
                    />
                    <div class="form-hint alert-hint"> Dikkat: E-posta adresinizi değiştirirseniz güvenlik nedeniyle oturumunuz kapatılacak ve yeni adresinize onay bağlantısı gönderilecektir.</div>
                  </div>

                  @if (errorMessage()) {
                    <div class="error-alert">
                      <span></span>
                      <span>{{ errorMessage() }}</span>
                    </div>
                  }

                  <div class="edit-actions">
                    <button
                      type="submit"
                      class="btn btn-primary"
                      [disabled]="isSaving()"
                    >
                      @if (isSaving()) {
                        <span>Kaydediliyor...</span>
                      } @else {
                        <span>💾 Değişiklikleri Kaydet</span>
                      }
                    </button>
                    <button
                      type="button"
                      class="btn btn-secondary"
                      (click)="cancelEditing()"
                      [disabled]="isSaving()"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              }
            </div>

            <!-- Şifre Değiştirme Kartı -->
            <div class="card password-change-card">
              <div class="card-header-flex">
                <div>
                  <h2 class="card-section-title"> Şifre Değiştir</h2>
                  <p class="card-section-desc">Hesabınızın güvenliği için mevcut şifrenizi güncelleyin.</p>
                </div>
                @if (!isChangingPassword()) {
                  <button class="btn btn-secondary btn-sm" (click)="isChangingPassword.set(true)">
                    <span>🔑</span> Şifremi Değiştir
                  </button>
                }
              </div>

              @if (isChangingPassword()) {
                <form (ngSubmit)="changePassword()" class="password-form">
                  <div class="form-group">
                    <label class="form-label" for="current-pwd">Mevcut Şifre</label>
                    <input
                      id="current-pwd"
                      type="password"
                      class="form-control"
                      [(ngModel)]="currentPassword"
                      name="currentPassword"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="new-pwd">Yeni Şifre</label>
                    <input
                      id="new-pwd"
                      type="password"
                      class="form-control"
                      [(ngModel)]="newPassword"
                      name="newPassword"
                      (ngModelChange)="onNewPasswordChange($event)"
                      placeholder="En az 8 karakter güçlü şifre"
                      required
                    />

                    @if (currentPassword && newPassword && currentPassword === newPassword) {
                      <div class="form-hint text-danger mt-1"> Yeni şifre eski şifrenizle aynı olamaz.</div>
                    }

                    @if (newPassword) {
                      <ul class="password-rules">
                        <li [class.rule-pass]="rules().hasMinLength">
                          <span>{{ rules().hasMinLength ? '✓' : '○' }}</span> En az 8 karakter
                        </li>
                        <li [class.rule-pass]="rules().hasUpperCase">
                          <span>{{ rules().hasUpperCase ? '✓' : '○' }}</span> En az 1 büyük harf (A-Z)
                        </li>
                        <li [class.rule-pass]="rules().hasLowerCase">
                          <span>{{ rules().hasLowerCase ? '✓' : '○' }}</span> En az 1 küçük harf (a-z)
                        </li>
                        <li [class.rule-pass]="rules().hasDigit">
                          <span>{{ rules().hasDigit ? '✓' : '○' }}</span> En az 1 rakam (0-9)
                        </li>
                        <li [class.rule-pass]="rules().hasSpecial">
                          <span>{{ rules().hasSpecial ? '✓' : '○' }}</span> En az 1 özel karakter (!&#64;#$%^&*)
                        </li>
                      </ul>
                    }
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="confirm-new-pwd">Yeni Şifre (Tekrar)</label>
                    <input
                      id="confirm-new-pwd"
                      type="password"
                      class="form-control"
                      [(ngModel)]="confirmNewPassword"
                      name="confirmNewPassword"
                      placeholder="••••••••"
                      required
                    />
                    @if (confirmNewPassword && newPassword !== confirmNewPassword) {
                      <div class="form-hint text-danger">Şifreler eşleşmiyor.</div>
                    }
                  </div>

                  @if (passwordError()) {
                    <div class="error-alert">
                      <span></span>
                      <span>{{ passwordError() }}</span>
                    </div>
                  }

                  <div class="edit-actions">
                    <button
                      type="submit"
                      class="btn btn-primary"
                      [disabled]="isSavingPassword() || !isNewPasswordValid() || newPassword !== confirmNewPassword || currentPassword === newPassword"
                    >
                      @if (isSavingPassword()) {
                        <span>Güncelleniyor...</span>
                      } @else {
                        <span>🔑 Şifreyi Güncelle</span>
                      }
                    </button>
                    <button
                      type="button"
                      class="btn btn-secondary"
                      (click)="cancelPasswordChange()"
                      [disabled]="isSavingPassword()"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              }
            </div>
          }

          <!-- ==================================================== -->
          <!-- TAB 2: YAZAR YAZILARI & KÖŞE YAZILARI YÖNETİMİ       -->
          <!-- ==================================================== -->
          @if (activeTab() === 'POSTS') {
            <div class="card posts-management-card">
              <div class="card-header-flex">
                <div>
                  <h2 class="card-section-title"> Yayınlarım & Yazılarım</h2>
                  <p class="card-section-desc">Yayınladığınız blogları ve köşe yazılarını buradan yönetebilir veya düzenleyebilirsiniz.</p>
                </div>
                <a routerLink="/create-post" class="btn btn-primary btn-sm">
                  Yeni Yazı Ekle
                </a>
              </div>

              <!-- Filter Toolbar -->
              <div class="posts-filter-bar">
                <div class="pills-row">
                  <button
                    class="filter-pill"
                    [class.active]="postTypeFilter() === 'ALL'"
                    (click)="postTypeFilter.set('ALL')"
                  >
                    Tümü ({{ myPosts().length }})
                  </button>
                  <button
                    class="filter-pill"
                    [class.active]="postTypeFilter() === 'Draft'"
                    (click)="postTypeFilter.set('Draft')"
                  >
                     Taslaklar
                  </button>
                </div>

                <div class="post-search-box">
                  <input
                    type="text"
                    class="form-control form-control-sm"
                    [(ngModel)]="postSearchQuery"
                    placeholder="Yazılarımda ara..."
                  />
                </div>
              </div>

              <!-- Posts List -->
              @if (isLoadingMyPosts()) {
                <div class="loading-state">
                  <div class="spinner-pulse"></div>
                  <p>Yazılarınız yükleniyor...</p>
                </div>
              } @else if (filteredMyPosts().length === 0) {
                <div class="empty-state-card">
                  <div class="empty-icon"></div>
                  <h3>Henüz Bu Kriterde Yazı Bulunmuyor</h3>
                  <p>Yeni bir blog veya köşe yazısı oluşturarak düşüncelerinizi okurlarınızla paylaşmaya başlayabilirsiniz.</p>
                  <a routerLink="/create-post" class="btn btn-primary btn-sm mt-3">
                    İlk Yazınızı Yazın
                  </a>
                </div>
              } @else {
                <div class="my-posts-grid">
                  @for (post of filteredMyPosts(); track post.id) {
                    <div class="my-post-card card">
                      <div class="my-post-thumb">
                        @if (post.photoUrl) {
                          <img [src]="blogService.getPhotoUrl(post.photoUrl)" [alt]="post.title" />
                        } @else {
                          <div class="thumb-empty">{{ post.type === 'Koseyazisi' ? '' : '' }}</div>
                        }
                      </div>

                      <div class="my-post-content">
                        <div class="my-post-badges">
                          <span class="badge" [class.badge-primary]="post.type === 'Blog'" [class.badge-author]="post.type === 'Koseyazisi'">
                            {{ post.type === 'Koseyazisi' ? ' Köşe Yazısı' : ' Blog' }}
                          </span>
                          <span class="badge" [class.badge-success]="post.status === 'Published'" [class.badge-warning]="post.status === 'Draft'">
                            {{ post.status === 'Published' ? 'Yayında' : 'Taslak' }}
                          </span>
                          <span class="post-date">{{ post.createdAt | date:'d MMM y, HH:mm' }}</span>
                        </div>

                        <h3 class="my-post-title">{{ post.title }}</h3>
                        <p class="my-post-snippet">{{ getSnippet(post.content) }}</p>

                      </div>

                      <div class="my-post-actions">
                        <a [routerLink]="['/post', post.id]" class="btn-action-icon" title="Yazıyı Oku">
                           <i class="fa-solid fa-eye" style="color: #2563eb;"></i>
                        </a>
                        <button class="btn-action-icon" (click)="openEditPostModal(post)" title="Yazıyı Düzenle">
                           <i class="fa-solid fa-pen" style="color: #f59e0b;"></i>
                        </button>
                        <button class="btn-action-icon" (click)="deletePost(post)" title="Yazıyı Sil">
                           <i class="fa-solid fa-trash" style="color: #ef4444;"></i>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- ==================================================== -->
          <!-- TAB 3: BİLDİRİMLERİM                                 -->
          <!-- ==================================================== -->
          @if (activeTab() === 'NOTIFICATIONS') {
            <div class="card notifications-card">
              <div class="card-header-flex">
                <div>
                  <h2 class="card-section-title"> Bildirimler & Uyarılar</h2>
                  <p class="card-section-desc">Yönetimden gelen uyarılar, yazı durumu bildirimleri ve önemli güncellemeler.</p>
                </div>
                <button class="btn btn-secondary btn-sm" (click)="loadNotifications()" [disabled]="isLoadingNotifications()">
                   Yenile
                </button>
              </div>

              @if (isLoadingNotifications()) {
                <div class="loading-state">
                  <div class="spinner-pulse"></div>
                  <p>Bildirimler getiriliyor...</p>
                </div>
              } @else if (notifications().length === 0) {
                <div class="empty-state-card">
                  <div class="empty-icon"></div>
                  <h3>Her Şey Yolunda!</h3>
                  <p>Henüz gelen herhangi bir bildirim veya uyarınız bulunmuyor.</p>
                </div>
              } @else {
                <div class="notifications-list">
                  @for (notif of paginatedNotifications(); track notif.id) {
                    <div class="notif-item card" [class.notif-unread]="!notif.isRead" (click)="toggleNotification(notif)" style="cursor: pointer;">
                      <div class="notif-icon">
                        @if (notif.type === 'Warning') {
                          
                        } @else if (notif.type === 'PostDeleted') {
                          
                        } @else if (notif.type === 'AccountBanned') {
                          
                        } @else {
                          ℹ️
                        }
                      </div>

                      <div class="notif-content">
                        <div class="notif-header-row">
                          <h4 class="notif-title">{{ notif.title }}</h4>
                          <span class="notif-time">{{ notif.createdAt | date:'d MMMM y, HH:mm' }}</span>
                        </div>
                        <p class="notif-msg" [class.expanded]="notif.isExpanded">{{ notif.message }}</p>
                      </div>

                      @if (!notif.isRead) {
                        <div class="notif-indicator"></div>
                      }
                    </div>
                  }
                  
                  @if (notifications().length > 10) {
                    <div class="nd-pagination" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                      <button class="btn btn-sm btn-secondary" [disabled]="currentNotifPage() === 1" (click)="currentNotifPage.set(currentNotifPage() - 1)">Önceki</button>
                      <span style="font-size: 14px;">Sayfa {{ currentNotifPage() }} / {{ Math.ceil(notifications().length / 10) }}</span>
                      <button class="btn btn-sm btn-secondary" [disabled]="currentNotifPage() >= Math.ceil(notifications().length / 10)" (click)="currentNotifPage.set(currentNotifPage() + 1)">Sonraki</button>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- ==================================================== -->
          <!-- TAB: ADMIN USERS -->
          <!-- ==================================================== -->
          @if (activeTab() === 'ADMIN_USERS' && authService.isAdmin()) {
            <div class="content-section fade-in">

              <div class="admin-tab-container">
                <app-users-management></app-users-management>
              </div>
            </div>
          }

          <!-- ==================================================== -->
          <!-- TAB: ADMIN AUTHORS -->
          <!-- ==================================================== -->
          @if (activeTab() === 'ADMIN_AUTHORS' && authService.isAdmin()) {
            <div class="content-section fade-in">

              <div class="admin-tab-container">
                <app-author-approvals></app-author-approvals>
              </div>
            </div>
          }

          <!-- ==================================================== -->
          <!-- TAB 4: DESTEK & ŞİKAYET BİLDİRİMİ                    -->
          <!-- ==================================================== -->
          @if (activeTab() === 'SUPPORT') {
            <div class="card mb-4">
              <div class="card-header-flex">
                <div>
                  <h2 class="card-section-title"> İstek ve Şikayet Bildirimi</h2>
                  <p class="card-section-desc">Sistem yöneticilerine istek, öneri veya şikayetlerinizi iletebilirsiniz.</p>
                </div>
              </div>
              <form (ngSubmit)="submitSupportRequest()" class="mt-3">
                <div class="form-group mb-3">
                  <label class="form-label">Bildirim Türü</label>
                  <select class="form-control" [(ngModel)]="supportRequestType" name="supportRequestType" required>
                    <option value="Istek">İstek / Öneri</option>
                    <option value="Sikayet">Şikayet</option>
                  </select>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label">Mesajınız (En az 10 karakter) *</label>
                  <textarea
                    class="form-control"
                    rows="4"
                    [(ngModel)]="supportRequestMessage"
                    name="supportRequestMessage"
                    placeholder="Mesajınızı buraya yazınız..."
                    required
                  ></textarea>
                </div>
                <div class="d-flex justify-content-end">
                  <button type="submit" class="btn btn-primary" [disabled]="isSubmittingSupport() || supportRequestMessage.length < 10">
                    @if (isSubmittingSupport()) {
                      <span>Gönderiliyor...</span>
                    } @else {
                      <span> Gönder</span>
                    }
                  </button>
                </div>
              </form>
            </div>
          }

          <!-- ==================================================== -->
          <!-- TAB 5: HESAP DONDURMA                                -->
          <!-- ==================================================== -->
          @if (activeTab() === 'FREEZE') {
            <div class="danger-zone-card mb-4 card">
              <div class="card-header-flex">
                <div>
                  <h2 class="card-section-title text-warning"> Hesap Dondurma</h2>
                  <p class="card-section-desc">Geçici olarak hesabınızı askıya alın</p>
                </div>
              </div>
              <div class="danger-info mt-3">
                <h3>Hesabınızı dondurmak istediğinize emin misiniz?</h3>
                <p>
                  Hesabınızı dondurduğunuzda profiliniz ve yazılarınız gizlenir. Sisteme tekrar giriş yaptığınızda hesabınız otomatik olarak aktifleşecektir.
                </p>
              </div>
              <button class="btn btn-warning mt-3" (click)="openAccountDeactivationModal()">
                Hesabı Dondur
              </button>
            </div>
          }

          <!-- ==================================================== -->
          <!-- TAB 6: KALICI HESAP SİLME                            -->
          <!-- ==================================================== -->
          @if (activeTab() === 'DELETE') {
            <div class="danger-zone-card card">
              <div class="card-header-flex">
                <div>
                  <h2 class="card-section-title text-danger"> Tehlikeli Bölge: Hesabı Sil</h2>
                  <p class="card-section-desc">Hesabınızı kalıcı olarak silme işlemleri</p>
                </div>
              </div>
              <div class="danger-info mt-3">
                <h3>Hesabınızı silmek istediğinize emin misiniz?</h3>
                <p>
                  Hesabınızı sildiğinizde, profil bilgileriniz, yayınladığınız tüm yazılar ve etkileşimleriniz kalıcı olarak silinir. Bu işlem <strong>geri alınamaz</strong>.
                </p>
                <p class="sub-danger">
                  Güvenliğiniz için kayıtlı e-posta adresinize tek tıkla onaylayabileceğiniz hesap silme bağlantısı gönderilecektir.
                </p>
              </div>

              <div class="danger-action mt-3">
                <button class="btn btn-danger" (click)="openAccountDeletionModal()">
                  <span></span> Hesabımı Kalıcı Olarak Sil
                </button>
              </div>
            </div>
          }
        }
      </div>

      <!-- ==================================================== -->
      <!-- NOTIFICATION DETAILS MODAL                           -->
      <!-- ==================================================== -->
      @if (selectedNotification()) {
        <div class="modal-backdrop" (click)="closeNotificationModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <div class="modal-icon">
                  @if (selectedNotification()?.type === 'Warning') {
                    ⚠️
                  } @else if (selectedNotification()?.type === 'Success') {
                    ✅
                  } @else if (selectedNotification()?.type === 'Info') {
                    ℹ️
                  } @else if (selectedNotification()?.type === 'PostDeleted') {
                    🗑️
                  } @else if (selectedNotification()?.type === 'AccountBanned') {
                    ⛔
                  } @else {
                    🔔
                  }
                </div>
                <div>
                  <h3 class="modal-title">{{ selectedNotification()?.title }}</h3>
                  <p class="modal-subtitle">{{ selectedNotification()?.createdAt | date:'d MMMM y, HH:mm' }}</p>
                </div>
              </div>
              <button class="modal-close-btn" (click)="closeNotificationModal()">✖</button>
            </div>
            <div class="modal-body" style="font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
              <span class="notif-modal-text">{{ selectedNotification()?.message }}</span>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeNotificationModal()">Kapat</button>
            </div>
          </div>
        </div>
      }

      <!-- ==================================================== -->
      <!-- MODAL: YAZI DÜZENLEME MODALI (EDIT POST MODAL)       -->
      <!-- ==================================================== -->
      @if (editingPost()) {
        <div class="modal-backdrop" (click)="closeEditPostModal()">
          <div class="modal-card modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <span class="modal-icon"></span>
                <div>
                  <h3 class="modal-title">Yazıyı Düzenle</h3>
                  <p class="modal-subtitle">"{{ editingPost()?.title }}"</p>
                </div>
              </div>
              <button class="modal-close-btn" (click)="closeEditPostModal()"></button>
            </div>

            <form (ngSubmit)="savePostChanges()">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label" for="edit-post-title">Başlık *</label>
                  <input
                    id="edit-post-title"
                    type="text"
                    class="form-control"
                    [(ngModel)]="editPostTitle"
                    name="editPostTitle"
                    required
                  />
                </div>

                <div class="form-row-2">
                  <div class="form-group">
                    <label class="form-label">Yazı Türü</label>
                    <div class="type-info-display">
                      {{ computeEditPostType() === 'Blog' ? '📄 Blog Yazısı' : '✍️ Köşe Yazısı' }}
                    </div>
                    <div class="form-hint">Fotoğrafa göre otomatik belirlenir — fotoğraflı yazılar Blog, fotoğrafsız yazılar Köşe Yazısı olur.</div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Yayın Durumu</label>
                    @if (editingPost()?.status === 'Published') {
                      <div class="type-info-display">Yayında (Herkes Görebilir)</div>
                      <div class="form-hint">Yayınlanmış bir yazı tekrar taslağa alınamaz.</div>
                    } @else {
                      <div class="type-info-display">
                        {{ editPostStatus === 'Published' ? 'Yayınlanacak' : '📝 Taslak' }}
                      </div>
                      @if (editPostStatus === 'Published') {
                        <button type="button" class="btn btn-secondary btn-xs mt-2" (click)="editPostStatus = 'Draft'">↩️ Taslağa Geri Al</button>
                      } @else {
                        <button type="button" class="btn btn-primary btn-publish mt-2" (click)="editPostStatus = 'Published'">Yayınla</button>
                      }
                    }
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="edit-post-content">İçerik *</label>
                  <textarea
                    id="edit-post-content"
                    class="form-control"
                    rows="8"
                    [(ngModel)]="editPostContent"
                    name="editPostContent"
                    required
                  ></textarea>
                </div>

                <div class="form-group">
                  <label class="form-label">Kapak Görseli</label>
                  @if (editingPost()?.photoUrl && !newPostPhotoFile && !removeExistingPhoto) {
                    <div class="current-photo-preview mb-2">
                      <img [src]="blogService.getPhotoUrl(editingPost()?.photoUrl || undefined)" alt="Mevcut Görsel" />
                      <span class="photo-hint">Mevcut görsel korunuyor. Değiştirmek için yeni dosya seçebilir veya kaldırabilirsiniz.</span>
                      <button type="button" class="btn btn-danger btn-xs" (click)="removeExistingPhoto = true">🗑️ Fotoğrafı Kaldır</button>
                    </div>
                  }
                  @if (removeExistingPhoto) {
                    <div class="photo-removed-notice mb-2">
                      <span>Fotoğraf kaydedince kaldırılacak — yazı türü Köşe Yazısı olacak.</span>
                      <button type="button" class="btn btn-secondary btn-xs" (click)="removeExistingPhoto = false">Geri Al</button>
                    </div>
                  }
                  <input
                    type="file"
                    class="form-control"
                    (change)="onPostPhotoSelected($event)"
                    accept="image/*"
                  />
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeEditPostModal()" [disabled]="isSavingPost()">
                  İptal
                </button>
                <button type="submit" class="btn btn-primary" [disabled]="isSavingPost() || !editPostTitle.trim() || !editPostContent.trim()">
                  @if (isSavingPost()) {
                    <span>Kaydediliyor...</span>
                  } @else {
                    <span>💾 Değişiklikleri Kaydet</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ==================================================== -->
      <!-- MODAL: HESAP DONDURMA ONAY MODALI                    -->
      <!-- ==================================================== -->
      @if (showAccountDeactivationModal()) {
        <div class="modal-backdrop" (click)="closeAccountDeactivationModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header" style="border-bottom: 1px solid rgba(245, 158, 11, 0.2);">
              <div class="modal-title-wrap">
                <span class="modal-icon">❄️</span>
                <div>
                  <h3 class="modal-title" style="color: #d97706;">Hesabı Dondur</h3>
                  <p class="modal-subtitle">Geçici olarak askıya alınacak</p>
                </div>
              </div>
              <button class="modal-close-btn" (click)="closeAccountDeactivationModal()"></button>
            </div>

            <div class="modal-body">
              <div class="alert-box-warning" style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 16px; margin-bottom: 24px; color: #b45309; font-weight: 500;">
                Hesabınızı dondurmak istediğinize emin misiniz? Bu işlem sonucunda oturumunuz kapatılacak ve profiliniz gizlenecektir. İstediğiniz zaman e-posta ve şifrenizle giriş yaparak hesabınızı tekrar aktifleştirebilirsiniz.
              </div>
              <div class="text-center py-3">
                <button class="btn btn-warning btn-block" (click)="deactivateAccount()" [disabled]="isDeactivating()" style="background: #f59e0b; color: #fff; border: none;">
                  @if (isDeactivating()) {
                    <span>Donduruluyor...</span>
                  } @else {
                    <span>Evet, Hesabımı Dondur</span>
                  }
                </button>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeAccountDeactivationModal()">
                İptal
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ==================================================== -->
      <!-- MODAL: HESAP SİLME ONAY & BAĞLANTI GÖNDERME MODALI   -->
      <!-- ==================================================== -->
      @if (showAccountDeletionModal()) {
        <div class="modal-backdrop" (click)="closeAccountDeletionModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header modal-header-danger">
              <div class="modal-title-wrap">
                <span class="modal-icon"></span>
                <div>
                  <h3 class="modal-title">Hesap Silme Onayı</h3>
                  <p class="modal-subtitle">{{ authService.currentUser()?.email }}</p>
                </div>
              </div>
              <button class="modal-close-btn" (click)="closeAccountDeletionModal()"></button>
            </div>

            <div class="modal-body">
              @if (!deletionLinkSent()) {
                <div class="alert-box-danger" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; padding: 16px; margin-bottom: 24px; color: #f87171; font-weight: 500;">
                   Hesabınızı silmek üzeresiniz. Bu işlem kalıcıdır ve geri alınamaz. Devam etmek için e-posta adresinize tek tıkla onaylayabileceğiniz bir <strong style="color: #fca5a5;">hesap silme onay bağlantısı (buton)</strong> göndereceğiz.
                </div>
                <div class="text-center py-3">
                  <button class="btn btn-danger btn-block" (click)="requestDeletionLink()" [disabled]="isRequestingDeletionCode()">
                    @if (isRequestingDeletionCode()) {
                      <span>Bağlantı Gönderiliyor...</span>
                    } @else {
                      <span> E-Postama Silme Bağlantısı Gönder</span>
                    }
                  </button>
                </div>
              } @else {
                <div class="alert-box-success" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 10px; padding: 16px; margin-bottom: 16px;">
                  <div style="font-weight: 700; color: #22c55e; margin-bottom: 6px;"> Silme Bağlantısı E-Postanıza Gönderildi!</div>
                  <p style="margin: 0; font-size: 0.9rem; line-height: 1.5; color: var(--text-main, #e2e8f0);">
                    <strong>{{ authService.currentUser()?.email }}</strong> adresinize tek tıkla hesabınızı silebileceğiniz bir e-posta gönderdik. Lütfen gelen kutunuzu (ve <em>Spam / Gereksiz</em> klasörünü) kontrol edip içerisindeki <strong>' Hesabımı Kalıcı Olarak Sil'</strong> butonuna tıklayarak işlemi tamamlayınız.
                  </p>
                </div>

                <div class="d-flex justify-between items-center text-sm mt-3">
                  <button type="button" class="btn-link-action" (click)="requestDeletionLink()" [disabled]="isRequestingDeletionCode()">
                     Bağlantıyı Tekrar Gönder
                  </button>
                </div>
              }
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeAccountDeletionModal()">
                Kapat
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .profile-page {
      padding-top: 30px;
      padding-bottom: 80px;
      display: flex;
      justify-content: center;
    }

    .profile-container {
      width: 100%;
      max-width: 1140px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Banned Screen */
    .banned-screen-card {
      background: #1e1114;
      border: 2px solid #ef4444;
      box-shadow: 0 10px 30px rgba(239, 68, 68, 0.25);
      padding: 32px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .banned-header {
      display: flex;
      align-items: center;
      gap: 20px;
      border-bottom: 1px solid rgba(239, 68, 68, 0.2);
      padding-bottom: 20px;
    }

    .banned-icon-wrap {
      font-size: 48px;
    }

    .banned-title {
      font-size: 24px;
      font-weight: 800;
      color: #f87171;
      margin: 0 0 6px 0;
    }

    .banned-subtitle {
      color: #cbd5e1;
      font-size: 14px;
      margin: 0;
    }

    .banned-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .banned-reason-box {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 16px;
      border-radius: var(--radius-md);
    }

    .reason-label {
      font-size: 12px;
      font-weight: 700;
      color: #fca5a5;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: 6px;
    }

    .reason-text {
      font-size: 15px;
      color: #ffffff;
      margin: 0;
      line-height: 1.5;
    }

    .banned-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .banned-meta-item {
      background: rgba(15, 23, 42, 0.6);
      padding: 12px 16px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meta-lbl {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 600;
    }

    .meta-val {
      font-size: 14px;
      color: #ffffff;
    }

    .banned-info-notice {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
      background: rgba(255, 255, 255, 0.05);
      padding: 12px 16px;
      border-radius: var(--radius-md);
    }

    .banned-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-top: 1px solid rgba(239, 68, 68, 0.2);
      padding-top: 20px;
      flex-wrap: wrap;
    }

    /* Standard Profile Header */
    .profile-header {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 32px;
      background: var(--bg-card);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      color: var(--text-primary);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
    }

    :host-context(.light-theme) .profile-header {
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    @media (max-width: 600px) {
      .profile-header {
        flex-direction: column;
        text-align: center;
      }
      .profile-title-row {
        justify-content: center;
      }
    }

    .avatar-upload-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .profile-avatar-large {
      width: 84px;
      height: 84px;
      border-radius: 50%;
      background: #eff6ff;
      border: 3px solid #3b82f6;
      color: #1e3a8a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 800;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      transition: var(--transition);
    }

    .profile-avatar-large:hover {
      transform: scale(1.04);
      border-color: #f59e0b;
    }

    .avatar-img-element {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .avatar-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(15, 23, 42, 0.75);
      color: #ffffff;
      font-size: 14px;
      padding: 4px 0;
      text-align: center;
      opacity: 0;
      transition: var(--transition);
    }

    .profile-avatar-large:hover .avatar-overlay {
      opacity: 1;
    }

    .avatar-quick-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
    }

    .btn-link-action {
      background: none;
      border: none;
      color: #60a5fa;
      cursor: pointer;
      font-size: 12px;
      padding: 0;
      font-weight: 600;
    }

    .btn-link-action:hover {
      text-decoration: underline;
    }

    .action-sep {
      color: #64748b;
    }

    .profile-main-info {
      flex: 1;
    }

    .profile-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 6px;
    }

    .profile-name {
      font-size: 24px;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.5px;
    }

    .profile-email {
      font-size: 14px;
      color: #94a3b8;
      margin: 0 0 6px 0;
    }

    .profile-meta {
      font-size: 12px;
      color: #64748b;
      margin: 0;
    }

    /* Tabs Navigation */
    .profile-nav-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 8px;
      overflow-x: auto;
    }

    :host-context(.light-theme) .profile-nav-tabs {
      border-bottom: 1px solid #e2e8f0;
    }

    .tab-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      padding: 10px 18px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      text-decoration: none;
    }

    :host-context(.light-theme) .tab-btn {
      background: #f1f5f9;
      border-color: #e2e8f0;
      color: #475569;
    }

    .tab-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }

    .tab-btn.active {
      background: #2563eb;
      border-color: #3b82f6;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
    }

    .tab-btn-admin {
      background: rgba(245, 158, 11, 0.12);
      border-color: rgba(245, 158, 11, 0.3);
      color: #fbbf24;
    }

    .tab-btn-danger.active {
      background: #dc2626;
      border-color: #ef4444;
    }

    .tab-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 2px 6px;
      border-radius: var(--radius-full);
      font-size: 11px;
    }

    .badge-unread {
      background: #ef4444;
      color: #ffffff;
    }

    /* Cards */
    .card {
      background: var(--bg-card);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 28px;
    }

    :host-context(.light-theme) .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
    }

    .card-header-flex {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .card-section-title {
      font-size: 18px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 4px 0;
    }

    :host-context(.light-theme) .card-section-title {
      color: #0f172a;
    }

    .card-section-desc {
      font-size: 13px;
      color: #94a3b8;
      margin: 0;
    }

    :host-context(.light-theme) .card-section-desc {
      color: #64748b;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      gap: 16px;
    }

    :host-context(.light-theme) .info-item {
      border-bottom: 1px solid #f1f5f9;
    }

    .info-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .info-label {
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
    }

    .info-value {
      font-size: 14px;
      color: #ffffff;
      text-align: right;
    }

    :host-context(.light-theme) .info-value {
      color: #0f172a;
    }

    /* Forms */
    .edit-form, .password-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-label {
      font-size: 13px;
      font-weight: 700;
      color: #cbd5e1;
    }

    :host-context(.light-theme) .form-label {
      color: #334155;
    }

    .form-control {
      padding: 10px 14px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-md);
      color: #ffffff;
      font-size: 14px;
      transition: var(--transition);
    }

    :host-context(.light-theme) .form-control {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #0f172a;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
    }

    .form-hint {
      font-size: 12px;
      color: #94a3b8;
    }

    .alert-hint {
      color: #f59e0b;
    }

    .edit-actions {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }

    /* Password Rules List */
    .password-rules {
      list-style: none;
      padding: 0;
      margin: 8px 0 0 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 6px;
    }

    .password-rules li {
      font-size: 12px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .password-rules li.rule-pass {
      color: #4ade80;
      font-weight: 600;
    }

    .error-alert {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Posts Management */
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
      color: #e2e8f0;
      padding: 8px 16px;
      border-radius: var(--radius-full);
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: var(--transition);
    }

    .filter-pill.active {
      background: #2563eb;
      border-color: #3b82f6;
      color: #ffffff;
      font-weight: 800;
    }

    :host-context(.light-theme) .filter-pill {
      background: #f1f5f9;
      border-color: #e2e8f0;
      color: #334155;
    }

    :host-context(.light-theme) .filter-pill.active {
      background: #2563eb;
      border-color: #2563eb;
      color: #ffffff;
    }

    .post-search-box {
      min-width: 200px;
    }

    .my-posts-grid {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .my-post-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    :host-context(.light-theme) .my-post-card {
      background: #f8fafc;
      border-color: #e2e8f0;
    }

    .my-post-thumb {
      width: 90px;
      height: 80px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      background: #1e293b;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .my-post-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumb-empty {
      font-size: 32px;
    }

    .my-post-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .my-post-badges {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      flex-wrap: wrap;
    }

    .post-date {
      font-size: 11px;
      color: #94a3b8;
    }

    .my-post-title {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 6px 0;
    }

    :host-context(.light-theme) .my-post-title {
      color: #0f172a;
    }

    .my-post-snippet {
      font-size: 12px;
      color: #94a3b8;
      margin: 0 0 10px 0;
      line-height: 1.4;
    }

    .my-post-actions {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-right: 32px; /* Sola kaydırmak için eklendi */
    }

    .btn-action-icon {
      background: #ffffff;
      border: 1px solid rgba(15, 23, 42, 0.1);
      padding: 10px;
      font-size: 16px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .btn-action-icon:hover {
      background: #f1f5f9;
      transform: translateY(-2px);
    }

    :host-context(.dark-theme) .btn-action-icon {
      background: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    :host-context(.dark-theme) .btn-action-icon:hover {
      background: #f1f5f9;
    }

    .btn-xs {
      padding: 4px 10px;
      font-size: 12px;
      border-radius: 4px;
    }

    /* Notifications */
    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
    }

    :host-context(.light-theme) .notif-item {
      background: #f8fafc;
      border-color: #e2e8f0;
    }

    .notif-unread {
      border-left: 4px solid #3b82f6;
      background: rgba(59, 130, 246, 0.08);
    }

    .notif-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .notif-content {
      flex: 1;
      min-width: 0;
    }

    .notif-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .notif-title {
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
    }

    :host-context(.light-theme) .notif-title {
      color: #0f172a;
    }

    .notif-time {
      font-size: 11px;
      color: #94a3b8;
    }

    .notif-msg {
      font-size: 13px;
      color: #cbd5e1;
      margin: 0;
      line-height: 1.4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-height: 18px; /* Yaklaşık 1 satır */
      transition: all 0.3s ease;
    }
    
    .notif-msg.expanded {
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
      max-height: 500px;
    }

    .notif-indicator {
      width: 10px;
      height: 10px;
      background-color: var(--danger, #ef4444);
      border-radius: 50%;
      margin-left: 10px;
      flex-shrink: 0;
    }

    :host-context(.light-theme) .notif-msg {
      color: #475569;
    }

    /* Danger Zone */
    .danger-zone-card {
      border-color: rgba(239, 68, 68, 0.4);
    }

    .danger-box {
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 24px;
      border-radius: var(--radius-md);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }

    .danger-info h3 {
      font-size: 16px;
      font-weight: 700;
      color: #f87171;
      margin: 0 0 6px 0;
    }

    .danger-info p {
      font-size: 13px;
      color: #cbd5e1;
      margin: 0 0 4px 0;
      line-height: 1.4;
    }

    .sub-danger {
      font-size: 12px;
      color: #94a3b8;
    }

    /* Modals */
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
      align-items: flex-start;
      justify-content: center;
      padding: 100px 20px 40px;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .modal-card {
      background: #0d1b3e;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 540px;
      max-height: calc(100vh - 140px);
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      animation: modalFadeIn 0.2s ease-out;
      overflow: hidden;
    }

    .modal-card > form {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }

    :host-context(.light-theme) .modal-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
    }

    .modal-lg {
      max-width: 760px;
    }

    .modal-header {
      flex-shrink: 0;
      padding: 16px 24px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
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
    }

    .modal-body {
      padding: 14px 24px 24px;
      overflow-y: auto;
      overscroll-behavior: contain;
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .notif-modal-text {
      color: #cbd5e1;
      word-wrap: break-word;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    :host-context(.light-theme) .notif-modal-text {
      color: #334155;
    }

    .modal-footer {
      flex-shrink: 0;
      padding: 16px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
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

    .alert-box-warning {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fef3c7;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 13px;
      line-height: 1.5;
    }

    .current-photo-preview {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .current-photo-preview img {
      width: 70px;
      height: 50px;
      border-radius: 6px;
      object-fit: cover;
    }

    .photo-hint {
      font-size: 12px;
      color: #94a3b8;
    }

    .photo-removed-notice {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      padding: 10px 14px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: var(--radius-md);
      font-size: 12px;
      color: #fca5a5;
    }

    .type-info-display {
      height: 44px;
      display: flex;
      align-items: center;
      padding: 0 14px;
      border-radius: var(--radius-md);
      border: 1.5px solid rgba(255, 255, 255, 0.16);
      background: var(--bg-subtle);
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 600;
    }

    .type-info-display + button {
      margin-top: 8px;
    }

    .btn-publish {
      width: 100%;
      height: 42px;
      font-size: 14px;
      font-weight: 700;
    }

    .empty-state-card {
      text-align: center;
      padding: 40px 20px;
    }

    .empty-icon {
      font-size: 40px;
      margin-bottom: 10px;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      gap: 12px;
      color: #94a3b8;
    }

    .spinner-pulse {
      width: 36px;
      height: 36px;
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

    @media (max-width: 768px) {
      .my-post-card {
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .my-post-content {
        min-width: 150px;
      }
      .my-post-actions {
        width: 100%;
        margin-right: 0;
        justify-content: flex-end;
        padding-top: 12px;
        margin-top: 4px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }
      :host-context(.light-theme) .my-post-actions {
        border-top-color: rgba(15, 23, 42, 0.1);
      }
    }
  `]
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
  paginatedNotifications = computed(() => {
    const start = (this.currentNotifPage() - 1) * 10;
    return this.notifications().slice(start, start + 10);
  });
  
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
  loadNotifications() {
    this.isLoadingNotifications.set(true);
    this.authService.getUserNotifications().subscribe({
      next: (res) => {
        this.isLoadingNotifications.set(false);
        if (res.success && res.data) {
          this.notifications.set(res.data);
          this.autoExpandNotification();
        }
      },
      error: () => {
        this.isLoadingNotifications.set(false);
      }
    });
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

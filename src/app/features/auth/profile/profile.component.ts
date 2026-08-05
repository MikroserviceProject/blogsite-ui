import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container profile-page">
      <div class="profile-header card">
        <div class="profile-avatar-large">
          {{ authService.currentUser()?.username?.charAt(0)?.toUpperCase() || 'U' }}
        </div>
        <div class="profile-main-info">
          <div class="profile-title-row">
            <h1 class="profile-name">{{ authService.currentUser()?.username }}</h1>
            <span class="badge" [ngClass]="'badge-' + (authService.userRole()?.toLowerCase() || 'user')">
              {{ authService.userRole() }}
            </span>
            @if (authService.currentUser()?.isEmailConfirmed) {
              <span class="badge badge-success">✓ E-Posta Onaylı</span>
            } @else {
              <span class="badge badge-warning">⏳ Onay Bekliyor</span>
            }
          </div>
          <p class="profile-email">{{ authService.currentUser()?.email }}</p>
          <p class="profile-meta">Kayıt Tarihi: {{ authService.currentUser()?.createdAt | date:'d MMMM y, HH:mm' }}</p>
        </div>
        <div class="profile-actions">
          <button class="btn btn-danger btn-sm" (click)="logout()">
            <span>🚪</span> Çıkış Yap
          </button>
        </div>
      </div>

      <div class="profile-grid">
        <!-- 1. Hesap & Güvenlik Kartı -->
        <div class="card">
          <h3 class="card-section-title">🛡️ Kimlik & Güvenlik Bilgileri</h3>
          <p class="card-section-desc">Kullanıcı kimliğiniz merkezi Authentication mikroservisi tarafından doğrulanmıştır.</p>

          <div class="info-list">
            <div class="info-item">
              <span class="info-label">Kullanıcı ID (GUID)</span>
              <span class="info-value font-mono">{{ authService.currentUser()?.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Kullanıcı Adı</span>
              <span class="info-value">{{ authService.currentUser()?.username }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">E-Posta</span>
              <span class="info-value">{{ authService.currentUser()?.email }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Sistem Rolü</span>
              <span class="info-value font-bold">{{ authService.currentUser()?.role }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Tekil Oturum Durumu</span>
              <span class="info-value text-success">✓ Aktif (Aynı anda 2 cihazdan girişe karşı korunuyor)</span>
            </div>
          </div>
        </div>

        <!-- 2. Aktif JWT Token Kartı -->
        <div class="card">
          <div class="jwt-header">
            <h3 class="card-section-title">🔑 Aktif JWT Bearer Token</h3>
            <button class="btn btn-secondary btn-sm" (click)="copyToken()">
              <span>📋</span> Kopyala
            </button>
          </div>
          <p class="card-section-desc">Tüm API isteklerine otomatik olarak <code>Authorization: Bearer</code> başlığında gönderilir.</p>

          <div class="token-box">
            {{ authService.getToken() }}
          </div>

          <div class="token-features">
            <div class="feature-item">
              <span class="feature-icon">⏱️</span>
              <div>
                <strong>Geçerlilik Süresi:</strong> 120 Dakika
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🔒</span>
              <div>
                <strong>İmzalama Algoritması:</strong> HMAC SHA-256
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      padding-top: 20px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 30px;
      padding: 30px;
    }

    @media (max-width: 768px) {
      .profile-header {
        flex-direction: column;
        text-align: center;
      }
    }

    .profile-avatar-large {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--primary-gradient);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 800;
      box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.4);
      flex-shrink: 0;
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
      color: var(--text-primary);
    }

    .profile-email {
      font-size: 15px;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }

    .profile-meta {
      font-size: 13px;
      color: var(--text-muted);
    }

    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    @media (max-width: 860px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }

    .card-section-title {
      font-size: 17px;
      font-weight: 700;
      margin-bottom: 6px;
      color: var(--text-primary);
    }

    .card-section-desc {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 20px;
      line-height: 1.5;
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
      border-bottom: 1px solid var(--border);
      font-size: 14px;
    }

    .info-label {
      color: var(--text-secondary);
      font-weight: 500;
    }

    .info-value {
      color: var(--text-primary);
      font-weight: 600;
    }

    .font-mono {
      font-family: var(--font-mono);
      font-size: 12px;
      background: var(--bg-subtle);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
    }

    .text-success {
      color: var(--success);
    }

    .jwt-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .token-box {
      background: #0f172a;
      color: #38bdf8;
      font-family: var(--font-mono);
      font-size: 12px;
      padding: 16px;
      border-radius: var(--radius-md);
      word-break: break-all;
      line-height: 1.5;
      max-height: 160px;
      overflow-y: auto;
      margin-bottom: 18px;
    }

    .token-features {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--text-secondary);
    }

    .feature-icon {
      font-size: 16px;
    }
  `]
})
export class ProfileComponent {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  copyToken() {
    const token = this.authService.getToken();
    if (token) {
      navigator.clipboard.writeText(token);
      this.toastService.success('Kopyalandı', 'JWT Token panoya kopyalandı.');
    }
  }

  logout() {
    this.authService.logout();
    this.toastService.info('Oturum Kapatıldı', 'Güvenli bir şekilde çıkış yaptınız.');
    this.router.navigate(['/']);
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { parseAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-confirm-delete-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page-container container">
      <div class="auth-card card">

        <!-- DURUM 1: Silme İşlemi Başarıyla Tamamlandı -->
        @if (isDeleted()) {
          <div class="status-view success-view">
            <div class="status-icon-badge success-badge">✅</div>
            <h1 class="status-title">Hesabınız Silindi</h1>
            <p class="status-subtitle">
              Hesabınız, profil bilgileriniz ve platformdaki tüm verileriniz kalıcı olarak silinmiştir.
            </p>
            <div class="action-btn-group">
              <a routerLink="/" class="btn btn-primary btn-block btn-lg">
                🏠 Ana Sayfaya Dön
              </a>
              <a routerLink="/login" class="btn btn-secondary btn-block mt-2">
                🔑 Yeniden Kayıt Ol / Giriş Yap
              </a>
            </div>
          </div>
        }

        <!-- DURUM 2: Silme Hatası veya Süresi Dolmuş Link -->
        @else if (hasError()) {
          <div class="status-view error-view">
            <div class="status-icon-badge error-badge">⚠️</div>
            <h1 class="status-title">Hesap Silinemedi</h1>
            <p class="status-subtitle">
              {{ errorMessage() || 'Hesap silme bağlantısı geçersiz veya süresi dolmuş (1 saatlik süre aşılmış).' }}
            </p>

            <div class="action-btn-group mt-4">
              <a routerLink="/profile" class="btn btn-secondary btn-block">
                👤 Profilime Git
              </a>
              <a routerLink="/login" class="btn btn-link-action btn-block mt-2">
                ← Giriş Sayfasına Dön
              </a>
            </div>
          </div>
        }

        <!-- DURUM 3: Linkten Gelen Token ile Onay Bekleme Ekranı -->
        @else {
          <div class="status-view danger-view">
            <div class="status-icon-badge danger-badge">🗑️</div>
            <h1 class="status-title text-danger">Hesap Silme Onayı</h1>
            
            <p class="status-subtitle">
              @if (email) {
                <strong>{{ email }}</strong> hesabını kalıcı olarak silmek üzeresiniz.
              } @else {
                Hesabınızı kalıcı olarak silmek üzeresiniz.
              }
            </p>

            <div class="alert-box-danger my-4">
              <div class="alert-title">⚠️ DİKKAT: Bu işlem geri alınamaz!</div>
              <p class="alert-text">
                Hesabınız silindiğinde tüm blog yazılarınız, profil bilgileriniz, oturumunuz ve platformdaki tüm etkileşimleriniz veritabanından kalıcı olarak kaldırılacaktır.
              </p>
            </div>

            <div class="action-btn-group">
              <button
                type="button"
                class="btn btn-danger btn-block btn-lg"
                (click)="onConfirmDelete()"
                [disabled]="isDeleting()"
              >
                @if (isDeleting()) {
                  <span>Siliniyor...</span>
                } @else {
                  <span>🗑️ Hesabımı Kalıcı Olarak Sil</span>
                }
              </button>

              <a routerLink="/" class="btn btn-secondary btn-block mt-3" [class.disabled]="isDeleting()">
                Vazgeç ve Ana Sayfaya Dön
              </a>
            </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .auth-page-container {
      min-height: calc(100vh - 160px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 16px;
    }

    .auth-card {
      width: 100%;
      max-width: 500px;
      padding: 40px 32px;
      border-radius: var(--radius-xl, 16px);
      text-align: center;
      background: var(--bg-card, #131b2e);
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
      box-shadow: var(--shadow-lg, 0 10px 30px rgba(0,0,0,0.3));
    }

    .status-view {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .status-icon-badge {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 38px;
      margin-bottom: 20px;
    }

    .danger-badge {
      background: rgba(239, 68, 68, 0.15);
      border: 2px solid rgba(239, 68, 68, 0.35);
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
    }

    .success-badge {
      background: rgba(34, 197, 94, 0.15);
      border: 2px solid rgba(34, 197, 94, 0.35);
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.2);
    }

    .error-badge {
      background: rgba(245, 158, 11, 0.15);
      border: 2px solid rgba(245, 158, 11, 0.35);
      box-shadow: 0 0 20px rgba(245, 158, 11, 0.2);
    }

    .status-title {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--text-main, #f8fafc);
      margin-bottom: 8px;
    }

    .status-title.text-danger {
      color: #ef4444;
    }

    .status-subtitle {
      font-size: 0.95rem;
      color: var(--text-muted, #94a3b8);
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .alert-box-danger {
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 12px;
      padding: 16px;
      text-align: left;
      width: 100%;
    }

    .alert-title {
      color: #ef4444;
      font-weight: 700;
      font-size: 0.95rem;
      margin-bottom: 6px;
    }

    .alert-text {
      color: var(--text-main, #e2e8f0);
      font-size: 0.85rem;
      line-height: 1.5;
      margin: 0;
    }

    .action-btn-group {
      width: 100%;
      margin-top: 10px;
    }

    .btn-block {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .my-4 {
      margin-top: 1.25rem;
      margin-bottom: 1.25rem;
    }

    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }

    :host-context(.light-theme) .auth-card {
      background: #ffffff;
      border-color: #e2e8f0;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
    }

    :host-context(.light-theme) .status-title {
      color: #0f172a;
    }

    :host-context(.light-theme) .status-subtitle {
      color: #475569;
    }

    :host-context(.light-theme) .alert-text {
      color: #334155;
    }
  `]
})
export class ConfirmDeleteAccountComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);

  email: string = '';
  token: string = '';

  isDeleting = signal<boolean>(false);
  isDeleted = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.token = params['token'] || '';

      const errorParam = params['error'];
      if (errorParam) {
        this.hasError.set(true);
        this.errorMessage.set(errorParam);
        return;
      }

      if (!this.token) {
        this.hasError.set(true);
        this.errorMessage.set('Geçersiz veya eksik hesap silme bağlantısı.');
      }
    });
  }

  onConfirmDelete() {
    if (!this.token) {
      this.hasError.set(true);
      this.errorMessage.set('Silme onay anahtarı (token) bulunamadı.');
      return;
    }

    this.isDeleting.set(true);
    this.hasError.set(false);

    this.authService.confirmAccountDeletion({
      email: this.email || undefined,
      token: this.token
    }).subscribe({
      next: (res) => {
        this.isDeleting.set(false);
        if (res.success) {
          this.isDeleted.set(true);
          // Kullanıcı oturumunu tamamen kapat
          this.authService.logoutQuietly();
          this.toastService.success('Hesabınız Silindi', 'Hesabınız kalıcı olarak silinmiştir.');
        } else {
          this.hasError.set(true);
          this.errorMessage.set(res.message);
          this.toastService.error('Silme Başarısız', res.message);
        }
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.hasError.set(true);
        const parsed = parseAuthError(err, 'Hesap silme işlemi gerçekleştirilemedi.');
        this.errorMessage.set(parsed.generalMessage);
        this.toastService.error('Hata', parsed.generalMessage);
      }
    });
  }
}

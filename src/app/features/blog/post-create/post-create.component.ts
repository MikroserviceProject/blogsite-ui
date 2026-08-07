import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { BlogService } from '../../../core/services/blog.service';

@Component({
  selector: 'app-post-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container create-post-page">
      <div class="header-row">
        <div>
          <a routerLink="/" class="back-link">← Ana Sayfaya Dön</a>
          <h1 class="page-title">✍️ Yeni İçerik / Köşe Yazısı Oluştur</h1>
          <p class="page-desc">Lumina okurları için yeni bir makale veya köşe yazısı hazırlayın.</p>
        </div>
        <div class="author-badge-card">
          <span class="badge badge-author">{{ authService.currentUser()?.role }}</span>
          <span class="author-author-name">{{ authService.currentUser()?.username }}</span>
        </div>
      </div>

      <div class="create-grid">
        <!-- Editor Form -->
        <div class="card editor-card">
          <form (ngSubmit)="onSubmit('Published')">
            <div class="form-group">
              <label class="form-label">Başlık</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="title"
                name="title"
                placeholder="Örn: Dağıtık Sistemlerde Kimlik Doğrulama"
                required
              />
            </div>

            <!-- Fotoğraf Yükleme Alanı -->
            <div class="form-group">
              <label class="form-label">📸 Kapak Fotoğrafı (fotoğraf eklerseniz "Blog", eklemezseniz "Köşe Yazısı" olarak yayınlanır)</label>
              <div class="photo-upload-container">
                <input
                  type="file"
                  #fileInput
                  (change)="onFileSelected($event)"
                  accept="image/*"
                  style="display: none;"
                />
                <button
                  type="button"
                  class="btn btn-outline-primary upload-trigger-btn"
                  (click)="fileInput.click()"
                >
                  📁 Bilgisayardan Fotoğraf Seç
                </button>
                @if (selectedFileName()) {
                  <span class="upload-or-text">{{ selectedFileName() }}</span>
                }
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">İçerik Metni</label>
              <textarea
                class="form-control"
                rows="10"
                [(ngModel)]="content"
                name="content"
                placeholder="Makalenizin detaylı içeriğini buraya yazınız..."
                required
              ></textarea>
            </div>

            @if (submitError()) {
              <p class="submit-error">{{ submitError() }}</p>
            }

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" [disabled]="submitting()" (click)="onSubmit('Draft')">
                {{ submitting() ? 'Kaydediliyor...' : 'Taslak Olarak Kaydet' }}
              </button>
              <button type="submit" class="btn btn-primary btn-lg" [disabled]="submitting()">
                {{ submitting() ? 'Kaydediliyor...' : 'Yayına Al' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Live Preview Sidebar -->
        <div class="card preview-card">
          <h3 class="preview-title">👁️ Canlı Önizleme</h3>
          <div class="preview-box">
            <div class="preview-cover" *ngIf="previewUrl()">
              <img [src]="previewUrl()" alt="Kapak" />
            </div>
            <div class="preview-body">
              <span class="badge badge-primary">{{ selectedFile() ? 'Blog' : 'Köşe Yazısı' }}</span>
              <h3 class="preview-heading">{{ title || 'Yazı Başlığı Buraya Gelecek' }}</h3>
              <p class="preview-summary">{{ content ? (content.slice(0, 150) + (content.length > 150 ? '...' : '')) : 'Yazının içeriği burada görünecektir...' }}</p>
              <div class="preview-author-row">
                <strong>{{ authService.currentUser()?.username }}</strong>
                <span class="text-muted">• Şimdi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .create-post-page {
      padding-top: 20px;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 24px;
    }

    .back-link {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 6px;
      display: inline-block;
    }

    .page-title {
      font-size: 28px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .page-desc {
      font-size: 14px;
      color: var(--text-muted);
    }

    .author-badge-card {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      padding: 8px 16px;
      border-radius: var(--radius-md);
    }

    .author-author-name {
      font-weight: 700;
      font-size: 14px;
    }

    .create-grid {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 24px;
    }

    @media (max-width: 900px) {
      .create-grid {
        grid-template-columns: 1fr;
      }
    }


    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      border-top: 1px solid var(--border);
      padding-top: 18px;
    }

    .preview-card {
      height: fit-content;
      position: sticky;
      top: 90px;
    }

    .preview-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .photo-upload-container {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .upload-trigger-btn {
      white-space: nowrap;
      font-size: 13px;
      padding: 8px 12px;
    }
    .upload-or-text {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .submit-error {
      color: #dc2626;
      font-size: 13px;
      font-weight: 600;
      margin-top: 12px;
    }
    .preview-box {
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
      background: var(--bg-surface);
    }

    .preview-cover {
      height: 160px;
      overflow: hidden;
    }

    .preview-cover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .preview-body {
      padding: 16px;
    }

    .preview-heading {
      font-size: 16px;
      font-weight: 700;
      margin: 10px 0 6px 0;
    }

    .preview-summary {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 12px;
      line-height: 1.5;
    }

    .preview-author-row {
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
  `]
})
export class PostCreateComponent implements OnDestroy {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  blogService = inject(BlogService);
  router = inject(Router);

  title = '';
  content = '';

  selectedFile = signal<File | null>(null);
  selectedFileName = signal<string>('');
  previewUrl = signal<string | null>(null);

  submitting = signal<boolean>(false);
  submitError = signal<string | null>(null);
  private saved = false;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile.set(file);
      this.selectedFileName.set(file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      this.toastService.success('Fotoğraf Seçildi 📸', `${file.name} önizlemeye eklendi.`);
    }
  }

  onSubmit(status: 'Draft' | 'Published') {
    if (!this.title || !this.content) {
      this.toastService.warning('Eksik Alan', 'Lütfen başlık ve içerik alanlarını doldurunuz.');
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);

    const type: 'Blog' | 'Koseyazisi' = this.selectedFile() ? 'Blog' : 'Koseyazisi';

    this.blogService.create({
      title: this.title,
      content: this.content,
      type: type,
      status: status,
      photo: this.selectedFile()
    }).subscribe({
      next: () => {
        this.saved = true;
        this.submitting.set(false);
        if (status === 'Published') {
          this.toastService.success('Yazı Yayında! 🎉', 'Yazınız başarıyla yayınlandı ve listelendi.');
        } else {
          this.toastService.info('Taslak Kaydedildi', 'Yazınız taslak olarak kaydedildi.');
        }
        this.router.navigate(['/']);
      },
      error: () => {
        this.submitting.set(false);
        this.submitError.set('Yazı kaydedilemedi. Backend\'in çalıştığından emin olun.');
      }
    });
  }

  ngOnDestroy() {
    const hasContent = this.title.trim().length > 0 || this.content.trim().length > 0;
    if (this.saved || !hasContent) {
      return;
    }

    const type: 'Blog' | 'Koseyazisi' = this.selectedFile() ? 'Blog' : 'Koseyazisi';

    this.blogService.create({
      title: this.title || 'Başlıksız Taslak',
      content: this.content,
      type: type,
      status: 'Draft',
      photo: this.selectedFile()
    }).subscribe();
  }
}
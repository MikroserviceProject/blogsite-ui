import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

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
          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label">İçerik Türü</label>
              <div class="type-selector">
                <label class="type-option" [class.type-selected]="type === 'Blog'">
                  <input type="radio" name="type" value="Blog" [(ngModel)]="type" />
                  <span>📄 Standart Blog</span>
                </label>
                <label class="type-option" [class.type-selected]="type === 'Column'">
                  <input type="radio" name="type" value="Column" [(ngModel)]="type" />
                  <span>✍️ Köşe Yazısı</span>
                </label>
              </div>
            </div>

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

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Kategori</label>
                <select class="form-control" [(ngModel)]="category" name="category">
                  <option value="Teknoloji">Teknoloji</option>
                  <option value="Mikroservis & .NET">Mikroservis & .NET</option>
                  <option value="Yapay Zeka">Yapay Zeka</option>
                  <option value="Tasarım">Tasarım & UI/UX</option>
                  <option value="Güncel Yorum">Güncel Yorum</option>
                </select>
              </div>

              <!-- Fotoğraf Yükleme Alanı (Yazar & Admin Yetkisi) -->
              <div class="form-group">
                <label class="form-label">📸 Kapak Fotoğrafı Yükle</label>
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
                  <span class="upload-or-text">veya URL:</span>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="coverImageUrl"
                    name="coverImageUrl"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Özet (Lead Text)</label>
              <textarea
                class="form-control"
                rows="2"
                [(ngModel)]="summary"
                name="summary"
                placeholder="Yazının ana temasını belirten kısa bir özet..."
                required
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">İçerik Metni</label>
              <textarea
                class="form-control"
                rows="8"
                [(ngModel)]="content"
                name="content"
                placeholder="Makalenizin detaylı içeriğini buraya yazınız..."
                required
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="saveDraft()">Taslak Olarak Kaydet</button>
              <button type="submit" class="btn btn-primary btn-lg">Yayına Al</button>
            </div>
          </form>
        </div>

        <!-- Live Preview Sidebar -->
        <div class="card preview-card">
          <h3 class="preview-title">👁️ Canlı Önizleme</h3>
          <div class="preview-box">
            <div class="preview-cover" *ngIf="coverImageUrl">
              <img [src]="coverImageUrl" alt="Kapak" />
            </div>
            <div class="preview-body">
              <span class="badge badge-primary">{{ category }}</span>
              <h3 class="preview-heading">{{ title || 'Yazı Başlığı Buraya Gelecek' }}</h3>
              <p class="preview-summary">{{ summary || 'Yazının kısa özeti burada görünecektir...' }}</p>
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

    .type-selector {
      display: flex;
      gap: 12px;
    }

    .type-option {
      flex: 1;
      padding: 10px 14px;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: var(--transition);
    }

    .type-selected {
      border-color: var(--primary);
      background: var(--primary-light);
      color: var(--primary);
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
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
export class PostCreateComponent {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  type: 'Blog' | 'Column' = 'Column';
  title = '';
  category = 'Teknoloji';
  coverImageUrl = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80';
  summary = '';
  content = '';

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.coverImageUrl = e.target?.result as string;
        this.toastService.success('Fotoğraf Yüklendi! 📸', `${file.name} başarıyla seçildi ve önizlemeye eklendi.`);
      };
      reader.readAsDataURL(file);
    }
  }

  saveDraft() {
    this.toastService.info('Taslak Kaydedildi', 'Yazı taslağınız yerel belleğe kaydedildi.');
  }

  onSubmit() {
    if (!this.title || !this.summary || !this.content) {
      this.toastService.warning('Eksik Alan', 'Lütfen başlık, özet ve içerik alanlarını doldurunuz.');
      return;
    }

    this.toastService.success('Yazı Yayında! 🎉', 'Yazınız başarıyla yayınlandı ve listelendi.');
    this.router.navigate(['/']);
  }
}

import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
          <h1 class="page-title">{{ editingId() ? '✏️ Yazıyı Düzenle' : '✍️ Yeni İçerik / Köşe Yazısı Oluştur' }}</h1>
          <p class="page-desc">Lumina okurları için yeni bir makale veya köşe yazısı hazırlayın.</p>
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
              <label class="form-label">📸 Kapak Fotoğrafı</label>
              <p class="field-hint">Fotoğraflı gönderiler "Blog" başlığı altında, fotoğrafsız olanlar "Köşe Yazısı" olarak yayınlanır.</p>
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
                  class="upload-trigger-btn"
                  (click)="fileInput.click()"
                >
                  📁 Bilgisayardan Fotoğraf Seç
                </button>
                @if (selectedFileName()) {
                  <span class="upload-or-text">{{ selectedFileName() }}</span>
                } @else if (existingPhotoUrl()) {
                  <span class="upload-or-text">Mevcut fotoğraf korunuyor</span>
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
                {{ submitting() ? 'Kaydediliyor...' : 'Yayınla' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Live Preview Sidebar -->
        <div class="card preview-card">
          <div class="preview-card-header">
            <h3 class="preview-title">Önizleme ✨</h3>
            <span class="preview-type-tag">{{ (selectedFile() || existingPhotoUrl()) ? 'Blog' : 'Köşe Yazısı' }}</span>
          </div>
          <div class="preview-box">
            @if (previewUrl() || existingPhotoUrl()) {
              <img [src]="previewUrl() || photoSrc(existingPhotoUrl()!)" alt="Kapak önizleme" class="preview-photo" />
            }
            <div class="preview-text">
              <h4 class="preview-heading">{{ title || 'Yazı başlığı burada görünecek' }}</h4>
              <p class="preview-summary">{{ content ? (content.slice(0, 150) + (content.length > 150 ? '...' : '')) : 'İçerik burada görünecek...' }}</p>
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

    .field-hint {
      font-size: 12px;
      color: var(--text-muted);
      margin: -2px 0 8px 0;
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

    .preview-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 16px;
    }

    .preview-title {
      font-size: 16px;
      font-weight: 700;
      margin: 0;
    }

    .photo-upload-container {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .upload-trigger-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      font-size: 13px;
      font-weight: 700;
      padding: 8px 14px;
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      border: 1.5px solid var(--border);
      color: var(--primary);
      cursor: pointer;
      transition: var(--transition);
    }

    .upload-trigger-btn:hover {
      background: var(--bg-subtle);
      border-color: var(--primary);
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
      min-height: 140px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
      background: var(--bg-surface);
    }

    .preview-photo {
      display: block;
      width: 100%;
      height: 140px;
      object-fit: cover;
    }

    .preview-text {
      padding: 14px;
    }

    .preview-heading {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 6px 0;
      line-height: 1.35;
    }

    .preview-summary {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
    }

    .preview-type-tag {
      flex-shrink: 0;
      background: #ffffff;
      color: #7c3aed;
      border: 1px solid rgba(124, 58, 237, 0.25);
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }
  `]
})
export class PostCreateComponent implements OnInit, OnDestroy {
  toastService = inject(ToastService);
  blogService = inject(BlogService);
  router = inject(Router);
  private route = inject(ActivatedRoute);

  title = '';
  content = '';

  editingId = signal<number | null>(null);
  existingPhotoUrl = signal<string | null>(null);

  selectedFile = signal<File | null>(null);
  selectedFileName = signal<string>('');
  previewUrl = signal<string | null>(null);

  submitting = signal<boolean>(false);
  submitError = signal<string | null>(null);
  private saved = false;

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;

    const id = Number(idParam);
    if (isNaN(id)) return;

    this.editingId.set(id);
    this.blogService.getById(id).subscribe({
      next: (post) => {
        this.title = post.title;
        this.content = post.content;
        this.existingPhotoUrl.set(post.photoUrl);
      },
      error: () => {
        this.toastService.warning('Yazı Bulunamadı', 'Düzenlenecek yazı yüklenemedi.');
        this.router.navigate(['/taslaklarim']);
      }
    });
  }

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

    const editingId = this.editingId();

    if (editingId) {
      this.blogService.update(editingId, {
        title: this.title,
        content: this.content,
        status: status,
        photo: this.selectedFile()
      }).subscribe({
        next: () => {
          this.saved = true;
          this.submitting.set(false);
          if (status === 'Published') {
            this.toastService.success('Yazı Yayında! 🎉', 'Yazınız güncellendi ve yayınlandı.');
          } else {
            this.toastService.info('Taslak Güncellendi', 'Değişiklikleriniz taslak olarak kaydedildi.');
          }
          this.router.navigate(['/']);
        },
        error: () => {
          this.submitting.set(false);
          this.submitError.set('Yazı güncellenemedi. Backend\'in çalıştığından emin olun.');
        }
      });
      return;
    }

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
    if (this.editingId()) {
      return;
    }

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

  photoSrc(photoUrl: string): string {
    return `https://localhost:7296${photoUrl}`;
  }
}

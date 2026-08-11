import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { BlogService } from '../../../core/services/blog.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-post-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container create-post-page">
      <div class="header-row">
        <div>
          <a routerLink="/" class="back-link">← Ana Sayfaya Dön</a>
          <h1 class="page-title">{{ editingId() ? ' Yazıyı Düzenle' : ' Yeni İçerik / Köşe Yazısı Oluştur' }}</h1>
          <p class="page-desc">Lumina okurları için yeni bir makale veya köşe yazısı hazırlayın.</p>
        </div>
      </div>

      <div class="create-grid">
        <!-- Editor Form -->
        <div class="card editor-card">
          <form (ngSubmit)="onSubmit()">
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

            <!-- Etiket (Tags) Yükleme Alanı -->
            <div class="form-group">
              <label class="form-label">🏷️ Etiketler</label>
              <div class="tags-input-container form-control" (click)="tagsInputField.focus()">
                @for (tag of tagsArray(); track tag) {
                  <span class="tag-badge">
                    {{ tag }}
                    <button type="button" class="tag-remove" (click)="removeTag(tag)">&times;</button>
                  </span>
                }
                <input
                  #tagsInputField
                  type="text"
                  class="tags-input-field"
                  [(ngModel)]="tagsInputText"
                  name="tagsInputText"
                  (keydown)="onTagKeydown($event)"
                  placeholder="Etiket yazıp Boşluk, Virgül veya Enter'a basın"
                />
              </div>
              <p class="field-hint">Tarihçe ve filtreleme için dillerin veya konuların adlarını virgülle ayırarak yazabilirsiniz.</p>
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
              <button type="submit" class="btn btn-primary btn-lg" [disabled]="submitting()">
                {{ submitting() ? 'Kaydediliyor...' : 'Yayınla' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Live Preview Sidebar -->
        <div class="card preview-card">
          <div class="preview-card-header">
            <h3 class="preview-title">Önizleme </h3>
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

    .tags-input-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      min-height: 44px;
      height: auto;
      padding: 6px 14px;
      cursor: text;
    }
    
    .tag-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--bg-surface);
      color: var(--primary);
      border: 1px solid var(--border);
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 13px;
      font-weight: 600;
    }
    
    .tag-remove {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      padding: 0 2px;
    }
    
    .tag-remove:hover {
      color: var(--text-main);
    }
    
    .tags-input-field {
      border: none;
      background: transparent;
      outline: none;
      flex: 1;
      min-width: 120px;
      color: var(--text-main);
      font-size: 14px;
      padding: 4px 0;
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

    .editor-card {
      padding: 32px;
    }
    
    :host-context(.light-theme) .editor-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .preview-card {
      height: fit-content;
      position: sticky;
      top: 90px;
      padding: 24px;
    }
    
    :host-context(.light-theme) .preview-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
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
  authService = inject(AuthService);
  router = inject(Router);
  private route = inject(ActivatedRoute);

  title = '';
  content = '';
  tagsInputText = '';
  tagsArray = signal<string[]>([]);

  onTagKeydown(event: KeyboardEvent) {
    if (event.key === ',' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const val = this.tagsInputText.trim();
      if (val) {
        const cleanVal = val.replace(/,+$/, '').trim();
        if (cleanVal && !this.tagsArray().includes(cleanVal)) {
          this.tagsArray.update(tags => [...tags, cleanVal]);
        }
      }
      this.tagsInputText = '';
    }
  }

  removeTag(tagToRemove: string) {
    this.tagsArray.update(tags => tags.filter(t => t !== tagToRemove));
  }

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
        this.tagsArray.set(post.tags || []);
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

  onSubmit() {
    const status = 'Published';
    if (!this.title || !this.content) {
      this.toastService.warning('Eksik Alan', 'Lütfen başlık ve içerik alanlarını doldurunuz.');
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);

    const editingId = this.editingId();

    const parsedTags = this.tagsArray();

    if (editingId) {
      this.blogService.update(editingId, {
        title: this.title,
        content: this.content,
        status: status,
        photo: this.selectedFile(),
        tags: parsedTags
      }).subscribe({
        next: () => {
          this.saved = true;
          this.submitting.set(false);
          this.toastService.success('Yazı Yayında! ', 'Yazınız güncellendi ve yayınlandı.');
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
      photo: this.selectedFile(),
      tags: parsedTags,
      authorId: this.authService.currentUser()?.id || ''
    }).subscribe({
      next: () => {
        this.saved = true;
        this.submitting.set(false);
        this.toastService.success('Yazı Yayında! ', 'Yazınız başarıyla yayınlandı ve listelendi.');
        this.router.navigate(['/']);
      },
      error: () => {
        this.submitting.set(false);
        this.submitError.set('Yazı kaydedilemedi. Backend\'in çalıştığından emin olun.');
      }
    });
  }

  ngOnDestroy() {
    // Auto-save disabled as drafts feature is removed.
  }

  photoSrc(photoUrl: string): string {
    return `https://localhost:7296${photoUrl}`;
  }
}

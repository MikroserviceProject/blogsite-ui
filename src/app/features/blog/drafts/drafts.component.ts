import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogPost } from '../../../core/models/blog.model';
import { BlogService } from '../../../core/services/blog.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-drafts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container drafts-page">
      <a routerLink="/" class="back-link">← Ana Sayfaya Dön</a>

      <div class="drafts-header">
        <h1 class="page-title">📝 Taslaklarım</h1>
        <p class="page-desc">Henüz yayınlanmamış, taslak durumundaki yazılar.</p>
      </div>

      @if (loading()) {
        <p class="text-muted">Taslaklar yükleniyor...</p>
      }

      @if (loadError()) {
        <div class="empty-state card">
          <div class="empty-icon">⚠️</div>
          <h3>Taslaklar yüklenemedi</h3>
          <p>{{ loadError() }}</p>
        </div>
      }

      @if (!loading() && !loadError()) {
        @if (drafts().length === 0) {
          <div class="empty-state card">
            <div class="empty-icon">📭</div>
            <h3>Hiç taslağın yok</h3>
            <p>Yeni bir yazı yazmaya başladığında, yayınlamadan çıkarsan burada görünür.</p>
            <a routerLink="/create-post" class="btn btn-primary btn-sm">✍️ Yeni Yazı Ekle</a>
          </div>
        } @else {
          <div class="drafts-list">
            @for (draft of drafts(); track draft.id) {
              <div class="draft-card card">
                <div class="draft-info">
                  <span class="draft-type-badge" [class.badge-column]="draft.type === 'Koseyazisi'">
                    {{ draft.type === 'Koseyazisi' ? '✍️ Köşe Yazısı' : '📄 Blog' }}
                  </span>
                  <h3 class="draft-title">{{ draft.title }}</h3>
                  <p class="draft-excerpt">{{ excerptPreview(draft.content) }}</p>
                  <span class="draft-date">{{ draft.createdAt | date:'dd.MM.yyyy HH:mm' }}</span>
                </div>
                <div class="draft-actions">
                  <a [routerLink]="['/create-post', draft.id]" class="btn btn-secondary btn-sm">Düzenle</a>
                  <button class="btn btn-danger btn-sm" (click)="deleteDraft(draft.id)">Sil</button>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .drafts-page {
      padding-top: 20px;
      padding-bottom: 60px;
      max-width: 860px;
    }

    .back-link {
      display: inline-flex;
      font-weight: 600;
      font-size: 14px;
      color: var(--text-secondary);
      margin-bottom: 20px;
    }

    .back-link:hover {
      color: var(--primary);
    }

    .drafts-header {
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 28px;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 6px;
    }

    .page-desc {
      font-size: 14px;
      color: var(--text-muted);
    }

    .drafts-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .draft-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 18px 20px;
    }

    .draft-info {
      flex: 1;
      min-width: 0;
    }

    .draft-type-badge {
      display: inline-block;
      background: var(--bg-subtle);
      color: var(--text-secondary);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .draft-type-badge.badge-column {
      background: rgba(124, 58, 237, 0.12);
      color: #7c3aed;
    }

    .draft-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .draft-excerpt {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .draft-date {
      font-size: 12px;
      color: var(--text-muted);
    }

    .draft-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .btn-danger {
      background: #fee2e2;
      color: #dc2626;
      border: none;
    }

    .btn-danger:hover {
      background: #fecaca;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }
  `]
})
export class DraftsComponent implements OnInit {
  private blogService = inject(BlogService);
  private toastService = inject(ToastService);

  drafts = signal<BlogPost[]>([]);
  loading = signal<boolean>(false);
  loadError = signal<string | null>(null);

  ngOnInit() {
    this.loadDrafts();
  }

  loadDrafts() {
    this.loading.set(true);
    this.loadError.set(null);

    this.blogService.getAll('Draft').subscribe({
      next: (posts) => {
        const sorted = [...posts].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.drafts.set(sorted);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Taslaklar backend\'den alınamadı. API\'nin çalıştığından emin olun.');
        this.loading.set(false);
      }
    });
  }

  deleteDraft(id: number) {
    this.blogService.delete(id).subscribe({
      next: () => {
        this.drafts.update(list => list.filter(d => d.id !== id));
        this.toastService.success('Silindi', 'Taslak silindi.');
      },
      error: () => {
        this.toastService.warning('Silinemedi', 'Taslak silinirken bir hata oluştu.');
      }
    });
  }

  excerptPreview(content: string): string {
    return content.length > 120 ? content.slice(0, 120) + '...' : content;
  }
}

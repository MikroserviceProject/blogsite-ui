import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BlogPost } from '../../../core/models/blog.model';
import { PublicUserProfile } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { BlogService } from '../../../core/services/blog.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container article-page">
      <!-- Back Link -->
      <a routerLink="/" class="back-link">← Tüm Yazılara Dön</a>

      @if (loading()) {
        <p class="text-muted">Yazı yükleniyor...</p>
      }

      @if (loadError()) {
        <div class="empty-state card">
          <div class="empty-icon">⚠️</div>
          <h3>Yazı yüklenemedi</h3>
          <p>{{ loadError() }}</p>
        </div>
      }

      @if (post(); as p) {
        <article class="article-container card">
          <!-- Header -->
          <header class="article-header">
            <div class="article-meta">
              <span class="badge" [class.badge-primary]="p.type === 'Blog'" [class.badge-author]="p.type === 'Koseyazisi'">
                {{ p.type === 'Koseyazisi' ? '✍️ Köşe Yazısı' : '📄 Blog' }}
              </span>
              <span class="article-cat">{{ p.status === 'Draft' ? 'Taslak' : 'Yayında' }}</span>
              <span class="article-date">• {{ p.createdAt | date:'dd.MM.yyyy' }}</span>
            </div>

            <h1 class="article-title">{{ p.title }}</h1>
          </header>

          <!-- Cover Image -->
          @if (p.photoUrl) {
            <div class="article-cover">
              <img [src]="photoSrc(p.photoUrl)" [alt]="p.title" />
            </div>
          }

          <!-- Article Content -->
          <div class="article-body">
            <p>{{ p.content }}</p>
          </div>

          <!-- Author Info -->
          @if (authorProfile(); as author) {
            <div class="author-box">
              <div class="author-avatar">
                @if (authService.getAvatarUrl(author.profilePictureUrl); as avatarUrl) {
                  <img [src]="avatarUrl" [alt]="author.username" />
                } @else {
                  <span>{{ author.username.charAt(0).toUpperCase() }}</span>
                }
              </div>
              <div class="author-details">
                <span class="author-label">Yazar</span>
                <span class="author-name">{{ author.username }}</span>
              </div>

              @if (isOwner()) {
                <div class="owner-actions">
                  <a [routerLink]="['/create-post', p.id]" class="btn btn-secondary btn-sm">✏️ Düzenle</a>
                  <button type="button" class="btn btn-danger btn-sm" (click)="deletePost(p.id)">🗑️ Sil</button>
                </div>
              }
            </div>
          }
        </article>
      }
    </div>
  `,
  styles: [`
    .article-page {
      padding-top: 20px;
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

    .article-container {
      padding: 40px;
    }

    @media (max-width: 640px) {
      .article-container { padding: 24px; }
    }

    .article-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--text-muted);
      flex-wrap: wrap;
      margin-bottom: 12px;
    }

    .owner-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      margin-left: auto;
    }

    .article-cat {
      font-weight: 700;
      color: var(--primary);
    }

    .article-title {
      font-size: 34px;
      font-weight: 800;
      line-height: 1.25;
      margin-bottom: 24px;
      color: var(--text-primary);
    }

    @media (max-width: 640px) {
      .article-title { font-size: 26px; }
    }

    .article-cover {
      width: 100%;
      height: 380px;
      border-radius: var(--radius-md);
      overflow: hidden;
      margin-bottom: 32px;
    }

    .article-cover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .article-body {
      font-size: 16px;
      line-height: 1.8;
      color: var(--text-secondary);
      white-space: pre-wrap;
    }

    .author-box {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 14px;
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
    }

    .author-avatar {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      border-radius: 50%;
      overflow: hidden;
      background: var(--bg-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 18px;
      color: var(--text-primary);
    }

    .author-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .author-details {
      display: flex;
      flex-direction: column;
    }

    .author-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: var(--text-muted);
    }

    .author-name {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      margin-top: 20px;
    }

    .empty-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }
  `]
})
export class BlogDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private blogService = inject(BlogService);
  private toastService = inject(ToastService);
  authService = inject(AuthService);

  post = signal<BlogPost | null>(null);
  authorProfile = signal<PublicUserProfile | null>(null);
  loading = signal<boolean>(false);
  loadError = signal<string | null>(null);

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;

    if (isNaN(id)) {
      this.loadError.set('Geçersiz yazı numarası.');
      return;
    }

    this.loading.set(true);
    this.blogService.getById(id).subscribe({
      next: (post) => {
        this.post.set(post);
        this.loading.set(false);
        this.loadAuthorProfile(post.authorId);
      },
      error: () => {
        this.loadError.set('Yazı bulunamadı ya da backend\'e ulaşılamadı.');
        this.loading.set(false);
      }
    });
  }

  private loadAuthorProfile(authorId: string) {
    if (!authorId) return;

    this.authService.getPublicProfile(authorId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.authorProfile.set(res.data);
        }
      },
      error: () => {
        // Yazar bilgisi getirilemezse sessizce göz ardı edilir, yazının okunmasını engellemez.
      }
    });
  }

  photoSrc(photoUrl: string): string {
    return `https://localhost:7296${photoUrl}`;
  }

  isOwner(): boolean {
    const currentUser = this.authService.currentUser();
    const currentPost = this.post();
    return !!currentUser && !!currentPost && currentUser.id === currentPost.authorId;
  }

  deletePost(id: number) {
    if (!confirm('Bu yazıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    this.blogService.delete(id).subscribe({
      next: () => {
        this.toastService.success('Yazı Silindi 🗑️', 'Yazınız başarıyla kaldırıldı.');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.toastService.error('Silme Hatası', err?.error?.message || 'Yazı silinemedi.');
      }
    });
  }
}

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { BlogPost } from '../../../core/models/blog.model';
import { BlogService } from '../../../core/services/blog.service';

@Component({
  selector: 'app-tag-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Hero Banner -->
    <section class="hero-section">
      <div class="container hero-container">
        <h1 class="hero-title">
          <span class="text-gradient">{{ currentTag() }}</span> Ekosistemi
        </h1>
        <p class="hero-subtitle">
          {{ currentTag() }} ile ilgili yazılmış tüm bloglar ve köşe yazıları.
        </p>
      </div>
    </section>

    <!-- Main Content Area -->
    <section class="container blog-content-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Tüm İçerikler</h2>
          <p class="section-subtitle">Toplam {{ posts().length }} yayın bulundu</p>
        </div>
      </div>

      <!-- Loading state -->
      @if (loading()) {
        <p class="text-muted">Yazılar yükleniyor...</p>
      }

      <!-- Error state -->
      @if (loadError()) {
        <div class="empty-state card">
          <div class="empty-icon"></div>
          <h3>Yazılar yüklenemedi</h3>
          <p>{{ loadError() }}</p>
        </div>
      }

      <!-- Articles Grid -->
      @if (!loading() && !loadError()) {
        <div class="posts-grid">
          @for (post of posts(); track post.id) {
            <article class="post-card card">
              @if (post.photoUrl) {
                <div class="post-cover-wrapper">
                  <img [src]="photoSrc(post.photoUrl)" [alt]="post.title" class="post-cover" />
                  <span class="post-type-badge" [class.badge-column]="post.type === 'Koseyazisi'">
                    {{ post.type === 'Koseyazisi' ? ' Köşe Yazısı' : ' Blog' }}
                  </span>
                </div>
              }

              <div class="post-body">
                <div class="post-meta-top">
                  <div class="post-meta-left">
                    @if (!post.photoUrl) {
                      <span class="post-type-badge-inline" [class.badge-column]="post.type === 'Koseyazisi'">
                        {{ post.type === 'Koseyazisi' ? ' Köşe Yazısı' : ' Blog' }}
                      </span>
                    }
                  </div>
                  <span class="post-read-time">
                    @if (isNew(post.createdAt)) {
                      <span class="new-badge"><span class="new-badge-dot"></span>Yeni</span>
                    }
                    {{ post.createdAt | date:'dd.MM.yyyy' }}
                  </span>
                </div>

                @if (post.tags && post.tags.length > 0) {
                  <div class="post-tags">
                    @for (t of post.tags; track t) {
                      <span class="tag-link">{{ t }}</span>
                    }
                  </div>
                }

                <h3 class="post-title">
                  <a [routerLink]="['/post', post.id]">{{ post.title }}</a>
                </h3>

                <p class="post-summary">{{ contentPreview(post.content) }}</p>

                <div class="post-footer">
                  <a [routerLink]="['/post', post.id]" class="read-more-btn">
                    Oku →
                  </a>
                </div>
              </div>
            </article>
          }
        </div>

        <!-- Empty State -->
        @if (posts().length === 0) {
          <div class="empty-state card">
            <div class="empty-icon">🔍</div>
            <h3>Bu etikete sahip içerik bulunamadı</h3>
          </div>
        }
      }
    </section>
  `,
  styles: [`
    .hero-section {
      background: transparent;
      border-bottom: 1px solid var(--border);
      padding: 40px 0 30px 0;
      text-align: center;
    }

    .hero-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .hero-title {
      font-size: 36px;
      font-weight: 800;
      line-height: 1.2;
      color: var(--text-primary);
      margin-bottom: 10px;
      letter-spacing: -1px;
    }

    .text-gradient {
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-subtitle {
      font-size: 16px;
      color: var(--text-secondary);
      max-width: 620px;
      margin-bottom: 16px;
      line-height: 1.5;
    }

    .blog-content-section {
      padding-top: 32px;
      padding-bottom: 60px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 28px;
    }

    .section-title {
      font-size: 24px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .section-subtitle {
      font-size: 14px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .posts-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    @media (max-width: 980px) {
      .posts-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .posts-grid { grid-template-columns: 1fr; }
    }

    .post-card {
      padding: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: var(--transition);
    }

    .post-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }

    .post-cover-wrapper {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .post-cover {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .post-card:hover .post-cover {
      transform: scale(1.04);
    }

    .post-type-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(4px);
      color: #ffffff;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 700;
    }

    .post-type-badge-inline {
      background: var(--bg-subtle);
      color: var(--text-secondary);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 700;
    }

    .badge-column.post-type-badge-inline {
      background: rgba(124, 58, 237, 0.12);
      color: #7c3aed;
    }

    .badge-column {
      background: rgba(124, 58, 237, 0.85);
    }

    .post-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 190px;
    }

    .new-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(16, 185, 129, 0.12);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 2px 8px 2px 6px;
      border-radius: var(--radius-full);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      margin-right: 6px;
    }

    .new-badge-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #10b981;
    }

    .post-meta-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      margin-bottom: 8px;
    }

    .post-meta-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .post-tags {
      display: flex;
      gap: 6px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .tag-link {
      background: var(--bg-subtle);
      color: var(--text-secondary);
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
    }

    .post-read-time {
      color: var(--text-muted);
    }

    .post-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 10px;
      line-height: 1.35;
    }

    .post-title a {
      color: var(--text-primary);
      text-decoration: none;
    }

    .post-title a:hover {
      color: var(--primary);
    }

    .post-summary {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 20px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
    }

    .post-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      border-top: 1px solid var(--border);
      padding-top: 14px;
    }

    .read-more-btn {
      font-size: 13px;
      font-weight: 700;
      color: var(--primary);
      text-decoration: none;
    }

    .read-more-btn:hover {
      color: var(--primary-hover);
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
export class TagDetailComponent implements OnInit {
  private blogService = inject(BlogService);
  private route = inject(ActivatedRoute);

  currentTag = signal<string>('');
  loading = signal<boolean>(false);
  loadError = signal<string | null>(null);
  posts = signal<BlogPost[]>([]);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const tag = params.get('tag');
      if (tag) {
        this.currentTag.set(tag);
        this.loadPosts();
      }
    });
  }

  loadPosts() {
    this.loading.set(true);
    this.loadError.set(null);

    // Call API without fixing type (so we get both Blog and Koseyazisi)
    this.blogService.getAll('Published', undefined, undefined, this.currentTag()).subscribe({
      next: (posts) => {
        const sorted = [...posts].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.posts.set(sorted);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Yazılar alınamadı.');
        this.loading.set(false);
      }
    });
  }

  contentPreview(content: string): string {
    return content.length > 150 ? content.slice(0, 150) + '...' : content;
  }

  isNew(createdAt: string): boolean {
    const hoursSince = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    return hoursSince <= 24;
  }

  photoSrc(photoUrl: string): string {
    return `https://localhost:7296${photoUrl}`;
  }
}

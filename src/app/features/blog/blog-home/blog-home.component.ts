import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { BlogPost } from '../../../core/models/blog.model';
import { BlogService } from '../../../core/services/blog.service';

@Component({
  selector: 'app-blog-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Hero Banner -->
    <section class="hero-section">
      <div class="container hero-container">
        <h1 class="hero-title">
          @if (fixedType() === 'Koseyazisi') {
            <span class="text-gradient">Köşe Yazıları</span>
          } @else {
            <span class="text-gradient">Bloglar</span>
          }
        </h1>
        <p class="hero-subtitle">
          Fikirlerin teknolojiyle, teknolojinin gelecekle buluştuğu yer.
        </p>

        <!-- Search Bar -->
        <div class="hero-search-wrapper">
          <form class="hero-search-box" (ngSubmit)="submitSearch()">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              class="hero-search-input"
              name="searchQuery"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Başlık veya içerikte ara..."
            />
            @if (searchQuery()) {
              <button type="button" class="clear-search" (click)="clearSearch()">✕</button>
            }
            <button type="submit" class="search-submit-btn">Ara</button>
          </form>
        </div>
      </div>
    </section>

    <!-- Main Content Area -->
    <section class="container blog-content-section">
      <!-- Section Header -->
      <div class="section-header">
        <div>
          <h2 class="section-title">{{ fixedType() === 'Koseyazisi' ? 'Tüm Köşe Yazıları' : 'Tüm Bloglar' }}</h2>
          <p class="section-subtitle">Toplam {{ totalCount() }} yayın bulundu</p>
        </div>
      </div>

      @if (currentTag()) {
        <div class="tag-filter-banner">
          <span class="tag-filter-icon">🏷️</span>
          <span class="tag-filter-text">Şu an <strong>{{ currentTag() }}</strong> ile ilgili içerikleri görüntülüyorsunuz.</span>
          <button class="btn-clear-filter" (click)="clearTagFilter()">Tümünü Göster </button>
        </div>
      }

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
            <a [routerLink]="['/post', post.id]" class="post-card card">
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
                      <button type="button" class="tag-link" (click)="goToTag($event, t)">{{ t }}</button>
                    }
                  </div>
                }

                <h3 class="post-title">{{ post.title }}</h3>

                <p class="post-summary">{{ contentPreview(post.content) }}</p>

                <div class="post-footer">
                  <span class="read-more-btn">Oku →</span>
                </div>
              </div>
            </a>
          }
        </div>

        <!-- Empty State -->
        @if (posts().length === 0) {
          <div class="empty-state card">
            <div class="empty-icon">🔍</div>
            <h3>Aradığınız kriterde yazı bulunamadı</h3>
            <p>Farklı bir arama kelimesi deneyebilir veya filtreyi sıfırlayabilirsiniz.</p>
            <button class="btn btn-secondary btn-sm" (click)="clearSearch()">
              Aramayı Temizle
            </button>
          </div>
        }

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <nav class="pagination">
            <button
              class="page-btn page-nav"
              [disabled]="page() === 1"
              (click)="goToPage(page() - 1)"
            >← Önceki</button>

            @for (p of pageNumbers(); track p) {
              <button
                class="page-btn"
                [class.page-active]="p === page()"
                (click)="goToPage(p)"
              >{{ p }}</button>
            }

            <button
              class="page-btn page-nav"
              [disabled]="page() === totalPages()"
              (click)="goToPage(page() + 1)"
            >Sonraki →</button>
          </nav>
        }
      }
    </section>

    <!-- Newsletter CTA -->
    <section class="container newsletter-section">
      <div class="newsletter-card card">
        <div class="newsletter-content">
          <span class="newsletter-badge">Haftalık Bülten</span>
          <h2 class="newsletter-title">Yeni Yazıları ve Gelişmeleri Kaçırmayın</h2>
          <p class="newsletter-desc">En güncel teknoloji ve köşe yazılarını her pazartesi sabahı e-posta kutunuza ulaştıralım.</p>
        </div>
        <div class="newsletter-form">
          @if (newsletterSubscribed()) {
            <span class="newsletter-thanks">Teşekkürler! Abone oldunuz.</span>
          } @else {
            <input type="email" placeholder="E-posta adresiniz..." class="form-control" [(ngModel)]="newsletterEmail" name="newsletterEmail" />
            <button class="btn btn-primary" (click)="subscribeNewsletter()">Abone Ol</button>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero-section {
      background: transparent;
      border-bottom: 1px solid var(--border);
      padding: 28px 0 20px 0;
      text-align: center;
    }

    .hero-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .hero-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: var(--radius-full);
      background: var(--primary-light);
      color: var(--primary);
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .hero-title {
      font-size: 36px;
      font-weight: 800;
      line-height: 1.2;
      color: var(--text-primary);
      margin-bottom: 10px;
      letter-spacing: -1px;
    }

    @media (max-width: 768px) {
      .hero-title { font-size: 26px; }
    }

    .text-gradient {
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-subtitle {
      font-size: 14px;
      color: var(--text-secondary);
      max-width: 620px;
      margin-bottom: 16px;
      line-height: 1.5;
    }

    .hero-search-wrapper {
      width: 100%;
      max-width: 520px;
      margin-bottom: 0;
    }

    .hero-search-box {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-surface);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-full);
      padding: 6px 6px 6px 16px;
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
    }

    .hero-search-box:focus-within {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
    }

    .search-submit-btn {
      flex-shrink: 0;
      background: var(--primary-gradient);
      color: #ffffff;
      border: none;
      border-radius: var(--radius-full);
      padding: 8px 20px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: var(--transition);
    }

    .search-submit-btn:hover {
      filter: brightness(1.08);
      transform: translateY(-1px);
    }

    .search-submit-btn:active {
      transform: translateY(0);
    }

    .search-icon {
      font-size: 16px;
    }

    .hero-search-input {
      border: none;
      background: none;
      outline: none;
      width: 100%;
      font-size: 14px;
      font-family: inherit;
      color: var(--text-primary);
    }

    .clear-search {
      background: none;
      border: none;
      color: var(--text-light);
      cursor: pointer;
      font-size: 14px;
    }

    .category-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .chip-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      padding: 6px 16px;
      border-radius: var(--radius-full);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    .chip-btn:hover {
      border-color: var(--primary);
      color: var(--primary);
    }

    .chip-active {
      background: var(--primary);
      color: #ffffff !important;
      border-color: var(--primary);
    }

    .blog-content-section {
      padding-top: 24px;
      padding-bottom: 40px;
    }

    .tag-filter-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 12px 20px;
      border-radius: var(--radius-md);
      margin-bottom: 24px;
      animation: fadeIn 0.3s ease-out;
    }
    .tag-filter-icon { font-size: 20px; }
    .tag-filter-text { font-size: 14px; color: #1e3a8a; flex: 1; }
    
    .btn-clear-filter {
      background: #ffffff;
      border: 1px solid #bfdbfe;
      color: #1e3a8a;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);
    }
    .btn-clear-filter:hover { background: #dbeafe; }

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
      margin-top: 2px;
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
      text-decoration: none;
      cursor: pointer;
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
      letter-spacing: 0.3px;
      text-transform: uppercase;
      margin-right: 6px;
    }

    .new-badge-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 4px rgba(16, 185, 129, 0.6);
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

    .post-category {
      color: var(--primary);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
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
      border: none;
      border-radius: var(--radius-sm);
      text-decoration: none;
      cursor: pointer;
      transition: var(--transition);
    }
    .tag-link:hover {
      background: var(--primary-light);
      color: var(--primary);
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

    .post-title {
      color: var(--text-primary);
    }

    .post-card:hover .post-title {
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

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 36px;
      flex-wrap: wrap;
    }

    .page-btn {
      min-width: 38px;
      height: 38px;
      padding: 0 10px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--bg-surface);
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: var(--transition);
    }

    .page-btn:hover:not(:disabled) {
      border-color: var(--primary);
      color: var(--primary);
    }

    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .page-active {
      background: var(--primary);
      border-color: var(--primary);
      color: #ffffff !important;
    }

    .page-nav {
      font-weight: 600;
    }

    .newsletter-section {
      padding: 20px 0 48px 0;
    }

    .newsletter-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
      padding: 28px 32px;
    }

    .newsletter-badge {
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      color: var(--primary);
      background: var(--primary-light);
      padding: 4px 12px;
      border-radius: var(--radius-full);
      margin-bottom: 10px;
    }

    .newsletter-title {
      font-size: 20px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0 0 6px 0;
    }

    .newsletter-desc {
      font-size: 13px;
      color: var(--text-secondary);
      max-width: 480px;
      margin: 0;
    }

    .newsletter-form {
      display: flex;
      gap: 10px;
      flex-shrink: 0;
    }

    .newsletter-thanks {
      font-size: 14px;
      font-weight: 700;
      color: var(--success, #10b981);
    }

  `]
})
export class BlogHomeComponent implements OnInit {
  private blogService = inject(BlogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  searchQuery = signal<string>('');
  fixedType = signal<'Blog' | 'Koseyazisi'>('Blog');
  currentTag = signal<string | null>(null);
  loading = signal<boolean>(false);
  loadError = signal<string | null>(null);

  posts = signal<BlogPost[]>([]);

  readonly pageSize = 9;
  page = signal<number>(1);
  totalCount = signal<number>(0);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const windowSize = 5;
    let start = Math.max(1, current - Math.floor(windowSize / 2));
    const end = Math.min(total, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);

    const numbers: number[] = [];
    for (let p = start; p <= end; p++) numbers.push(p);
    return numbers;
  });

  ngOnInit() {
    const routeType = this.route.snapshot.data['fixedType'];
    this.fixedType.set(routeType === 'Koseyazisi' ? 'Koseyazisi' : 'Blog');
    
    this.route.queryParams.subscribe(params => {
      const tag = params['tag'];
      if (tag) {
        this.currentTag.set(tag);
      } else {
        this.currentTag.set(null);
      }
      this.page.set(1);
      this.loadPosts();
    });
  }

  loadPosts() {
    this.loading.set(true);
    this.loadError.set(null);

    this.blogService.getAllPaged(
      'Published',
      this.fixedType(),
      this.searchQuery().trim() || undefined,
      this.page(),
      this.pageSize,
      this.currentTag() || undefined
    ).subscribe({
      next: ({ posts, totalCount }) => {
        this.posts.set(posts);
        this.totalCount.set(totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Yazılar backend\'den alınamadı. API\'nin çalıştığından emin olun.');
        this.loading.set(false);
      }
    });
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages() || p === this.page()) return;
    this.page.set(p);
    this.loadPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  submitSearch() {
    this.page.set(1);
    this.loadPosts();
  }

  clearSearch() {
    this.searchQuery.set('');
    this.page.set(1);
    this.loadPosts();
  }

  clearTagFilter() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tag: null },
      queryParamsHandling: 'merge'
    });
  }

  goToTag(event: Event, tag: string) {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tag },
      queryParamsHandling: 'merge'
    });
  }

  newsletterEmail = '';
  newsletterSubscribed = signal<boolean>(false);

  subscribeNewsletter() {
    if (!this.newsletterEmail.trim()) return;
    this.newsletterSubscribed.set(true);
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
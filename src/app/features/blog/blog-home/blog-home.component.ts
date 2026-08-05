import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BlogPost } from '../../../core/models/blog.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-blog-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Hero Banner -->
    <section class="hero-section">
      <div class="container hero-container">
        <div class="hero-tag">
          <span>✨</span>
          <span>Modern Yayıncılık & Kimlik Platformu</span>
        </div>
        <h1 class="hero-title">
          Fikirlerin, Teknolojinin ve <br/>
          <span class="text-gradient">Köşe Yazılarının</span> Buluşma Noktası
        </h1>
        <p class="hero-subtitle">
          Mikroservis mimarisiyle güçlendirilmiş güvenli auth altyapısı, ferah okuma deneyimi ve seçkin yazarlar.
        </p>

        <!-- Search Bar -->
        <div class="hero-search-wrapper">
          <div class="hero-search-box">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              class="hero-search-input"
              [(ngModel)]="searchQuery"
              placeholder="Makale, köşe yazısı veya yazar ara..."
            />
            @if (searchQuery()) {
              <button class="clear-search" (click)="searchQuery.set('')">✕</button>
            }
          </div>
        </div>

        <!-- Category Filter Chips -->
        <div class="category-chips">
          @for (cat of categories; track cat) {
            <button
              class="chip-btn"
              [class.chip-active]="selectedCategory() === cat"
              (click)="selectedCategory.set(cat)"
            >
              {{ cat }}
            </button>
          }
        </div>
      </div>
    </section>

    <!-- Main Content Area -->
    <section class="container blog-content-section">
      <!-- Section Header -->
      <div class="section-header">
        <div>
          <h2 class="section-title">Öne Çıkan & Güncel Yazılar</h2>
          <p class="section-subtitle">Toplam {{ filteredPosts().length }} yayın bulundu</p>
        </div>
        @if (authService.isAuthor()) {
          <a routerLink="/create-post" class="btn btn-primary btn-sm">
            <span>✍️</span> Yeni Yazı Ekle
          </a>
        }
      </div>

      <!-- Articles Grid -->
      <div class="posts-grid">
        @for (post of filteredPosts(); track post.id) {
          <article class="post-card card">
            <div class="post-cover-wrapper">
              <img [src]="post.coverImageUrl" [alt]="post.title" class="post-cover" />
              <span class="post-type-badge" [class.badge-column]="post.type === 'Column'">
                {{ post.type === 'Column' ? '✍️ Köşe Yazısı' : '📄 Blog' }}
              </span>
            </div>

            <div class="post-body">
              <div class="post-meta-top">
                <span class="post-category">{{ post.category }}</span>
                <span class="post-read-time">⏱️ {{ post.readTimeMinutes }} dk okuma</span>
              </div>

              <h3 class="post-title">
                <a [routerLink]="['/post', post.id]">{{ post.title }}</a>
              </h3>

              <p class="post-summary">{{ post.summary }}</p>

              <div class="post-footer">
                <div class="post-author">
                  <img [src]="post.authorAvatar" [alt]="post.authorName" class="author-img" />
                  <div class="author-info">
                    <span class="author-name">{{ post.authorName }}</span>
                    <span class="author-role">{{ post.authorRole }}</span>
                  </div>
                </div>

                <a [routerLink]="['/post', post.id]" class="read-more-btn">
                  Oku →
                </a>
              </div>
            </div>
          </article>
        }
      </div>

      <!-- Empty State -->
      @if (filteredPosts().length === 0) {
        <div class="empty-state card">
          <div class="empty-icon">🔍</div>
          <h3>Aradığınız kriterde yazı bulunamadı</h3>
          <p>Farklı bir arama kelimesi deneyebilir veya kategori filtresini sıfırlayabilirsiniz.</p>
          <button class="btn btn-secondary btn-sm" (click)="searchQuery.set(''); selectedCategory.set('Tümü')">
            Filtreleri Temizle
          </button>
        </div>
      }
    </section>

    <!-- Newsletter CTA -->
    <section class="container newsletter-section">
      <div class="newsletter-card card">
        <div class="newsletter-content">
          <span class="newsletter-badge">📬 Haftalık Bülten</span>
          <h2 class="newsletter-title">Yeni Yazıları ve Gelişmeleri Kaçırmayın</h2>
          <p class="newsletter-desc">En güncel teknoloji ve köşe yazılarını her pazartesi sabahı e-posta kutunuza ulaştıralım.</p>
        </div>
        <div class="newsletter-form">
          <input type="email" placeholder="E-posta adresiniz..." class="form-control" />
          <button class="btn btn-primary" (click)="subscribeNewsletter()">Abone Ol</button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero-section {
      background: linear-gradient(180deg, #ffffff 0%, var(--bg-main) 100%);
      border-bottom: 1px solid var(--border);
      padding: 60px 0 40px 0;
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
      margin-bottom: 20px;
    }

    .hero-title {
      font-size: 42px;
      font-weight: 800;
      line-height: 1.2;
      color: var(--text-primary);
      margin-bottom: 16px;
      letter-spacing: -1px;
    }

    @media (max-width: 768px) {
      .hero-title { font-size: 30px; }
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
      margin-bottom: 30px;
      line-height: 1.6;
    }

    .hero-search-wrapper {
      width: 100%;
      max-width: 520px;
      margin-bottom: 24px;
    }

    .hero-search-box {
      position: relative;
      display: flex;
      align-items: center;
      background: var(--bg-surface);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-full);
      padding: 6px 16px;
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
    }

    .hero-search-box:focus-within {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
    }

    .search-icon {
      font-size: 16px;
      margin-right: 8px;
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
      padding-top: 40px;
      padding-bottom: 40px;
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

    .badge-column {
      background: rgba(124, 58, 237, 0.85);
    }

    .post-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .post-meta-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      margin-bottom: 8px;
    }

    .post-category {
      color: var(--primary);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
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
      justify-content: space-between;
      border-top: 1px solid var(--border);
      padding-top: 14px;
    }

    .post-author {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .author-img {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      object-fit: cover;
    }

    .author-info {
      display: flex;
      flex-direction: column;
    }

    .author-name {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .author-role {
      font-size: 11px;
      color: var(--text-muted);
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

    .newsletter-section {
      margin-top: 20px;
      margin-bottom: 40px;
    }

    .newsletter-card {
      background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
      border: 1.5px solid var(--border);
      padding: 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 40px;
    }

    @media (max-width: 768px) {
      .newsletter-card {
        flex-direction: column;
        text-align: center;
      }
    }

    .newsletter-badge {
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 8px;
    }

    .newsletter-title {
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 8px;
    }

    .newsletter-desc {
      font-size: 14px;
      color: var(--text-secondary);
      max-width: 500px;
    }

    .newsletter-form {
      display: flex;
      gap: 10px;
      width: 100%;
      max-width: 420px;
    }

    @media (max-width: 480px) {
      .newsletter-form {
        flex-direction: column;
      }
    }
  `]
})
export class BlogHomeComponent {
  authService = inject(AuthService);

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('Tümü');

  categories: string[] = ['Tümü', 'Köşe Yazıları', 'Teknoloji', 'Mikroservis & .NET', 'Yapay Zeka', 'Tasarım'];

  posts = signal<BlogPost[]>([
    {
      id: '1',
      title: 'Mikroservis Mimarilerinde Tekil Oturum ve JWT Güvenliği',
      summary: 'Birden fazla istemcinin ve mikroservisin haberleştiği ortamlarda kullanıcı kimliğinin token tabanlı korunması ve güvenlik optimizasyonları.',
      type: 'Column',
      category: 'Mikroservis & .NET',
      coverImageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
      authorName: 'Saliha Çiçek',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      authorRole: 'Yazılım Mühendisi',
      readTimeMinutes: 6,
      publishedAt: '2026-08-04',
      viewCount: 1420,
      isRestricted: false
    },
    {
      id: '2',
      title: 'Modern Web Geliştirmede Angular 19 ve Signal Devrimi',
      summary: 'Zone.js bağımsız reaktivite, signal tabanlı state yönetimi ve standalone mimari ile modern frontend tasarımının geleceği.',
      type: 'Blog',
      category: 'Teknoloji',
      coverImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
      authorName: 'Berkay Bey',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      authorRole: 'Takım Lideri',
      readTimeMinutes: 4,
      publishedAt: '2026-08-03',
      viewCount: 980,
      isRestricted: true
    },
    {
      id: '3',
      title: 'Kurumsal Sistemlerde PostgreSQL ve EF Core Performans İpuçları',
      summary: 'Büyük ölçekli veri tabanlarında indeksleme stratejileri, bağlantı havuzları ve transaction yönetimi üzerine deneyimler.',
      type: 'Column',
      category: 'Mikroservis & .NET',
      coverImageUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80',
      authorName: 'Saliha Çiçek',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      authorRole: 'Yazılım Mühendisi',
      readTimeMinutes: 8,
      publishedAt: '2026-08-02',
      viewCount: 2150,
      isRestricted: false
    },
    {
      id: '4',
      title: 'Ferah ve Minimalist Kullanıcı Deneyimi Tasarlamak',
      summary: 'Beyaz alan kullanımı, tipografi hiyerarşisi ve modern tasarım sistemlerinde renk uyumunun kullanıcı psikolojisine etkileri.',
      type: 'Blog',
      category: 'Tasarım',
      coverImageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
      authorName: 'Lumina Editör',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      authorRole: 'Kıdemli Tasarımcı',
      readTimeMinutes: 5,
      publishedAt: '2026-08-01',
      viewCount: 1640,
      isRestricted: false
    }
  ]);

  filteredPosts = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.posts().filter(p => {
      const matchCat = (cat === 'Tümü') || 
                       (cat === 'Köşe Yazıları' && p.type === 'Column') ||
                       (p.category.toLowerCase().includes(cat.toLowerCase()));

      const matchQuery = !query ||
                         p.title.toLowerCase().includes(query) ||
                         p.summary.toLowerCase().includes(query) ||
                         p.authorName.toLowerCase().includes(query);

      return matchCat && matchQuery;
    });
  });

  subscribeNewsletter() {
    alert('Bültene başarıyla abone oldunuz! Teşekkür ederiz.');
  }
}

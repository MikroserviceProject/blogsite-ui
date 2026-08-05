import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BlogPost } from '../../../core/models/blog.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container article-page">
      <!-- Back Link -->
      <a routerLink="/" class="back-link">← Tüm Yazılara Dön</a>

      <article class="article-container card">
        <!-- Header -->
        <header class="article-header">
          <div class="article-meta">
            <span class="badge" [class.badge-primary]="post()?.type === 'Blog'" [class.badge-author]="post()?.type === 'Column'">
              {{ post()?.type === 'Column' ? '✍️ Köşe Yazısı' : '📄 Blog Makalesi' }}
            </span>
            <span class="article-cat">{{ post()?.category }}</span>
            <span class="article-date">• {{ post()?.publishedAt }}</span>
            <span class="article-read">• ⏱️ {{ post()?.readTimeMinutes }} dk okuma</span>
          </div>

          <h1 class="article-title">{{ post()?.title }}</h1>

          <!-- Author Info Card -->
          <div class="article-author-card">
            <img [src]="post()?.authorAvatar" [alt]="post()?.authorName" class="author-img-lg" />
            <div class="author-details">
              <h4 class="author-name-lg">{{ post()?.authorName }}</h4>
              <p class="author-role-lg">{{ post()?.authorRole }} • Lumina Katkı Sağlayıcısı</p>
            </div>
          </div>
        </header>

        <!-- Cover Image -->
        <div class="article-cover">
          <img [src]="post()?.coverImageUrl" [alt]="post()?.title" />
        </div>

        <!-- Article Content -->
        <div class="article-body">
          <p class="lead-text">
            {{ post()?.summary }}
          </p>

          <p>
            Yazılım geliştirme süreçlerinde kimlik doğrulama (Authentication) ve yetkilendirme (Authorization) sistemleri, 
            mikroservis mimarilerinin en kritik omurgasını teşkil eder. Dağıtık yapılarda tekil oturum kontrolü ve 
            stateless JWT mimarisi sayesinde sunucu yükü minimum seviyeye indirgenirken, kullanıcı güvenliği en üst seviyeye çıkarılır.
          </p>

          <h2>Merkezi Auth Servisi Nasıl Çalışır?</h2>
          <p>
            İstemci (Angular veya mobil uygulama), kullanıcı adı ve şifresi ile kimlik doğrulama servisine istek gönderir. 
            Servis, PostgreSQL veri tabanındaki hash'lenmiş şifrelerle eşleşmeyi kontrol eder. Başarılı doğrulama neticesinde 
            içerisinde kullanıcı rolü (Admin, Author, User) barındıran imzalı bir JWT token istemciye döner.
          </p>

          <!-- Restricted / Locked Area if user is not logged in -->
          @if (post()?.isRestricted && !authService.isLoggedIn()) {
            <div class="restricted-box">
              <div class="lock-icon">🔒</div>
              <h3 class="lock-title">Bu Yazının Devamı Kayıtlı Kullanıcılara Özeldir</h3>
              <p class="lock-desc">
                Teknoloji dünyasındaki derinlemesine analizleri ve özel köşe yazılarını ücretsiz okumak için Lumina hesabınıza giriş yapın.
              </p>
              <div class="lock-actions">
                <a routerLink="/login" class="btn btn-primary btn-lg">🔐 Giriş Yap</a>
                <a routerLink="/register" class="btn btn-secondary btn-lg">✨ Ücretsiz Kayıt Ol</a>
              </div>
            </div>
          } @else {
            <h2>Frontend Entegrasyonu ve Güvenlik İlkeleri</h2>
            <p>
              Angular tarafında oluşturulan <code>authInterceptor</code> mekanizması, istemciden çıkan tüm HTTP isteklerinin 
              başlığına (Headers) otomatik olarak Bearer token'ı enjekte eder. Böylece her istek için ayrı ayrı token ekleme 
              zahmeti ortadan kalkar ve mimari tamamen modüler bir yapıya kavuşur.
            </p>

            <blockquote>
              "İyi bir mimari, güvenlikten ve kullanıcı deneyiminden ödün vermeden ölçeklenebilen mimaridir."
            </blockquote>

            <p>
              Sonuç olarak, .NET 10 Web API ve Angular 19 gibi güncel teknolojilerle geliştirilen bu sistem, 
              hem frontend hem backend ekiplerinin bağımsız çalışmasını mümkün kılan harika bir iş birliği zemini sunmaktadır.
            </p>
          }
        </div>
      </article>
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
      margin-bottom: 16px;
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

    .article-author-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 0;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      margin-bottom: 28px;
    }

    .author-img-lg {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }

    .author-name-lg {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .author-role-lg {
      font-size: 13px;
      color: var(--text-muted);
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
    }

    .lead-text {
      font-size: 18px;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 24px;
      line-height: 1.6;
    }

    .article-body p {
      margin-bottom: 20px;
    }

    .article-body h2 {
      font-size: 22px;
      font-weight: 800;
      color: var(--text-primary);
      margin-top: 36px;
      margin-bottom: 16px;
    }

    blockquote {
      border-left: 4px solid var(--primary);
      padding: 16px 20px;
      background: var(--primary-light);
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
      font-style: italic;
      color: var(--text-primary);
      margin: 28px 0;
      font-weight: 500;
    }

    .restricted-box {
      background: linear-gradient(180deg, rgba(255,255,255,0) 0%, var(--bg-subtle) 40%, var(--bg-surface) 100%);
      border: 1.5px dashed var(--border);
      border-radius: var(--radius-lg);
      padding: 40px 24px;
      text-align: center;
      margin-top: 30px;
    }

    .lock-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }

    .lock-title {
      font-size: 20px;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .lock-desc {
      font-size: 14px;
      color: var(--text-secondary);
      max-width: 480px;
      margin: 0 auto 24px auto;
    }

    .lock-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
  `]
})
export class BlogDetailComponent {
  private route = inject(ActivatedRoute);
  authService = inject(AuthService);

  post = signal<BlogPost | null>({
    id: '2',
    title: 'Modern Web Geliştirmede Angular 19 ve Signal Devrimi',
    summary: 'Zone.js bağımsız reaktivite, signal tabanlı state yönetimi ve standalone mimari ile modern frontend tasarımının geleceği.',
    type: 'Blog',
    category: 'Teknoloji',
    coverImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
    authorName: 'Berkay Bey',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    authorRole: 'Takım Lideri',
    readTimeMinutes: 4,
    publishedAt: '2026-08-03',
    viewCount: 980,
    isRestricted: true
  });
}

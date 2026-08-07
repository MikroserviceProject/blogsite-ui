import { Component, inject, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogPost } from '../../core/models/blog.model';
import { BlogService } from '../../core/services/blog.service';

@Component({
  selector: 'app-internship',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container internship-page">
      <div class="internship-grid">
        <!-- Left: Blog posts auto-scroll -->
        <aside class="side-column">
          <h4 class="side-title">📄 Bloglar</h4>
          @if (blogPosts().length > 0) {
            <div class="scroll-viewport" #blogViewport (mousemove)="onBlogMouseMove($event)">
              <div class="scroll-track" #blogTrack [style.transform]="'translateY(' + blogScrollOffset() + 'px)'">
                @for (post of blogPosts(); track post.id) {
                  <a [routerLink]="['/post', post.id]" class="mini-card">
                    @if (post.photoUrl) {
                      <img [src]="photoSrc(post.photoUrl)" [alt]="post.title" class="mini-cover" />
                    } @else {
                      <div class="mini-cover mini-cover-placeholder">📄</div>
                    }
                    <div class="mini-overlay">
                      <span class="mini-title">{{ post.title }}</span>
                      <span class="mini-excerpt">{{ excerptPreview(post.content) }}</span>
                    </div>
                    <span class="mini-read-circle">Oku</span>
                  </a>
                }
              </div>
            </div>
          } @else {
            <p class="side-empty">Henüz blog yazısı yok.</p>
          }
        </aside>

        <!-- Center: static internship story -->
        <main class="center-column">
          <article class="internship-article card">
            <h1>🚀 Bir Stajyer Günlüğü: PostgreSQL, .NET ve Angular ile Full-Stack Blog Projesi</h1>

            <p>
              Yazılım dünyasında teorik bilgi tek başına yeterli olmuyor; işin içine girip kendi projenizi ekipçe uçtan uca inşa ettiğinizde taşlar yerine oturuyor. Bizim için de tam olarak böyle, birlikte harika tecrübeler edindiğimiz bir staj süreci geride kaldı!
            </p>

            <p>
              Bu staj boyunca sadece var olan bir koda ekleme yapmadık; veri tabanından başlayıp ön yüze kadar uzanan tam teşekküllü bir Blog Sitesi geliştirdik. Peki bu süreçte mutfakta neler pişirdik, iki kişi olarak hangi teknolojilerle tanıştık ve nasıl bir görev paylaşımı yaptık? Gel birlikte bakalım.
            </p>

            <h2>🗄️ 1. Mutfağın Temeli: PostgreSQL ve pgAdmin 4</h2>
            <p>
              Bir projenin kalbi veridir. Blog sitemizin kullanıcılarını, yazılarını, yorumlarını ve kategorilerini düzenli tutmak için ilişkisel veri tabanı dünyasına adım attık:
            </p>
            <ul>
              <li>pgAdmin 4 arayüzü üzerinden veri tabanı şemalarını birlikte tasarladık.</li>
              <li>Tablolar arasındaki ilişkileri kurarken veri bütünlüğünü ve sorgu performansını ön planda tuttuk.</li>
              <li>SQL sorgularıyla veri tabanı yönetiminin inceliklerini doğrudan tecrübe ettik.</li>
            </ul>

            <h2>⚙️ 2. Motoru Çalıştırmak: .NET ile Güçlü Backend</h2>
            <p>
              Verileri topladık ama bunları frontend'e güvenle ve hızlıca sunmak gerekiyordu. Burada imdadımıza .NET (C#) yetişti:
            </p>
            <ul>
              <li>RESTful API mimarisiyle ön yüzün konuşabileceği uç noktalar (endpoints) tasarladık.</li>
              <li>Güvenli, katmanlı ve sürdürülebilir bir backend yapısı oluşturmayı öğrendik.</li>
              <li>Veri tabanı ile API arasındaki köprüyü kurarak CRUD (Ekle, Oku, Güncelle, Sil) operasyonlarını sorunsuz çalışır hale getirdik.</li>
            </ul>

            <h2>🎨 3. Sahne Önü: Angular ile Dinamik Frontend</h2>
            <p>
              Veri tabanında saklanan ve .NET API ile sunulan verileri kullanıcıya şık bir şekilde gösterme vakti! İşin frontend tarafında Angular kullandık:
            </p>
            <ul>
              <li>Bileşen Tabanlı (Component-based) mimari sayesinde tekrar kullanılabilir UI elemanları tasarladık.</li>
              <li>.NET tarafından gelen verileri Angular servisleri (HttpClient) ile çekip kullanıcı arayüzüne bağladık.</li>
              <li>TypeScript ve RxJS kullanarak asenkron veri akışlarını yönettik ve reaktif bir kullanıcı deneyimi sağladık.</li>
            </ul>

            <h2>🌟 Günün Sonu: Ne Kazandık?</h2>
            <p>
              Bu staj projesi bizim için sadece "kod yazmak" anlamına gelmedi. Bir projenin fikir aşamasından, veri tabanı katmanına (PostgreSQL / pgAdmin 4), sunucu tarafındaki mantığından (.NET) ve kullanıcının ekranda gördüğü reaktif dünyaya (Angular) kadar iki kişilik bir ekip olarak nasıl uyumla geliştirileceğini bizzat yaşayarak öğrendik.
            </p>
            <p>
              Full-stack geliştirme yolculuğumuzda harika bir temel olan bu projeyi başarıyla tamamlamış olmanın heyecanını yaşıyoruz! ✨
            </p>
          </article>
        </main>

        <!-- Right: Köşe yazıları auto-scroll -->
        <aside class="side-column">
          <h4 class="side-title">✍️ Köşe Yazıları</h4>
          @if (columnPosts().length > 0) {
            <div class="scroll-viewport" #columnViewport (mousemove)="onColumnMouseMove($event)">
              <div class="scroll-track" #columnTrack [style.transform]="'translateY(' + columnScrollOffset() + 'px)'">
                @for (post of columnPosts(); track post.id) {
                  <a [routerLink]="['/post', post.id]" class="mini-card mini-card-column">
                    <span class="mini-quote-icon">❝</span>
                    <span class="mini-title">{{ post.title }}</span>
                    <span class="mini-excerpt">{{ excerptPreviewLong(post.content) }}</span>
                    <span class="mini-read-circle">Oku</span>
                  </a>
                }
              </div>
            </div>
          } @else {
            <p class="side-empty">Henüz köşe yazısı yok.</p>
          }
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .internship-page {
      padding-top: 20px;
      padding-bottom: 60px;
    }


    .internship-grid {
      display: grid;
      grid-template-columns: 1fr 2.2fr 0.85fr;
      gap: 24px;
      align-items: start;
    }

    @media (max-width: 980px) {
      .internship-grid {
        grid-template-columns: 1fr;
      }
    }

    .side-column {
      position: sticky;
      top: 90px;
    }

    @media (max-width: 980px) {
      .side-column {
        position: static;
      }
    }

    .side-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 12px;
    }

    .side-empty {
      font-size: 13px;
      color: var(--text-muted);
    }

    .scroll-viewport {
      height: 65vh;
      overflow: hidden;
      position: relative;
      -webkit-mask-image: linear-gradient(to bottom, transparent, black 8%, black 92%, transparent);
      mask-image: linear-gradient(to bottom, transparent, black 8%, black 92%, transparent);
    }

    @media (max-width: 980px) {
      .scroll-viewport {
        height: 320px;
      }
    }

    .scroll-track {
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: transform 0.15s ease-out;
      will-change: transform;
    }

    .scroll-viewport {
      cursor: ns-resize;
    }

    .mini-card {
      position: relative;
      display: block;
      aspect-ratio: 1 / 1;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
      text-decoration: none;
      transition: var(--transition);
    }

    .mini-card:hover {
      border-color: var(--primary);
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .mini-cover {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .mini-cover-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      background: var(--bg-subtle);
    }

    .mini-overlay {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 14px;
      padding-right: 44px;
      padding-top: 40px;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.35) 45%, transparent 100%);
    }

    .mini-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .mini-overlay .mini-title,
    .mini-overlay .mini-excerpt {
      color: #ffffff;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85), 0 2px 10px rgba(0, 0, 0, 0.6);
    }

    .mini-read-circle {
      position: absolute;
      right: 10px;
      bottom: 10px;
      padding: 4px 11px;
      border-radius: var(--radius-full);
      background: var(--primary);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.2px;
      transition: var(--transition);
    }

    .mini-card:hover .mini-read-circle {
      transform: scale(1.08);
    }

    .mini-card-column {
      aspect-ratio: auto;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      padding: 14px;
      padding-right: 44px;
      padding-bottom: 40px;
      text-align: left;
      background: var(--bg-surface);
      border: 1px solid var(--border);
    }

    .mini-quote-icon {
      font-family: Georgia, serif;
      font-size: 30px;
      font-weight: 700;
      line-height: 1;
      color: var(--primary);
    }

    .mini-card-column .mini-title {
      color: var(--text-primary);
      font-size: 13px;
      -webkit-line-clamp: 2;
    }

    .mini-card-column .mini-excerpt {
      -webkit-line-clamp: 4;
    }

    .mini-excerpt {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .mini-card-column:hover {
      border-color: var(--primary);
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .internship-article {
      padding: 40px;
      line-height: 1.8;
      color: var(--text-secondary);
    }

    @media (max-width: 640px) {
      .internship-article { padding: 24px; }
    }

    .internship-article h1 {
      font-size: 28px;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 20px;
      line-height: 1.3;
    }

    .internship-article h2 {
      font-size: 20px;
      font-weight: 800;
      color: var(--text-primary);
      margin-top: 32px;
      margin-bottom: 14px;
    }

    .internship-article p {
      margin-bottom: 16px;
      font-size: 15px;
    }

    .internship-article ul {
      margin: 0 0 16px 0;
      padding-left: 20px;
    }

    .internship-article li {
      margin-bottom: 8px;
      font-size: 15px;
    }
  `]
})
export class InternshipComponent implements OnInit {
  private blogService = inject(BlogService);

  @ViewChild('blogViewport') blogViewportRef?: ElementRef<HTMLDivElement>;
  @ViewChild('blogTrack') blogTrackRef?: ElementRef<HTMLDivElement>;
  @ViewChild('columnViewport') columnViewportRef?: ElementRef<HTMLDivElement>;
  @ViewChild('columnTrack') columnTrackRef?: ElementRef<HTMLDivElement>;

  blogPosts = signal<BlogPost[]>([]);
  columnPosts = signal<BlogPost[]>([]);

  blogScrollOffset = signal(0);
  columnScrollOffset = signal(0);

  ngOnInit() {
    this.blogService.getAll('Published', 'Blog').subscribe({
      next: (posts) => this.blogPosts.set(posts),
      error: () => this.blogPosts.set([])
    });

    this.blogService.getAll('Published', 'Koseyazisi').subscribe({
      next: (posts) => this.columnPosts.set(posts),
      error: () => this.columnPosts.set([])
    });
  }

  photoSrc(photoUrl: string): string {
    return `https://localhost:7296${photoUrl}`;
  }

  excerptPreview(content: string): string {
    return content.length > 70 ? content.slice(0, 70) + '...' : content;
  }

  excerptPreviewLong(content: string): string {
    return content.length > 160 ? content.slice(0, 160) + '...' : content;
  }

  onBlogMouseMove(event: MouseEvent) {
    this.updateScrollOffset(event, this.blogViewportRef, this.blogTrackRef, this.blogScrollOffset);
  }

  onColumnMouseMove(event: MouseEvent) {
    this.updateScrollOffset(event, this.columnViewportRef, this.columnTrackRef, this.columnScrollOffset);
  }

  private updateScrollOffset(
    event: MouseEvent,
    viewportRef: ElementRef<HTMLDivElement> | undefined,
    trackRef: ElementRef<HTMLDivElement> | undefined,
    offsetSignal: ReturnType<typeof signal<number>>
  ) {
    if (!viewportRef || !trackRef) return;

    const viewportRect = viewportRef.nativeElement.getBoundingClientRect();
    const trackHeight = trackRef.nativeElement.scrollHeight;
    const viewportHeight = viewportRect.height;
    const maxScroll = Math.max(0, trackHeight - viewportHeight);

    if (maxScroll === 0) {
      offsetSignal.set(0);
      return;
    }

    const relativeY = (event.clientY - viewportRect.top) / viewportHeight;
    const clamped = Math.min(1, Math.max(0, relativeY));
    offsetSignal.set(-clamped * maxScroll);
  }
}

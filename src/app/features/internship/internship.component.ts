import { Component, inject, signal, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { BlogPost } from '../../core/models/blog.model';
import { PublicUserProfile } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { BlogService } from '../../core/services/blog.service';
import { HistoryComponent } from '../history/history.component';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-internship',
  standalone: true,
  imports: [CommonModule, RouterLink, HistoryComponent],
  templateUrl: './internship.component.html',
  styleUrl: './internship.component.css'
})
export class InternshipComponent implements OnInit, AfterViewInit, OnDestroy {
  private blogService = inject(BlogService);
  authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('blogViewport') blogViewportRef?: ElementRef<HTMLDivElement>;
  @ViewChild('columnViewport') columnViewportRef?: ElementRef<HTMLDivElement>;

  blogPosts = signal<BlogPost[]>([]);
  columnPosts = signal<BlogPost[]>([]);
  private authorProfiles = signal<Record<string, PublicUserProfile>>({});
  currentTag = signal<string | null>(null);

  private blogPaused = false;
  private columnPaused = false;
  private blogRafId?: number;
  private columnRafId?: number;
  private columnInitialized = false;
  private blogLastTimestamp?: number;
  private columnLastTimestamp?: number;

  // Piksel/saniye cinsinden hız — requestAnimationFrame ekranın Hz'ine göre farklı sıklıkta
  // tetiklendiği için (60Hz Windows'ta, 120Hz bazı Mac'lerde), sabit piksel/frame yerine
  // geçen gerçek süreye göre kaydırma yapılıyor. Böylece hız her cihazda aynı kalıyor.
  // İki sütun da aynı hızda kaysın diye tek bir ortak değer kullanılıyor.
  private readonly scrollSpeedPerSecond = 36;

  private readonly sideColumnPostCount = 10;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const tag = params['tag'];
      if (tag) {
        this.currentTag.set(tag);
      } else {
        this.currentTag.set(null);
      }
      this.loadPosts();
    });
  }

  loadPosts() {
    const tag = this.currentTag() || undefined;

    this.blogService.getAllPaged('Published', 'Blog', undefined, 1, this.sideColumnPostCount, tag).subscribe({
      next: ({ posts }) => {
        this.blogPosts.set(posts);
        this.loadAuthorProfiles(posts);
      },
      error: () => this.blogPosts.set([])
    });

    this.blogService.getAllPaged('Published', 'Koseyazisi', undefined, 1, this.sideColumnPostCount, tag).subscribe({
      next: ({ posts }) => {
        this.columnPosts.set(posts);
        this.loadAuthorProfiles(posts);
      },
      error: () => this.columnPosts.set([])
    });
  }

  private loadAuthorProfiles(posts: BlogPost[]) {
    const known = this.authorProfiles();
    const missingIds = [...new Set(posts.map(p => p.authorId))].filter(id => id && !known[id]);

    for (const authorId of missingIds) {
      this.authService.getPublicProfile(authorId).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.authorProfiles.update(profiles => ({ ...profiles, [authorId]: res.data! }));
          }
        },
        error: () => {
          // Yazar bilgisi getirilemezse sessizce göz ardı edilir, baş harf/placeholder gösterilir.
        }
      });
    }
  }

  getAuthorProfile(authorId: string): PublicUserProfile | undefined {
    return this.authorProfiles()[authorId];
  }

  clearFilter() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tag: null },
      queryParamsHandling: 'merge'
    });
  }

  ngAfterViewInit() {
    this.blogRafId = requestAnimationFrame((ts) => this.autoScrollStep('blog', ts));
    this.columnRafId = requestAnimationFrame((ts) => this.autoScrollStep('column', ts));
  }

  ngOnDestroy() {
    if (this.blogRafId) cancelAnimationFrame(this.blogRafId);
    if (this.columnRafId) cancelAnimationFrame(this.columnRafId);
  }

  photoSrc(photoUrl: string): string {
    if (!photoUrl) return '';
    if (photoUrl.startsWith('http')) return photoUrl;
    return `${environment.blogApiUrl}${photoUrl}`;
  }

  excerptPreview(content: string): string {
    return content.length > 70 ? content.slice(0, 70) + '...' : content;
  }

  excerptPreviewLong(content: string): string {
    return content.length > 160 ? content.slice(0, 160) + '...' : content;
  }

  isNew(createdAt: string): boolean {
    const hoursSince = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    return hoursSince <= 24;
  }

  setPaused(which: 'blog' | 'column', paused: boolean) {
    if (which === 'blog') this.blogPaused = paused;
    else this.columnPaused = paused;
  }

  private autoScrollStep(which: 'blog' | 'column', timestamp: number) {
    const viewportRef = which === 'blog' ? this.blogViewportRef : this.columnViewportRef;
    const paused = which === 'blog' ? this.blogPaused : this.columnPaused;
    const lastTimestamp = which === 'blog' ? this.blogLastTimestamp : this.columnLastTimestamp;

    const deltaMs = lastTimestamp !== undefined ? timestamp - lastTimestamp : 0;
    if (which === 'blog') this.blogLastTimestamp = timestamp; else this.columnLastTimestamp = timestamp;

    if (viewportRef && !paused) {
      const el = viewportRef.nativeElement;
      const maxScroll = el.scrollHeight - el.clientHeight;
      const distance = this.scrollSpeedPerSecond * (deltaMs / 1000);

      if (maxScroll > 0) {
        if (which === 'column') {
          if (!this.columnInitialized) {
            el.scrollTop = maxScroll;
            this.columnInitialized = true;
          } else {
            el.scrollTop -= distance;
            if (el.scrollTop <= 0) {
              el.scrollTop = maxScroll;
            }
          }
        } else {
          el.scrollTop += distance;
          if (el.scrollTop >= maxScroll) {
            el.scrollTop = 0;
          }
        }
      }
    }

    const rafId = requestAnimationFrame((ts) => this.autoScrollStep(which, ts));
    if (which === 'blog') this.blogRafId = rafId; else this.columnRafId = rafId;
  }
}

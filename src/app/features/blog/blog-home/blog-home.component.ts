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
  templateUrl: './blog-home.component.html',
  styleUrl: './blog-home.component.css'
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
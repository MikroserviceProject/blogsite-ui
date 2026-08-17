import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { BlogPost } from '../../../core/models/blog.model';
import { BlogService } from '../../../core/services/blog.service';

@Component({
  selector: 'app-tag-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tag-detail.component.html',
  styleUrl: './tag-detail.component.css'
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

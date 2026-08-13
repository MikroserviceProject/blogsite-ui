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
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.css'
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

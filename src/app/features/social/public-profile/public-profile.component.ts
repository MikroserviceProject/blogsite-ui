import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SocialService, PublicUser, SocialStats } from '../../../core/services/social/social.service';
import { BlogService } from '../../../core/services/blog.service';
import { AuthService } from '../../../core/services/auth.service';
import { BlogPost } from '../../../core/models/blog.model';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './public-profile.component.html',
  styleUrls: ['./public-profile.component.css']
})
export class PublicProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private socialService = inject(SocialService);
  private blogService = inject(BlogService);
  private authService = inject(AuthService);

  profile: PublicUser | null = null;
  stats: SocialStats = { followersCount: 0, followingCount: 0 };
  posts: BlogPost[] = [];
  
  isFollowing = false;
  isOwnProfile = false;
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      if (username) {
        this.loadProfile(username);
      } else {
        this.error = 'Geçersiz profil bağlantısı.';
        this.isLoading = false;
      }
    });
  }

  private loadProfile(username: string): void {
    this.isLoading = true;
    this.error = null;
    
    this.socialService.getPublicProfile(username).subscribe({
      next: (response) => {
        if (response.success) {
          this.profile = response.data;
          this.checkOwnProfile();
          this.loadStats();
          this.loadPosts();
          
          if (!this.isOwnProfile && this.authService.isLoggedIn()) {
            this.checkFollowStatus();
          }
        } else {
          this.error = response.message || 'Profil bulunamadı.';
        }
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Profil yüklenirken bir hata oluştu.';
        this.isLoading = false;
      }
    });
  }

  private checkOwnProfile(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser && this.profile) {
      this.isOwnProfile = currentUser.id === this.profile.id;
    }
  }

  private loadStats(): void {
    if (!this.profile) return;
    this.socialService.getUserStats(this.profile.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.stats = res.data;
        }
      }
    });
  }

  private loadPosts(): void {
    if (!this.profile) return;
    this.blogService.getByAuthor(this.profile.id, 'Published').subscribe({
      next: (posts) => {
        this.posts = posts;
      }
    });
  }

  private checkFollowStatus(): void {
    if (!this.profile) return;
    this.socialService.checkFollowStatus(this.profile.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.isFollowing = res.data;
        }
      }
    });
  }

  toggleFollow(): void {
    if (!this.authService.isLoggedIn()) {
      // Eğer kullanıcı giriş yapmadıysa uyar, veya login sayfasına yönlendir
      alert('Takip edebilmek için giriş yapmalısınız.');
      return;
    }

    if (!this.profile) return;

    if (this.isFollowing) {
      this.socialService.unfollowUser(this.profile.id).subscribe({
        next: (res) => {
          if (res.success) {
            this.isFollowing = false;
            this.stats.followersCount--; // İyileştirilmiş UX için hemen düşür
          }
        }
      });
    } else {
      this.socialService.followUser(this.profile.id).subscribe({
        next: (res) => {
          if (res.success) {
            this.isFollowing = true;
            this.stats.followersCount++; // İyileştirilmiş UX için hemen artır
          }
        }
      });
    }
  }

  getProfileImageUrl(url: string | null): string {
    const avatarUrl = this.authService.getAvatarUrl(url);
    return avatarUrl ? avatarUrl : 'assets/images/default-avatar.png';
  }


  onAvatarError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none';
    imgElement.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="%23888" d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"/></svg>';
    imgElement.style.padding = '20px';
    imgElement.style.backgroundColor = 'var(--bg-hover)';
  }

  getPostImageUrl(path: string | undefined): string {
    return this.blogService.getPhotoUrl(path);
  }
}

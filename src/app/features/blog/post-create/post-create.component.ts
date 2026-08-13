import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { BlogService } from '../../../core/services/blog.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-post-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './post-create.component.html',
  styleUrl: './post-create.component.css'
})
export class PostCreateComponent implements OnInit, OnDestroy {
  toastService = inject(ToastService);
  blogService = inject(BlogService);
  authService = inject(AuthService);
  router = inject(Router);
  private route = inject(ActivatedRoute);

  title = '';
  content = '';
  tagsInputText = '';
  tagsArray = signal<string[]>([]);

  onTagKeydown(event: KeyboardEvent) {
    if (event.key === ',' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const val = this.tagsInputText.trim();
      if (val) {
        const cleanVal = val.replace(/,+$/, '').trim();
        if (cleanVal && !this.tagsArray().includes(cleanVal)) {
          this.tagsArray.update(tags => [...tags, cleanVal]);
        }
      }
      this.tagsInputText = '';
    }
  }

  removeTag(tagToRemove: string) {
    this.tagsArray.update(tags => tags.filter(t => t !== tagToRemove));
  }

  editingId = signal<number | null>(null);
  existingPhotoUrl = signal<string | null>(null);

  selectedFile = signal<File | null>(null);
  selectedFileName = signal<string>('');
  previewUrl = signal<string | null>(null);

  submitting = signal<boolean>(false);
  submitError = signal<string | null>(null);
  private saved = false;

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;

    const id = Number(idParam);
    if (isNaN(id)) return;

    this.editingId.set(id);
    this.blogService.getById(id).subscribe({
      next: (post) => {
        this.title = post.title;
        this.content = post.content;
        this.tagsArray.set(post.tags || []);
        this.existingPhotoUrl.set(post.photoUrl);
      },
      error: () => {
        this.toastService.warning('Yazı Bulunamadı', 'Düzenlenecek yazı yüklenemedi.');
        this.router.navigate(['/taslaklarim']);
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile.set(file);
      this.selectedFileName.set(file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      this.toastService.success('Fotoğraf Seçildi 📸', `${file.name} önizlemeye eklendi.`);
    }
  }

  onSubmit() {
    const status = 'Published';
    if (!this.title || !this.content) {
      this.toastService.warning('Eksik Alan', 'Lütfen başlık ve içerik alanlarını doldurunuz.');
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);

    const editingId = this.editingId();

    const parsedTags = this.tagsArray();

    if (editingId) {
      this.blogService.update(editingId, {
        title: this.title,
        content: this.content,
        status: status,
        photo: this.selectedFile(),
        tags: parsedTags
      }).subscribe({
        next: () => {
          this.saved = true;
          this.submitting.set(false);
          this.toastService.success('Yazı Yayında! ', 'Yazınız güncellendi ve yayınlandı.');
          this.router.navigate(['/']);
        },
        error: () => {
          this.submitting.set(false);
          this.submitError.set('Yazı güncellenemedi. Backend\'in çalıştığından emin olun.');
        }
      });
      return;
    }

    const type: 'Blog' | 'Koseyazisi' = this.selectedFile() ? 'Blog' : 'Koseyazisi';

    this.blogService.create({
      title: this.title,
      content: this.content,
      type: type,
      status: status,
      photo: this.selectedFile(),
      tags: parsedTags,
      authorId: this.authService.currentUser()?.id || ''
    }).subscribe({
      next: () => {
        this.saved = true;
        this.submitting.set(false);
        this.toastService.success('Yazı Yayında! ', 'Yazınız başarıyla yayınlandı ve listelendi.');
        this.router.navigate(['/']);
      },
      error: () => {
        this.submitting.set(false);
        this.submitError.set('Yazı kaydedilemedi. Backend\'in çalıştığından emin olun.');
      }
    });
  }

  ngOnDestroy() {
    // Auto-save disabled as drafts feature is removed.
  }

  photoSrc(photoUrl: string): string {
    return `https://localhost:7296${photoUrl}`;
  }
}

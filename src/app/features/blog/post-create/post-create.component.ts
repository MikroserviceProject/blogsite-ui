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
  pendingStatus = signal<'Draft' | 'Published' | null>(null);
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

  onSubmit(status: 'Draft' | 'Published' = 'Published') {
    if (!this.title || !this.content) {
      this.toastService.warning('Eksik Alan', 'Lütfen başlık ve içerik alanlarını doldurunuz.');
      return;
    }

    this.submitting.set(true);
    this.pendingStatus.set(status);
    this.submitError.set(null);

    const isPublish = status === 'Published';

    this.performSave(status).subscribe({
      next: () => {
        this.saved = true;
        this.submitting.set(false);
        this.pendingStatus.set(null);
        if (isPublish) {
          this.toastService.success('Yazı Yayında!', this.editingId() ? 'Yazınız güncellendi ve yayınlandı.' : 'Yazınız başarıyla yayınlandı ve listelendi.');
          this.router.navigate(['/']);
        } else {
          this.toastService.success('Taslak Kaydedildi', 'Yazınız taslak olarak kaydedildi, istediğiniz zaman devam edebilirsiniz.');
          this.router.navigate(['/profile'], { queryParams: { tab: 'POSTS' } });
        }
      },
      error: () => {
        this.submitting.set(false);
        this.pendingStatus.set(null);
        this.submitError.set(this.editingId() ? 'Yazı güncellenemedi. Backend\'in çalıştığından emin olun.' : 'Yazı kaydedilemedi. Backend\'in çalıştığından emin olun.');
      }
    });
  }

  private performSave(status: 'Draft' | 'Published') {
    const editingId = this.editingId();
    const parsedTags = this.tagsArray();

    if (editingId) {
      return this.blogService.update(editingId, {
        title: this.title,
        content: this.content,
        status,
        photo: this.selectedFile(),
        tags: parsedTags
      });
    }

    const type: 'Blog' | 'Koseyazisi' = this.selectedFile() ? 'Blog' : 'Koseyazisi';

    return this.blogService.create({
      title: this.title,
      content: this.content,
      type,
      status,
      photo: this.selectedFile(),
      tags: parsedTags,
      authorId: this.authService.currentUser()?.id || ''
    });
  }

  ngOnDestroy() {
    // Kullanıcı yayınlamadan veya taslağa kaydetmeden sekmeden/sayfadan ayrılırsa,
    // yazdıklarını sessizce taslak olarak kaydet.
    if (this.saved) return;
    if (!this.title.trim() && !this.content.trim()) return;

    this.performSave('Draft').subscribe({
      next: () => {
        this.toastService.success('Taslak Kaydedildi', 'Ayrıldığınız yazı otomatik olarak taslaklarınıza kaydedildi.');
      },
      error: () => {
        // Sayfa zaten kapanıyor; kullanıcıyı burada engelleyecek bir hata gösterimi anlamsız.
      }
    });
  }

  photoSrc(photoUrl: string): string {
    return `https://localhost:7296${photoUrl}`;
  }
}

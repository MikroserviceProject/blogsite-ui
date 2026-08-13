import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { parseAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-confirm-delete-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './confirm-delete-account.component.html',
  styleUrl: './confirm-delete-account.component.css'
})
export class ConfirmDeleteAccountComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);

  email: string = '';
  token: string = '';

  isDeleting = signal<boolean>(false);
  isDeleted = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.token = params['token'] || '';

      const errorParam = params['error'];
      if (errorParam) {
        this.hasError.set(true);
        this.errorMessage.set(errorParam);
        return;
      }

      if (!this.token) {
        this.hasError.set(true);
        this.errorMessage.set('Geçersiz veya eksik hesap silme bağlantısı.');
      }
    });
  }

  onConfirmDelete() {
    if (!this.token) {
      this.hasError.set(true);
      this.errorMessage.set('Silme onay anahtarı (token) bulunamadı.');
      return;
    }

    this.isDeleting.set(true);
    this.hasError.set(false);

    this.authService.confirmAccountDeletion({
      email: this.email || undefined,
      token: this.token
    }).subscribe({
      next: (res) => {
        this.isDeleting.set(false);
        if (res.success) {
          this.isDeleted.set(true);
          // Kullanıcı oturumunu tamamen kapat
          this.authService.logoutQuietly();
          this.toastService.success('Hesabınız Silindi', 'Hesabınız kalıcı olarak silinmiştir.');
        } else {
          this.hasError.set(true);
          this.errorMessage.set(res.message);
          this.toastService.error('Silme Başarısız', res.message);
        }
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.hasError.set(true);
        const parsed = parseAuthError(err, 'Hesap silme işlemi gerçekleştirilemedi.');
        this.errorMessage.set(parsed.generalMessage);
        this.toastService.error('Hata', parsed.generalMessage);
      }
    });
  }
}

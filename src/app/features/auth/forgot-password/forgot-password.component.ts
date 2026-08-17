import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { parseAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  email = '';
  isLoading = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  onSubmit() {
    if (!this.email) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (res.success) {
          this.isSuccess.set(true);
          this.toast.success('Başarılı ', res.message || 'Sıfırlama bağlantısı e-postanıza iletildi.');
        } else {
          this.errorMessage.set(res.message || 'İşlem gerçekleştirilemedi.');
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        const parsed = parseAuthError(err, 'Şifre sıfırlama talebi başarısız oldu.');
        this.errorMessage.set(parsed.generalMessage);
      }
    });
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { parseAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './confirm-email.component.html',
  styleUrl: './confirm-email.component.css'
})
export class ConfirmEmailComponent implements OnInit {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  email = '';
  token = '';

  isAutoVerifying = signal(false);
  isVerified = signal(false);
  verificationFailed = signal(false);
  isResending = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const qEmail = params['email'];
      const qToken = params['token'];
      const qVerified = params['verified'];
      const qError = params['error'];

      if (qEmail) {
        this.email = qEmail.trim();
      } else if (this.authService.pendingConfirmEmail()) {
        this.email = this.authService.pendingConfirmEmail();
      } else if (this.authService.currentUser()?.email) {
        this.email = this.authService.currentUser()!.email;
      }

      if (qToken) {
        this.token = qToken.trim();
      }

      if (qVerified === 'true') {
        this.isVerified.set(true);
        this.toastService.success('Doğrulama Başarılı! ', 'E-posta adresiniz başarıyla onaylandı.');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2500);
        return;
      }

      if (qError) {
        this.verificationFailed.set(true);
        this.errorMessage.set(qError);
        return;
      }

      // Linkten tıklandıysa (URL'de email ve token varsa) otomatik 1-tıkla doğrula!
      if (this.email && this.token) {
        this.autoVerify();
      }
    });
  }

  private autoVerify() {
    this.isAutoVerifying.set(true);
    this.verificationFailed.set(false);
    this.errorMessage.set(null);

    this.authService.confirmEmail({
      email: this.email.trim(),
      token: this.token.trim()
    }).subscribe({
      next: (res) => {
        this.isAutoVerifying.set(false);
        if (res.success) {
          this.isVerified.set(true);
          this.toastService.success('Doğrulama Başarılı! ', 'E-posta adresiniz başarıyla onaylandı.');
          
          // 2.5 saniye sonra otomatik login sayfasına yönlendir
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2500);
        } else {
          this.verificationFailed.set(true);
          this.errorMessage.set(res.message);
          this.toastService.error('Doğrulama Başarısız', res.message);
        }
      },
      error: (err) => {
        this.isAutoVerifying.set(false);
        this.verificationFailed.set(true);
        const parsed = parseAuthError(err);
        this.errorMessage.set(parsed.generalMessage);
        this.toastService.error('Doğrulama Başarısız', parsed.generalMessage);
      }
    });
  }

  onResendLink() {
    const targetEmail = this.email.trim();
    if (!targetEmail) {
      this.toastService.warning('E-Posta Eksik', 'Lütfen doğrulama linki gönderilecek e-posta adresini yazınız.');
      return;
    }

    this.isResending.set(true);

    this.authService.resendConfirmation(targetEmail).subscribe({
      next: (res) => {
        this.isResending.set(false);
        if (res.success) {
          this.toastService.success('Link Gönderildi! ', 'Yeni doğrulama bağlantısı e-posta adresinize iletildi.');
          this.verificationFailed.set(false);
        } else {
          this.toastService.error('Hata', res.message);
        }
      },
      error: (err) => {
        this.isResending.set(false);
        const parsed = parseAuthError(err);
        this.toastService.error('Hata', parsed.generalMessage);
      }
    });
  }
}

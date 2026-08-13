import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { parseAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  emailOrUsername = '';
  password = '';
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  isEmailConfirmError = signal(false);

  // Doğrulama maili tekrar gönderim akordeonu
  isResendOpen = signal(false);
  resendEmailInput = '';
  isResending = signal(false);
  resendMessage = signal<string | null>(null);
  resendIsError = signal(false);

  bannedCountdown = signal<string | null>(null);
  bannedInterval: any;

  ngOnInit() {
    this.emailOrUsername = '';
    this.password = '';
    this.authService.clearSessionWarning();
  }

  ngOnDestroy() {
    if (this.bannedInterval) clearInterval(this.bannedInterval);
  }

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  goToConfirmEmail() {
    const input = this.emailOrUsername.trim();
    const isEmail = input.includes('@');
    if (isEmail) {
      this.authService.pendingConfirmEmail.set(input);
      this.router.navigate(['/confirm-email'], { queryParams: { email: input } });
    } else {
      this.router.navigate(['/confirm-email']);
    }
  }

  onResendConfirmation() {
    if (!this.resendEmailInput) return;

    this.isResending.set(true);
    this.resendMessage.set(null);
    this.resendIsError.set(false);

    this.authService.resendConfirmation(this.resendEmailInput.trim()).subscribe({
      next: (res: any) => {
        this.isResending.set(false);
        if (res.success) {
          this.resendMessage.set(' Yeni doğrulama bağlantısı e-posta adresinize gönderildi.');
          this.toastService.success('Başarılı ', 'Doğrulama e-postası gönderildi!');
        } else {
          this.resendIsError.set(true);
          this.resendMessage.set(` ${res.message || 'İşlem başarısız.'}`);
        }
      },
      error: (err: any) => {
        this.isResending.set(false);
        this.resendIsError.set(true);
        const parsed = parseAuthError(err, 'Doğrulama e-postası gönderilemedi.');
        this.resendMessage.set(` ${parsed.generalMessage}`);
      }
    });
  }

  onSubmit() {
    if (!this.emailOrUsername || !this.password) {
      this.errorMessage.set('Lütfen e-posta / kullanıcı adı ve şifrenizi giriniz.');
      this.isEmailConfirmError.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.isEmailConfirmError.set(false);

    this.authService.login({
      emailOrUsername: this.emailOrUsername.trim(),
      password: this.password
    }).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (res.success) {
          this.toastService.success('Giriş Başarılı ', `Hoş geldiniz, ${res.data?.user.username}!`);
          this.router.navigate(['/']);
        } else {
          this.errorMessage.set(res.message);
          this.isEmailConfirmError.set(
            res.message?.toLowerCase().includes('doğrulanmamış') ||
            res.message?.toLowerCase().includes('onaylanmamış') ||
            false
          );
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        const parsed = parseAuthError(err);
        let msg = parsed.generalMessage;
        this.bannedCountdown.set(null);
        if (this.bannedInterval) clearInterval(this.bannedInterval);

        if (msg.startsWith('BANNED_UNTIL|')) {
          const parts = msg.split('|');
          const isoDate = parts[1];
          msg = parts[2];

          if (isoDate === 'PERMANENT') {
            msg = 'Hesabınız süresiz olarak yasaklanmıştır.';
          } else {
            const endDate = new Date(isoDate).getTime();
            this.bannedInterval = setInterval(() => {
              const now = new Date().getTime();
              const distance = endDate - now;
              if (distance < 0) {
                clearInterval(this.bannedInterval);
                this.bannedCountdown.set('Yasak süreniz doldu, lütfen sayfayı yenileyin veya tekrar giriş yapın.');
              } else {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                
                let countdownStr = '';
                if (days > 0) countdownStr += `${days} Gün `;
                if (hours > 0) countdownStr += `${hours} Saat `;
                if (minutes > 0) countdownStr += `${minutes} Dakika `;
                countdownStr += `${seconds} Saniye`;
                
                this.bannedCountdown.set(countdownStr);
              }
            }, 1000);
          }
        }

        this.errorMessage.set(msg);
        this.isEmailConfirmError.set(
          msg.toLowerCase().includes('doğrulanmamış') ||
          msg.toLowerCase().includes('onaylanmamış')
        );
        if (!this.isEmailConfirmError()) {
          this.toastService.error('Giriş Hatası', msg);
        } else {
          this.toastService.warning('Doğrulama Gerekli', 'Hesabınızı kullanmak için önce e-posta onayı yapmalısınız.');
        }
      }
    });
  }
}

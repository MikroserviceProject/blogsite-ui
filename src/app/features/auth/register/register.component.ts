import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { parseAuthError, ParsedAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  role: string = 'User'; // 'User' veya 'Author'
  university: string = '';
  selectedCvFile: File | null = null;

  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isLoading = signal(false);
  parsedError = signal<ParsedAuthError | null>(null);

  // Doğrulama maili tekrar gönderim akordeonu
  isResendOpen = signal(false);
  resendEmailInput = '';
  isResending = signal(false);
  resendMessage = signal<string | null>(null);
  resendIsError = signal(false);

  rules = signal({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasDigit: false,
    hasSpecial: false
  });

  passwordStrengthPercent = computed(() => {
    const r = this.rules();
    return ([r.hasMinLength, r.hasUpperCase, r.hasLowerCase, r.hasDigit, r.hasSpecial].filter(Boolean).length / 5) * 100;
  });

  passwordStrengthClass = computed(() => {
    const pct = this.passwordStrengthPercent();
    if (pct <= 20) return 'strength-weak';
    if (pct <= 40) return 'strength-fair';
    if (pct <= 80) return 'strength-good';
    return 'strength-strong';
  });

  passwordStrengthLabel = computed(() => {
    const pct = this.passwordStrengthPercent();
    if (pct <= 20) return 'Çok Zayıf 🙈';
    if (pct <= 40) return 'Zayıf 🙉';
    if (pct <= 60) return 'Orta 🙊';
    if (pct <= 80) return 'İyi 🙂';
    return 'Güçlü ✓ ';
  });

  isPasswordValid = computed(() => {
    const r = this.rules();
    return r.hasMinLength && r.hasUpperCase && r.hasLowerCase && r.hasDigit && r.hasSpecial;
  });

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.update(v => !v);
  }



  onPasswordChange(value: string) {
    this.rules.set({
      hasMinLength: value.length >= 8,
      hasUpperCase: /[A-Z]/.test(value),
      hasLowerCase: /[a-z]/.test(value),
      hasDigit: /[0-9]/.test(value),
      hasSpecial: /[^a-zA-Z0-9]/.test(value)
    });
  }

  onCvFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        this.toastService.error('Geçersiz Dosya', 'Lütfen sadece PDF formatında CV dosyası yükleyiniz.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        this.toastService.error('Dosya Çok Büyük', 'CV dosyası boyutu en fazla 10 MB olabilir.');
        return;
      }
      this.selectedCvFile = file;
    }
  }

  removeCvFile(event: Event) {
    event.stopPropagation();
    this.selectedCvFile = null;
  }

  getFormattedFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    if (!this.username || !this.email || !this.password || !this.confirmPassword) {
      this.parsedError.set({
        title: ' Eksik Alanlar',
        generalMessage: 'Lütfen kullanıcı adı, e-posta ve şifre alanlarını eksiksiz doldurunuz.',
        passwordErrors: !this.password ? ['Şifre alanı boş bırakılamaz.'] : [],
        emailErrors: !this.email ? ['E-posta alanı boş bırakılamaz.'] : [],
        usernameErrors: !this.username ? ['Kullanıcı adı boş bırakılamaz.'] : [],
        otherErrors: [],
        isPasswordError: !this.password
      });
      return;
    }

    // Basit bir de frontend'de mail kontrolü (HTML form erroru görmeden submit ederse)
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.email)) {
      this.toastService.warning('Geçersiz E-Posta', 'Lütfen geçerli formatta bir e-posta adresi giriniz.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.toastService.warning('Şifre Uyuşmazlığı', 'Girdiğiniz şifreler birbiriyle eşleşmiyor. Lütfen kontrol edip tekrar deneyin.');
      return;
    }

    if (this.role === 'Author') {
      if (!this.university.trim()) {
        this.toastService.warning('Eksik Bilgi', 'Lütfen mezun olduğunuz üniversiteyi belirtiniz.');
        return;
      }
      if (!this.selectedCvFile) {
        this.toastService.warning('Eksik Dosya', 'Lütfen PDF formatında özgeçmişinizi (CV) yükleyiniz.');
        return;
      }
    }

    if (!this.isPasswordValid()) {
      const missingRules: string[] = [];
      const r = this.rules();
      if (!r.hasMinLength) missingRules.push('En az 8 karakter olmalıdır.');
      if (!r.hasUpperCase) missingRules.push('En az 1 BÜYÜK HARF (A-Z) içermelidir.');
      if (!r.hasLowerCase) missingRules.push('En az 1 küçük harf (a-z) içermelidir.');
      if (!r.hasDigit) missingRules.push('En az 1 rakam (0-9) içermelidir.');
      if (!r.hasSpecial) missingRules.push('En az 1 özel karakter (!@#$%^&*) içermelidir.');

      this.parsedError.set({
        title: ' Şifre Güvenlik Hatası',
        generalMessage: 'Girdiğiniz şifre güvenlik kurallarına uymuyor. Lütfen aşağıdaki kuralları sağlayınız:',
        passwordErrors: missingRules,
        emailErrors: [],
        usernameErrors: [],
        otherErrors: [],
        isPasswordError: true
      });
      this.toastService.warning('Şifre Güvenliği Yetersiz', 'Lütfen şifre kurallarını tamamlayınız.');
      return;
    }

    this.isLoading.set(true);
    this.parsedError.set(null);

    const targetEmail = this.email.trim();

    if (this.role === 'Author') {
      const formData = new FormData();
      formData.append('username', this.username.trim());
      formData.append('email', targetEmail);
      formData.append('password', this.password);
      formData.append('university', this.university.trim());
      if (this.selectedCvFile) {
        formData.append('cvFile', this.selectedCvFile);
      }

      this.authService.registerAuthor(formData).subscribe({
        next: (res: any) => {
          this.isLoading.set(false);
          if (res.success) {
            this.toastService.success(
              'Yazar Başvurunuz Alındı! ',
              'Başvurunuz ve CV dosyanız sistem yöneticisine iletildi. Onaylandığında aktivasyon bağlantısı e-postanıza gelecektir.'
            );
            this.router.navigate(['/login']);
          } else {
            const parsed = parseAuthError(res);
            this.parsedError.set(parsed);
            this.toastService.error('Başvuru Hatası', parsed.generalMessage);
          }
        },
        error: (err: any) => {
          this.isLoading.set(false);
          const parsed = parseAuthError(err);
          this.parsedError.set(parsed);
          this.toastService.error(parsed.title, parsed.generalMessage);
        }
      });
    } else {
      this.authService.register({
        username: this.username.trim(),
        email: targetEmail,
        password: this.password,
        role: 'User'
      }).subscribe({
        next: (res: any) => {
          this.isLoading.set(false);
          if (res.success) {
            this.toastService.success(
              'Kayıt Başarılı! ',
              'E-posta adresinize tek tıkla doğrulama bağlantısı gönderildi. Lütfen gelen kutunuzu kontrol ediniz.'
            );
            this.router.navigate(['/login']);
          } else {
            const parsed = parseAuthError(res);
            this.parsedError.set(parsed);
            this.toastService.error('Kayıt Hatası', parsed.generalMessage);
          }
        },
        error: (err: any) => {
          this.isLoading.set(false);
          const parsed = parseAuthError(err);
          this.parsedError.set(parsed);
          this.toastService.error(parsed.title, parsed.generalMessage);
        }
      });
    }
  }
}

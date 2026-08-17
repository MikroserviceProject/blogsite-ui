import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { parseAuthError } from '../../../core/utils/auth-error-parser';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  email = '';
  token = '';
  newPassword = '';
  confirmPassword = '';

  showPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Validation Signals
  hasMinLength = computed(() => this.newPassword.length >= 8);
  hasUpper = computed(() => /[A-Z]/.test(this.newPassword));
  hasLower = computed(() => /[a-z]/.test(this.newPassword));
  hasNumber = computed(() => /[0-9]/.test(this.newPassword));
  hasSpecial = computed(() => /[^a-zA-Z0-9]/.test(this.newPassword));

  isPasswordValid = computed(() => 
    this.hasMinLength() && this.hasUpper() && this.hasLower() && this.hasNumber() && this.hasSpecial()
  );

  isFormValid = computed(() => 
    !!this.email && !!this.token && this.isPasswordValid() && this.newPassword === this.confirmPassword
  );

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      }
      if (params['token']) {
        this.token = params['token'];
      }
    });
  }

  onSubmit() {
    if (!this.isFormValid()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.resetPassword({
      email: this.email,
      token: this.token,
      newPassword: this.newPassword
    }).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (res.success) {
          this.isSuccess.set(true);
          this.toast.success('Başarılı ', 'Şifreniz başarıyla güncellendi!');
        } else {
          this.errorMessage.set(res.message || 'Şifre sıfırlanamadı.');
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        const parsed = parseAuthError(err, 'Şifre sıfırlama işlemi başarısız.');
        this.errorMessage.set(parsed.generalMessage);
      }
    });
  }
}

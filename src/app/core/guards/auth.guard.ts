import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  if (authService.isLoggedIn()) {
    return true;
  }

  toastService.warning('Yetkisiz Erişim', 'Bu sayfayı görüntülemek için lütfen giriş yapınız.');
  router.navigate(['/login']);
  return false;
};

export const authorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  if (!authService.isLoggedIn()) {
    toastService.warning('Yetkisiz Erişim', 'Yazı yazabilmek için lütfen giriş yapınız.');
    router.navigate(['/login']);
    return false;
  }

  if (authService.isAuthor() || authService.isAdmin()) {
    return true;
  }

  toastService.warning(
    'Yetki Yetersiz 🔒',
    'Yazı oluşturma ve fotoğraf yükleme yetkisi sadece Yazar ve Yönetici hesaplara aittir.'
  );
  router.navigate(['/']);
  return false;
};

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  if (!authService.isLoggedIn()) {
    toastService.warning('Yetkisiz Erişim', 'Yönetici paneline erişmek için lütfen giriş yapınız.');
    router.navigate(['/login']);
    return false;
  }

  if (authService.isAdmin()) {
    return true;
  }

  toastService.error('Erişim Reddedildi ⛔', 'Bu alana sadece sistem yöneticileri erişebilir.');
  router.navigate(['/profile']);
  return false;
};


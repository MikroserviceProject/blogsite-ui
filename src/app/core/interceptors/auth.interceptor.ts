import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  let modifiedReq = req;
  if (token) {
    modifiedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Eğer 401 Unauthorized hatası geldiyse (Oturum başka yerden açılmış veya sonlandırılmışsa)
      if (error.status === 401 && !req.url.includes('/login') && !req.url.includes('/register')) {
        const errorMsg = error.error?.message || 'Oturumunuz başka bir cihazdan giriş yapıldığı veya süresi dolduğu için sonlandırıldı.';
        authService.handleSessionTerminated(errorMsg);
      }
      return throwError(() => error);
    })
  );
};


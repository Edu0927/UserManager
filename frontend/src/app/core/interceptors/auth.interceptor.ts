import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);

  const isApiRequest = req.url.startsWith(
    `${environment.apiUrl}/`
  );

  const isLogin = req.url ===
    `${environment.apiUrl}/auth/login`;

  if (!isApiRequest || isLogin) {
    return next(req);
  }

  const token = authService.getToken();

  const authRequest = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(authRequest).pipe(

    catchError(error => {

      if (error.status === 401) {
        authService.logout();
      }

      return throwError(() => error);
    })
  );
};

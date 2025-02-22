import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap, finalize } from 'rxjs/operators';
import { AuthService } from '@/features/auth/services/auth.service';

let isRefreshing = false;
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);

  // Skip token for refresh token requests to prevent infinite loop
  if (req.url.includes('/refresh-token')) {
    return next(req);
  }

  const token = authService.getStoredToken();
  if (token) {
    req = addToken(req, token);
  }

  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handle401Error(req, next, authService);
      }
      return throwError(() => error);
    })
  );
}

function addToken(request: HttpRequest<unknown>, token: string) {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function handle401Error(request: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
      isRefreshing = false;
      refreshAttempts = 0;
      authService.logout();
      return throwError(() => new Error('Max refresh attempts exceeded'));
    }

    refreshAttempts++;

    return authService.handleTokenRefresh().pipe(
      switchMap((token: string) => {
        isRefreshing = false;
        refreshTokenSubject.next(token);
        return next(addToken(request, token));
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => err);
      }),
      finalize(() => {
        isRefreshing = false;
      })
    );
  }

  return refreshTokenSubject.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((token) => next(addToken(request, token)))
  );
}

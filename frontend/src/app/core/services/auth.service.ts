import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = `${environment.apiUrl}/auth`;
  private storageKey = 'usermanager_session';

  login(credentials: LoginRequest): Observable<LoginResponse> {

    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      credentials
    ).pipe(
      tap(response => {
        sessionStorage.setItem(
          this.storageKey,
          JSON.stringify(response)
        );
      })
    );
  }

  getSession(): LoginResponse | null {

    try {
      const session = sessionStorage.getItem(this.storageKey);

      return session ? JSON.parse(session) : null;

    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return this.getSession()?.token ?? null;
  }

  getRole(): string | null {
    return this.getSession()?.role ?? null;
  }

  isAuthenticated(): boolean {

    const token = this.getToken();

    if (!token) {
      return false;
    }

    try {

      const base64 = token.split('.')[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const payload = JSON.parse(atob(base64));

      return payload.exp * 1000 > Date.now();

    } catch {
      return false;
    }
  }

  logout(): void {

    sessionStorage.removeItem(this.storageKey);

    this.router.navigate(['/login']);
  }
}

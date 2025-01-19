import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '@/env/environment';
import { User, AuthResponse, RegisterDto, LoginDto } from '@/core/models/auth.model';
import { isPlatformBrowser } from '@angular/common';

export enum UserRole {
  USER = 'USER',
  SUPER_USER = 'SUPER_USER',
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly API_URL = `${environment.API_BASE_URL}/user`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {
    // Only try to load stored user if we're in the browser
    if (isPlatformBrowser(this.platformId)) {
      this.loadStoredUser();
    }
  }

  private loadStoredUser() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      // Get user info from /me endpoint
      this.http.get<User>(`${this.API_URL}/me`).subscribe({
        next: (user) => this.currentUserSubject.next(user),
        error: () => this.logout(), // Token might be invalid/expired
      });
    }
  }

  register(dto: RegisterDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/register`, dto)
      .pipe(tap((response) => this.handleAuthResponse(response)));
  }

  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/login`, {
        username: dto.email,
        password: dto.password,
      })
      .pipe(tap((response) => this.handleAuthResponse(response)));
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
  }

  private handleAuthResponse(response: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    this.currentUserSubject.next(response.user);
  }

  getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  getUserRole(): string {
    const currentUser = this.currentUserSubject.value;
    return currentUser?.role || '';
  }

  hasRole(role: UserRole): boolean {
    return this.getUserRole() === role;
  }
}

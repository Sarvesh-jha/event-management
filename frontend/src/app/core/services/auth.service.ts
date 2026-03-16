import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { AuthSession, LoginPayload, RegisterPayload } from '../models/auth.model';
import { CampusUser, UserRole } from '../models/campus-user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly tokenStorageKey = 'sce.auth.token';
  private readonly userStorageKey = 'sce.auth.user';
  private readonly previewStorageKey = 'sce.auth.preview';

  private readonly tokenSignal = signal<string | null>(this.readStoredToken());
  private readonly userSignal = signal<CampusUser | null>(this.readStoredUser());
  private readonly previewSignal = signal(this.readStoredPreviewFlag());

  readonly currentUser = computed(() => this.userSignal());
  readonly isAuthenticated = computed(() => Boolean(this.tokenSignal()));
  readonly isAdmin = computed(() => this.userSignal()?.role === 'admin');
  readonly isPreviewMode = computed(() => this.previewSignal());

  login(payload: LoginPayload): Observable<AuthSession> {
    return this.http.post<unknown>(`${API_BASE_URL}/auth/login`, payload).pipe(
      map((response) =>
        this.normalizeAuthSession(response, payload.email, payload.email.split('@')[0]),
      ),
      tap((session) => this.persistSession(session, false)),
      catchError((error: HttpErrorResponse) =>
        this.handleAuthFailure(error, payload.email, payload.email.split('@')[0]),
      ),
    );
  }

  register(payload: RegisterPayload): Observable<AuthSession> {
    return this.http.post<unknown>(`${API_BASE_URL}/auth/register`, payload).pipe(
      map((response) => this.normalizeAuthSession(response, payload.email, payload.fullName)),
      tap((session) => this.persistSession(session, false)),
      catchError((error: HttpErrorResponse) =>
        this.handleAuthFailure(error, payload.email, payload.fullName, payload.department),
      ),
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.userStorageKey);
    localStorage.removeItem(this.previewStorageKey);

    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.previewSignal.set(false);

    this.router.navigateByUrl('/events');
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  private handleAuthFailure(
    error: HttpErrorResponse,
    email: string,
    fullName: string,
    department = 'Student Affairs',
  ): Observable<AuthSession> {
    if (this.shouldUsePreviewMode(error)) {
      // Preview mode keeps the frontend usable while the matching backend APIs are still being built.
      const previewSession = this.createPreviewSession(email, fullName, department);
      this.persistSession(previewSession, true);
      return of(previewSession);
    }

    return throwError(
      () => new Error(this.extractErrorMessage(error, 'Unable to complete authentication.')),
    );
  }

  private normalizeAuthSession(
    response: unknown,
    fallbackEmail: string,
    fallbackName: string,
  ): AuthSession {
    const responseRecord = this.asRecord(response);
    const dataRecord = this.asRecord(responseRecord['data']);
    const userRecord = this.asRecord(
      responseRecord['user'] ?? dataRecord['user'] ?? dataRecord,
    );

    const user: CampusUser = {
      id:
        this.readString(userRecord['id']) ??
        this.readString(userRecord['_id']) ??
        this.createId(),
      fullName:
        this.readString(userRecord['fullName']) ??
        this.readString(userRecord['name']) ??
        fallbackName,
      email: this.readString(userRecord['email']) ?? fallbackEmail,
      department: this.readString(userRecord['department']) ?? 'Student Affairs',
      studentId: this.readString(userRecord['studentId']),
      role: this.resolveRole(this.readString(userRecord['role']), fallbackEmail),
    };

    return {
      token:
        this.readString(responseRecord['token']) ??
        this.readString(dataRecord['token']) ??
        `session-${Date.now()}`,
      user,
      previewMode: false,
      message:
        this.readString(responseRecord['message']) ??
        this.readString(dataRecord['message']),
    };
  }

  private createPreviewSession(
    email: string,
    fullName: string,
    department = 'Student Affairs',
  ): AuthSession {
    const role = this.resolveRole(undefined, email);

    return {
      token: `preview-${role}-${Date.now()}`,
      user: {
        id: this.createId(),
        fullName,
        email,
        department,
        role,
      },
      previewMode: true,
      message: 'Preview mode enabled while backend authentication APIs are still offline.',
    };
  }

  private persistSession(session: AuthSession, previewMode: boolean): void {
    localStorage.setItem(this.tokenStorageKey, session.token);
    localStorage.setItem(this.userStorageKey, JSON.stringify(session.user));
    localStorage.setItem(this.previewStorageKey, JSON.stringify(previewMode));

    this.tokenSignal.set(session.token);
    this.userSignal.set(session.user);
    this.previewSignal.set(previewMode);
  }

  private shouldUsePreviewMode(error: HttpErrorResponse): boolean {
    return [0, 404, 500, 502, 503].includes(error.status);
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const errorRecord = this.asRecord(error.error);

    return (
      this.readString(errorRecord['message']) ??
      this.readString(errorRecord['error']) ??
      error.message ??
      fallback
    );
  }

  private readStoredToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  private readStoredUser(): CampusUser | null {
    const storedUser = localStorage.getItem(this.userStorageKey);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as CampusUser;
    } catch {
      return null;
    }
  }

  private readStoredPreviewFlag(): boolean {
    return localStorage.getItem(this.previewStorageKey) === 'true';
  }

  private resolveRole(rawRole: string | undefined, email: string): UserRole {
    if (rawRole === 'admin' || rawRole === 'student') {
      return rawRole;
    }

    return email.toLowerCase().includes('admin') ? 'admin' : 'student';
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  }

  private readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  private createId(): string {
    return `user-${Math.random().toString(36).slice(2, 10)}`;
  }
}

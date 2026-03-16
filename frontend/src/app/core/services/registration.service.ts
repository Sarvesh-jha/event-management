import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { StudentRegistration } from '../models/registration.model';

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly http = inject(HttpClient);

  getMyRegistrations(): Observable<StudentRegistration[]> {
    return this.http.get<unknown>(`${API_BASE_URL}/registrations/me`).pipe(
      map((response) => this.normalizeRegistrationList(response)),
      catchError((error: HttpErrorResponse) =>
        throwError(() => new Error(this.extractErrorMessage(error, 'Unable to load registrations.'))),
      ),
    );
  }

  getMyRegistrationForEvent(eventId: string): Observable<StudentRegistration | null> {
    return this.http.get<unknown>(`${API_BASE_URL}/registrations/event/${eventId}/me`).pipe(
      map((response) => this.normalizeRegistration(this.asRecord(response)['data'])),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of(null);
        }

        return throwError(
          () => new Error(this.extractErrorMessage(error, 'Unable to load registration details.')),
        );
      }),
    );
  }

  verifyCheckIn(qrCodeToken: string): Observable<StudentRegistration> {
    return this.http
      .post<unknown>(`${API_BASE_URL}/registrations/verify-checkin`, { qrCodeToken })
      .pipe(
        map((response) => this.normalizeRegistration(this.asRecord(response)['data']) as StudentRegistration),
        catchError((error: HttpErrorResponse) =>
          throwError(() => new Error(this.extractErrorMessage(error, 'Unable to verify QR code.'))),
        ),
      );
  }

  downloadCertificate(registrationId: string): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/registrations/${registrationId}/certificate`, {
      responseType: 'blob',
    });
  }

  private normalizeRegistrationList(response: unknown): StudentRegistration[] {
    const responseRecord = this.asRecord(response);
    const data = responseRecord['data'];

    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .map((item) => this.normalizeRegistration(item))
      .filter((item): item is StudentRegistration => Boolean(item));
  }

  private normalizeRegistration(value: unknown): StudentRegistration | null {
    const record = this.asRecord(value);

    if (!record['registrationId'] && !record['id']) {
      return null;
    }

    return {
      id: this.readString(record['id']) ?? this.readString(record['registrationId']) ?? '',
      registrationId:
        this.readString(record['registrationId']) ?? this.readString(record['id']) ?? '',
      eventId: this.readString(record['eventId']) ?? '',
      eventTitle: this.readString(record['eventTitle']),
      attendeeName: this.readString(record['attendeeName']) ?? 'Campus Student',
      attendeeEmail: this.readString(record['attendeeEmail']) ?? 'student@campus.edu',
      qrCodeToken: this.readString(record['qrCodeToken']) ?? '',
      qrCodeDataUrl: this.readString(record['qrCodeDataUrl']),
      status:
        (this.readString(record['status']) as StudentRegistration['status']) ?? 'confirmed',
      note: this.readString(record['note']),
      checkedIn: Boolean(record['checkedIn']),
      checkedInAt: this.readString(record['checkedInAt']) ?? null,
      certificateIssuedAt: this.readString(record['certificateIssuedAt']) ?? null,
      certificateNumber: this.readString(record['certificateNumber']),
      createdAt: this.readString(record['createdAt']),
      updatedAt: this.readString(record['updatedAt']),
      message: this.readString(record['message']),
    };
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

  private asRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  }

  private readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
  }
}

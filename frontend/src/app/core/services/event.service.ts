import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { PREVIEW_EVENTS } from '../config/demo-data';
import {
  CampusEvent,
  EventFormPayload,
  EventRegistrationPayload,
  EventRegistrationReceipt,
} from '../models/event.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly previewSignal = signal(false);
  readonly isPreviewMode = computed(() => this.previewSignal());

  getEvents(): Observable<CampusEvent[]> {
    return this.http.get<unknown>(`${API_BASE_URL}/events`).pipe(
      map((response) => this.normalizeEventList(response)),
      catchError((error: HttpErrorResponse) => this.handleEventListFailure(error)),
    );
  }

  getEventById(eventId: string): Observable<CampusEvent | null> {
    return this.http.get<unknown>(`${API_BASE_URL}/events/${eventId}`).pipe(
      map((response) => this.normalizeSingleEvent(response) ?? this.findPreviewEvent(eventId)),
      catchError((error: HttpErrorResponse) => this.handleEventDetailsFailure(error, eventId)),
    );
  }

  registerForEvent(
    eventId: string,
    payload: EventRegistrationPayload,
  ): Observable<EventRegistrationReceipt> {
    return this.http
      .post<unknown>(`${API_BASE_URL}/events/${eventId}/register`, payload)
      .pipe(
        map((response) => this.normalizeReceipt(response, eventId)),
        catchError((error: HttpErrorResponse) =>
          this.handleRegistrationFailure(error, eventId),
        ),
      );
  }

  getAdminEvents(): Observable<CampusEvent[]> {
    return this.http.get<unknown>(`${API_BASE_URL}/events/admin/list/all`).pipe(
      map((response) => this.normalizeEventList(response)),
      catchError((error: HttpErrorResponse) =>
        throwError(() => new Error(this.extractErrorMessage(error, 'Unable to load admin events.'))),
      ),
    );
  }

  createEvent(payload: EventFormPayload): Observable<CampusEvent> {
    return this.http.post<unknown>(`${API_BASE_URL}/events`, payload).pipe(
      map((response) => this.normalizeSingleEvent(this.asRecord(response)['data']) as CampusEvent),
      catchError((error: HttpErrorResponse) =>
        throwError(() => new Error(this.extractErrorMessage(error, 'Unable to create event.'))),
      ),
    );
  }

  updateEvent(eventId: string, payload: EventFormPayload): Observable<CampusEvent> {
    return this.http.put<unknown>(`${API_BASE_URL}/events/${eventId}`, payload).pipe(
      map((response) => this.normalizeSingleEvent(this.asRecord(response)['data']) as CampusEvent),
      catchError((error: HttpErrorResponse) =>
        throwError(() => new Error(this.extractErrorMessage(error, 'Unable to update event.'))),
      ),
    );
  }

  deleteEvent(eventId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/events/${eventId}`);
  }

  completeEvent(eventId: string): Observable<CampusEvent> {
    return this.http.patch<unknown>(`${API_BASE_URL}/events/${eventId}/complete`, {}).pipe(
      map((response) => this.normalizeSingleEvent(this.asRecord(response)['data']) as CampusEvent),
      catchError((error: HttpErrorResponse) =>
        throwError(() => new Error(this.extractErrorMessage(error, 'Unable to complete event.'))),
      ),
    );
  }

  private handleEventListFailure(error: HttpErrorResponse): Observable<CampusEvent[]> {
    if (this.shouldUsePreviewMode(error)) {
      this.previewSignal.set(true);
      return of(PREVIEW_EVENTS);
    }

    return throwError(
      () => new Error(this.extractErrorMessage(error, 'Unable to load events right now.')),
    );
  }

  private handleEventDetailsFailure(
    error: HttpErrorResponse,
    eventId: string,
  ): Observable<CampusEvent | null> {
    if (this.shouldUsePreviewMode(error)) {
      this.previewSignal.set(true);
      return of(this.findPreviewEvent(eventId));
    }

    return throwError(
      () => new Error(this.extractErrorMessage(error, 'Unable to load this event right now.')),
    );
  }

  private handleRegistrationFailure(
    error: HttpErrorResponse,
    eventId: string,
  ): Observable<EventRegistrationReceipt> {
    if (this.shouldUsePreviewMode(error)) {
      this.previewSignal.set(true);
      const event = this.findPreviewEvent(eventId);
      return of(this.createPreviewReceipt(eventId, event?.title ?? 'Campus Event'));
    }

    return throwError(
      () =>
        new Error(this.extractErrorMessage(error, 'Registration could not be completed.')),
    );
  }

  private normalizeEventList(response: unknown): CampusEvent[] {
    const responseRecord = this.asRecord(response);
    const data = responseRecord['data'];

    this.previewSignal.set(false);

    if (Array.isArray(response)) {
      return response as CampusEvent[];
    }

    if (Array.isArray(data)) {
      return data as CampusEvent[];
    }

    return PREVIEW_EVENTS;
  }

  private normalizeSingleEvent(response: unknown): CampusEvent | null {
    const responseRecord = this.asRecord(response);
    const data = responseRecord['data'];

    this.previewSignal.set(false);

    if (this.looksLikeEvent(responseRecord)) {
      return responseRecord as unknown as CampusEvent;
    }

    if (this.looksLikeEvent(this.asRecord(data))) {
      return data as CampusEvent;
    }

    return null;
  }

  private normalizeReceipt(response: unknown, eventId: string): EventRegistrationReceipt {
    const responseRecord = this.asRecord(response);
    const dataRecord = this.asRecord(responseRecord['data']);
    const activeUser = this.authService.currentUser();

    this.previewSignal.set(false);

    return {
      id: this.readString(responseRecord['id']) ?? this.readString(dataRecord['id']),
      registrationId:
        this.readString(responseRecord['registrationId']) ??
        this.readString(dataRecord['registrationId']) ??
        `reg-${Date.now()}`,
      eventId,
      eventTitle:
        this.readString(responseRecord['eventTitle']) ??
        this.readString(dataRecord['eventTitle']),
      attendeeName:
        this.readString(responseRecord['attendeeName']) ??
        this.readString(dataRecord['attendeeName']) ??
        activeUser?.fullName ??
        'Campus Student',
      attendeeEmail:
        this.readString(responseRecord['attendeeEmail']) ??
        this.readString(dataRecord['attendeeEmail']) ??
        activeUser?.email ??
        'student@campus.edu',
      qrCodeToken:
        this.readString(responseRecord['qrCodeToken']) ??
        this.readString(dataRecord['qrCodeToken']) ??
        `SCE-${eventId.toUpperCase().slice(0, 8)}-${Date.now()}`,
      qrCodeDataUrl:
        this.readString(responseRecord['qrCodeDataUrl']) ??
        this.readString(dataRecord['qrCodeDataUrl']),
      status:
        (this.readString(responseRecord['status']) ??
          this.readString(dataRecord['status'])) === 'waitlisted'
          ? 'waitlisted'
          : 'confirmed',
      checkedIn: Boolean(responseRecord['checkedIn'] ?? dataRecord['checkedIn']),
      checkedInAt:
        this.readString(responseRecord['checkedInAt']) ??
        this.readString(dataRecord['checkedInAt']) ??
        null,
      certificateIssuedAt:
        this.readString(responseRecord['certificateIssuedAt']) ??
        this.readString(dataRecord['certificateIssuedAt']) ??
        null,
      certificateNumber:
        this.readString(responseRecord['certificateNumber']) ??
        this.readString(dataRecord['certificateNumber']),
      message:
        this.readString(responseRecord['message']) ??
        this.readString(dataRecord['message']) ??
        'Registration confirmed successfully.',
    };
  }

  private createPreviewReceipt(
    eventId: string,
    eventTitle: string,
  ): EventRegistrationReceipt {
    const activeUser = this.authService.currentUser();

    return {
      registrationId: `preview-reg-${Date.now()}`,
      eventId,
      attendeeName: activeUser?.fullName ?? 'Campus Student',
      attendeeEmail: activeUser?.email ?? 'student@campus.edu',
      qrCodeToken: `PREVIEW-${eventId.toUpperCase().slice(0, 6)}-${Date.now()}`,
      status: 'confirmed',
      checkedIn: false,
      message: `${eventTitle} registration is saved in preview mode until the live endpoint is ready.`,
    };
  }

  private findPreviewEvent(eventId: string): CampusEvent | null {
    return PREVIEW_EVENTS.find((event) => event.id === eventId) ?? null;
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

  private looksLikeEvent(value: Record<string, unknown>): boolean {
    return Boolean(this.readString(value['id']) ?? this.readString(value['title']));
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  }

  private readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
  }
}

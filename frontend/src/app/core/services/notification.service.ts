import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { UserNotification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);

  getMyNotifications(): Observable<UserNotification[]> {
    return this.http.get<unknown>(`${API_BASE_URL}/notifications/me`).pipe(
      map((response) => this.normalizeNotificationList(response)),
      catchError((error: HttpErrorResponse) =>
        throwError(() => new Error(this.extractErrorMessage(error, 'Unable to load notifications.'))),
      ),
    );
  }

  markAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(`${API_BASE_URL}/notifications/${notificationId}/read`, {});
  }

  private normalizeNotificationList(response: unknown): UserNotification[] {
    const responseRecord = this.asRecord(response);
    const data = responseRecord['data'];

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item) => {
      const record = this.asRecord(item);
      const eventRecord = this.asRecord(record['event']);

      return {
        id: this.readString(record['id']) ?? '',
        type: this.readString(record['type']) ?? 'system',
        channel: (this.readString(record['channel']) as UserNotification['channel']) ?? 'in-app',
        title: this.readString(record['title']) ?? 'Notification',
        message: this.readString(record['message']) ?? '',
        status: (this.readString(record['status']) as UserNotification['status']) ?? 'sent',
        isRead: Boolean(record['isRead']),
        sentAt: this.readString(record['sentAt']) ?? null,
        createdAt: this.readString(record['createdAt']),
        event: eventRecord['id']
          ? {
              id: this.readString(eventRecord['id']) ?? '',
              title: this.readString(eventRecord['title']) ?? 'Event',
            }
          : null,
      };
    });
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

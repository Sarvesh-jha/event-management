import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { PREVIEW_DASHBOARD_SUMMARY } from '../config/demo-data';
import { DashboardSummary } from '../models/analytics.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  private readonly previewSignal = signal(false);
  readonly isPreviewMode = computed(() => this.previewSignal());

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<unknown>(`${API_BASE_URL}/analytics/events`).pipe(
      map((response) => this.normalizeSummary(response)),
      catchError((error: HttpErrorResponse) => this.handleSummaryFailure(error)),
    );
  }

  private normalizeSummary(response: unknown): DashboardSummary {
    const responseRecord = this.asRecord(response);
    const dataRecord = this.asRecord(responseRecord['data']);

    this.previewSignal.set(false);

    if (this.looksLikeSummary(responseRecord)) {
      return responseRecord as unknown as DashboardSummary;
    }

    if (this.looksLikeSummary(dataRecord)) {
      return dataRecord as unknown as DashboardSummary;
    }

    return PREVIEW_DASHBOARD_SUMMARY;
  }

  private handleSummaryFailure(error: HttpErrorResponse): Observable<DashboardSummary> {
    if ([0, 404, 500, 502, 503].includes(error.status)) {
      this.previewSignal.set(true);
      return of(PREVIEW_DASHBOARD_SUMMARY);
    }

    return throwError(
      () => new Error(this.extractErrorMessage(error, 'Unable to load dashboard analytics.')),
    );
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

  private looksLikeSummary(value: Record<string, unknown>): boolean {
    return (
      typeof value['totalEvents'] === 'number' &&
      typeof value['totalRegistrations'] === 'number'
    );
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  }

  private readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
  }
}

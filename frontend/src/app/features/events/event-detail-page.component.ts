import { DatePipe } from '@angular/common';
import { DestroyRef, computed, Component, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CampusEvent } from '../../core/models/event.model';
import { StudentRegistration } from '../../core/models/registration.model';
import { AuthService } from '../../core/services/auth.service';
import { EventService } from '../../core/services/event.service';
import { RegistrationService } from '../../core/services/registration.service';

@Component({
  selector: 'app-event-detail-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './event-detail-page.component.html',
  styleUrl: './event-detail-page.component.scss',
})
export class EventDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventService = inject(EventService);
  private readonly authService = inject(AuthService);
  private readonly registrationService = inject(RegistrationService);

  protected readonly event = signal<CampusEvent | null>(null);
  protected readonly loading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly isDownloadingCertificate = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly note = signal('');
  protected readonly registration = signal<StudentRegistration | null>(null);
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly isAdmin = this.authService.isAdmin;
  protected readonly currentUser = this.authService.currentUser;
  protected readonly isPreviewMode = this.eventService.isPreviewMode;

  protected readonly occupancyRate = computed(() => {
    const currentEvent = this.event();

    if (!currentEvent) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((currentEvent.registeredCount / currentEvent.capacity) * 100),
    );
  });

  protected readonly seatsRemaining = computed(() => {
    const currentEvent = this.event();
    return currentEvent ? currentEvent.capacity - currentEvent.registeredCount : 0;
  });

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id');

    if (!eventId) {
      this.errorMessage.set('The requested event could not be found.');
      this.loading.set(false);
      return;
    }

    this.loadEvent(eventId);

    if (this.authService.isAuthenticated() && !this.authService.isAdmin()) {
      this.loadExistingRegistration(eventId);
    }
  }

  protected updateNote(value: string): void {
    this.note.set(value);
  }

  protected registerForEvent(): void {
    const activeEvent = this.event();

    if (!activeEvent) {
      return;
    }

    if (this.authService.isAdmin()) {
      this.errorMessage.set('Admin accounts can manage events, but only student accounts can register.');
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: {
          redirect: this.router.url,
        },
      });
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.eventService
      .registerForEvent(activeEvent.id, {
        note: this.note().trim() || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (receipt) => {
          this.registration.set({
            id: receipt.id ?? receipt.registrationId,
            registrationId: receipt.registrationId,
            eventId: receipt.eventId,
            eventTitle: receipt.eventTitle ?? activeEvent.title,
            attendeeName: receipt.attendeeName,
            attendeeEmail: receipt.attendeeEmail,
            qrCodeToken: receipt.qrCodeToken,
            qrCodeDataUrl: receipt.qrCodeDataUrl,
            status: receipt.status,
            checkedIn: receipt.checkedIn ?? false,
            checkedInAt: receipt.checkedInAt ?? null,
            certificateIssuedAt: receipt.certificateIssuedAt ?? null,
            certificateNumber: receipt.certificateNumber,
            message: receipt.message,
          });
          this.event.update((currentEvent) =>
            currentEvent && receipt.status === 'confirmed'
              ? {
                  ...currentEvent,
                  registeredCount: currentEvent.registeredCount + 1,
                }
              : currentEvent,
          );
          this.isSubmitting.set(false);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.isSubmitting.set(false);
        },
      });
  }

  protected downloadCertificate(registration: StudentRegistration): void {
    this.isDownloadingCertificate.set(true);
    this.errorMessage.set('');

    this.registrationService
      .downloadCertificate(registration.registrationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${registration.eventTitle ?? 'event'}-certificate.pdf`;
          link.click();
          URL.revokeObjectURL(url);
          this.isDownloadingCertificate.set(false);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.isDownloadingCertificate.set(false);
        },
      });
  }

  private loadEvent(eventId: string): void {
    this.eventService
      .getEventById(eventId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          if (!event) {
            this.errorMessage.set('The requested event could not be found.');
          } else {
            this.event.set(event);
          }

          this.loading.set(false);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.loading.set(false);
        },
      });
  }

  private loadExistingRegistration(eventId: string): void {
    this.registrationService
      .getMyRegistrationForEvent(eventId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (registration) => {
          this.registration.set(registration);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
        },
      });
  }
}

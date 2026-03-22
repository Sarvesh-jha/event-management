import { DatePipe } from '@angular/common';
import { DestroyRef, computed, Component, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { DashboardSummary } from '../../core/models/analytics.model';
import { CampusEvent, EventFormPayload } from '../../core/models/event.model';
import { DashboardService } from '../../core/services/dashboard.service';
import { EventService } from '../../core/services/event.service';
import { RegistrationService } from '../../core/services/registration.service';
import { ChartCardComponent } from '../../shared/components/chart-card/chart-card.component';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [DatePipe, ReactiveFormsModule, ChartCardComponent],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss',
})
export class AdminDashboardPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly dashboardService = inject(DashboardService);
  private readonly eventService = inject(EventService);
  private readonly registrationService = inject(RegistrationService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly adminEvents = signal<CampusEvent[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly isPreviewMode = this.dashboardService.isPreviewMode;
  protected readonly editingEventId = signal('');
  protected readonly qrCodeToken = signal('');
  protected readonly qrCheckInMessage = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly isVerifyingCheckIn = signal(false);

  protected readonly modes = ['In Person', 'Hybrid', 'Virtual'] as const;
  protected readonly statuses = ['published', 'draft', 'completed'] as const;

  protected readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required]],
    shortDescription: ['', [Validators.required]],
    description: ['', [Validators.required]],
    category: ['Tech', [Validators.required]],
    department: ['Computer Science', [Validators.required]],
    venue: ['', [Validators.required]],
    mode: ['In Person' as CampusEvent['mode'], [Validators.required]],
    capacity: [100, [Validators.required, Validators.min(1)]],
    organizer: ['', [Validators.required]],
    keynote: [''],
    tags: ['AI, Campus'],
    coverGradient: ['linear-gradient(135deg, #0f766e 0%, #134e4a 45%, #f59e0b 100%)'],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    status: ['published' as NonNullable<CampusEvent['status']>, [Validators.required]],
  });

  protected readonly statCards = computed(() => {
    const summary = this.summary();

    if (!summary) {
      return [];
    }

    return [
      {
        label: 'Total events',
        value: summary.totalEvents,
        description: 'Events currently tracked',
      },
      {
        label: 'Registrations',
        value: summary.totalRegistrations,
        description: 'Student signups across the platform',
      },
      {
        label: 'Avg occupancy',
        value: `${summary.avgOccupancy}%`,
        description: 'Seat utilization across events',
      },
      {
        label: 'Check-in rate',
        value: `${summary.checkInRate}%`,
        description: 'Attendance conversion',
      },
    ];
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  protected submitEvent(): void {
    if (this.form.invalid) {
      this.errorMessage.set(
        'Fill all required event fields before saving, including start date and end date.',
      );
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formValue = this.form.getRawValue();

    if (new Date(formValue.endDate) <= new Date(formValue.startDate)) {
      this.errorMessage.set('End date must be after the start date.');
      this.isSubmitting.set(false);
      return;
    }

    const payload: EventFormPayload = {
      ...formValue,
      capacity: Number(formValue.capacity),
      tags: formValue.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      agenda: [],
    };

    const request$ = this.editingEventId()
      ? this.eventService.updateEvent(this.editingEventId(), payload)
      : this.eventService.createEvent(payload);

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set(
            this.editingEventId() ? 'Event updated successfully.' : 'Event created successfully.',
          );
          this.resetForm();
          this.loadDashboard();
          this.isSubmitting.set(false);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.isSubmitting.set(false);
        },
      });
  }

  protected editEvent(event: CampusEvent): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.editingEventId.set(event.id);
    this.form.patchValue({
      title: event.title,
      shortDescription: event.shortDescription,
      description: event.description,
      category: event.category,
      department: event.department,
      venue: event.venue,
      mode: event.mode,
      capacity: event.capacity,
      organizer: event.organizer,
      keynote: event.keynote ?? '',
      tags: event.tags.join(', '),
      coverGradient: event.coverGradient,
      startDate: this.toDatetimeLocal(event.startDate),
      endDate: this.toDatetimeLocal(event.endDate),
      status: event.status ?? 'published',
    });
  }

  protected deleteEvent(eventId: string): void {
    if (!window.confirm('Delete this event and all linked registrations?')) {
      return;
    }

    this.eventService
      .deleteEvent(eventId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set('Event deleted successfully.');
          this.loadDashboard();
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
        },
      });
  }

  protected markCompleted(eventId: string): void {
    this.eventService
      .completeEvent(eventId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set('Event marked as completed.');
          this.loadDashboard();
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
        },
      });
  }

  protected verifyCheckIn(): void {
    if (!this.qrCodeToken().trim()) {
      this.errorMessage.set('Enter a QR token before verifying check-in.');
      return;
    }

    this.isVerifyingCheckIn.set(true);
    this.qrCheckInMessage.set('');
    this.errorMessage.set('');

    this.registrationService
      .verifyCheckIn(this.qrCodeToken().trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (registration) => {
          this.qrCheckInMessage.set(
            `${registration.attendeeName} checked in successfully for ${registration.eventTitle}.`,
          );
          this.qrCodeToken.set('');
          this.isVerifyingCheckIn.set(false);
          this.loadDashboard();
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.isVerifyingCheckIn.set(false);
        },
      });
  }

  protected updateQrCodeToken(value: string): void {
    this.qrCodeToken.set(value);
  }

  protected chartLabels(points: Array<{ label: string; value: number }>): string[] {
    return points.map((point) => point.label);
  }

  protected chartValues(points: Array<{ label: string; value: number }>): number[] {
    return points.map((point) => point.value);
  }

  protected categoryWidth(count: number): number {
    const maximum = Math.max(...(this.summary()?.topCategories ?? []).map((item) => item.count), 1);
    return Math.round((count / maximum) * 100);
  }

  protected cancelEditing(): void {
    this.resetForm();
  }

  private loadDashboard(): void {
    this.loading.set(true);

    forkJoin({
      summary: this.dashboardService.getSummary(),
      events: this.eventService.getAdminEvents(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ summary, events }) => {
          this.summary.set(summary);
          this.adminEvents.set(events);
          this.loading.set(false);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.loading.set(false);
        },
      });
  }

  private resetForm(): void {
    this.editingEventId.set('');
    this.errorMessage.set('');
    this.form.reset({
      title: '',
      shortDescription: '',
      description: '',
      category: 'Tech',
      department: 'Computer Science',
      venue: '',
      mode: 'In Person',
      capacity: 100,
      organizer: '',
      keynote: '',
      tags: 'AI, Campus',
      coverGradient: 'linear-gradient(135deg, #0f766e 0%, #134e4a 45%, #f59e0b 100%)',
      startDate: '',
      endDate: '',
      status: 'published',
    });
  }

  private toDatetimeLocal(value: string): string {
    const date = new Date(value);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
  }
}

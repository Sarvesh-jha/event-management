import { DatePipe } from '@angular/common';
import { DestroyRef, Component, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { UserNotification } from '../../core/models/notification.model';
import { StudentRegistration } from '../../core/models/registration.model';
import { NotificationService } from '../../core/services/notification.service';
import { RegistrationService } from '../../core/services/registration.service';

@Component({
  selector: 'app-my-registrations-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './my-registrations-page.component.html',
  styleUrl: './my-registrations-page.component.scss',
})
export class MyRegistrationsPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly registrationService = inject(RegistrationService);
  private readonly notificationService = inject(NotificationService);

  protected readonly registrations = signal<StudentRegistration[]>([]);
  protected readonly notifications = signal<UserNotification[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly activeDownloadId = signal('');

  ngOnInit(): void {
    this.loadPage();
  }

  protected downloadCertificate(registration: StudentRegistration): void {
    this.activeDownloadId.set(registration.registrationId);

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
          this.activeDownloadId.set('');
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.activeDownloadId.set('');
        },
      });
  }

  protected markAsRead(notificationId: string): void {
    this.notificationService
      .markAsRead(notificationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notifications.update((items) =>
            items.map((item) =>
              item.id === notificationId ? { ...item, isRead: true } : item,
            ),
          );
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
        },
      });
  }

  private loadPage(): void {
    this.loading.set(true);

    this.registrationService
      .getMyRegistrations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (registrations) => {
          this.registrations.set(registrations);
          this.loading.set(false);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.loading.set(false);
        },
      });

    this.notificationService
      .getMyNotifications()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (notifications) => {
          this.notifications.set(notifications);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
        },
      });
  }
}

import { DestroyRef, computed, Component, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { CampusEvent } from '../../core/models/event.model';
import { AuthService } from '../../core/services/auth.service';
import { EventService } from '../../core/services/event.service';
import { EventCardComponent } from '../../shared/components/event-card/event-card.component';

@Component({
  selector: 'app-event-list-page',
  imports: [RouterLink, EventCardComponent],
  templateUrl: './event-list-page.component.html',
  styleUrl: './event-list-page.component.scss',
})
export class EventListPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventService = inject(EventService);
  private readonly authService = inject(AuthService);

  protected readonly events = signal<CampusEvent[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly searchTerm = signal('');
  protected readonly selectedCategory = signal('All');
  protected readonly isPreviewMode = this.eventService.isPreviewMode;
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly isAdmin = this.authService.isAdmin;

  protected readonly categories = computed(() => [
    'All',
    ...new Set(this.events().map((event) => event.category)),
  ]);

  protected readonly filteredEvents = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const category = this.selectedCategory();

    return this.events().filter((event) => {
      const matchesSearch =
        !search ||
        [event.title, event.shortDescription, event.department, event.venue]
          .join(' ')
          .toLowerCase()
          .includes(search);
      const matchesCategory = category === 'All' || event.category === category;

      return matchesSearch && matchesCategory;
    });
  });

  protected readonly spotlightEvent = computed(() => this.filteredEvents()[0] ?? null);
  protected readonly totalRegistrations = computed(() =>
    this.events().reduce((total, event) => total + event.registeredCount, 0),
  );
  protected readonly totalCapacity = computed(() =>
    this.events().reduce((total, event) => total + event.capacity, 0),
  );

  ngOnInit(): void {
    this.eventService
      .getEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (events) => {
          this.events.set(
            [...events].sort(
              (left, right) =>
                new Date(left.startDate).getTime() - new Date(right.startDate).getTime(),
            ),
          );
          this.loading.set(false);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.loading.set(false);
        },
      });
  }

  protected updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  protected updateCategory(value: string): void {
    this.selectedCategory.set(value);
  }
}

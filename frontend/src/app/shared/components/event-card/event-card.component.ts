import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CampusEvent } from '../../../core/models/event.model';

@Component({
  selector: 'app-event-card',
  imports: [DatePipe, RouterLink],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.scss',
})
export class EventCardComponent {
  readonly event = input.required<CampusEvent>();

  protected readonly occupancyRate = computed(() => {
    const currentEvent = this.event();
    return Math.min(
      100,
      Math.round((currentEvent.registeredCount / currentEvent.capacity) * 100),
    );
  });
}

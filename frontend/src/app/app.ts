import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { APP_NAME } from './core/config/api.config';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly authService = inject(AuthService);

  protected readonly appName = APP_NAME;
  protected readonly currentUser = this.authService.currentUser;
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly isAdmin = this.authService.isAdmin;
  protected readonly isStudent = computed(() => this.currentUser()?.role === 'student');
  protected readonly isPreviewMode = this.authService.isPreviewMode;
  protected readonly welcomeLabel = computed(
    () => this.currentUser()?.fullName ?? 'Campus guest',
  );

  protected logout(): void {
    this.authService.logout();
  }
}

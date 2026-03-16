import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'events',
  },
  {
    path: 'events',
    loadComponent: () =>
      import('./features/events/event-list-page.component').then(
        (module) => module.EventListPageComponent,
      ),
  },
  {
    path: 'events/:id',
    loadComponent: () =>
      import('./features/events/event-detail-page.component').then(
        (module) => module.EventDetailPageComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login-page.component').then(
        (module) => module.LoginPageComponent,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register-page.component').then(
        (module) => module.RegisterPageComponent,
      ),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-dashboard-page.component').then(
        (module) => module.AdminDashboardPageComponent,
      ),
  },
  {
    path: 'my-registrations',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/student/my-registrations-page.component').then(
        (module) => module.MyRegistrationsPageComponent,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found-page.component').then(
        (module) => module.NotFoundPageComponent,
      ),
  },
];

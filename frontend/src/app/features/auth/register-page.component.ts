import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
})
export class RegisterPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly departments = [
    'Computer Science',
    'Electronics',
    'School of Design',
    'Information Security',
    'Business Administration',
  ];

  protected readonly form = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    studentId: ['', [Validators.required, Validators.minLength(5)]],
    department: [this.departments[0], [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.controls.password.value !== this.form.controls.confirmPassword.value) {
      this.errorMessage.set('Passwords must match before creating the account.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const { confirmPassword, ...registrationPayload } = this.form.getRawValue();
    void confirmPassword;

    this.authService
      .register(registrationPayload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/events');
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.isSubmitting.set(false);
        },
      });
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  showPassword = false;
  loading = false;
  errorMessage = '';

  loginForm = this.fb.nonNullable.group({

    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(50)
      ]
    ],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(8)
      ]
    ]
  });

  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {

    if (this.loading) {
      return;
    }

    this.errorMessage = '';

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      return;
    }

    this.loading = true;

    this.authService.login(
      this.loginForm.getRawValue()
    ).pipe(

      finalize(() => {
        this.loading = false;
      })

    ).subscribe({

      next: response => {

        if (response.role !== 'ADMIN') {

          this.authService.logout();

          this.errorMessage =
            'No tienes permisos de administrador.';

          return;
        }

        this.router.navigate(['/admin/dashboard']);
      },

      error: error => {

        if (error.status === 401) {

          this.errorMessage =
            'Correo electrónico o contraseña incorrectos.';

        } else if (error.status === 400) {

          this.errorMessage =
            'Por favor, verifica tu información.';

        } else if (error.status === 0) {

          this.errorMessage =
            'No se pudo conectar con el servidor.';

        } else {

          this.errorMessage =
            'Ocurrió un error inesperado.';
        }
      }
    });
  }
}
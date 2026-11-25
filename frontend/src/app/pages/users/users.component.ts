import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators
} from '@angular/forms';

import {
  LucideAngularModule,
  Users,
  UserPlus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Power,
  Eye,
  EyeOff
} from 'lucide-angular';

import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User, Role } from '../../core/models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {

  private userService = inject(UserService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  readonly UsersIcon = Users;
  readonly AddIcon = UserPlus;
  readonly SearchIcon = Search;
  readonly EditIcon = Pencil;
  readonly DeleteIcon = Trash2;
  readonly RefreshIcon = RefreshCw;
  readonly CloseIcon = X;
  readonly SuccessIcon = CheckCircle;
  readonly ErrorIcon = AlertCircle;
  readonly PreviousIcon = ChevronLeft;
  readonly NextIcon = ChevronRight;
  readonly PowerIcon = Power;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;

  users: User[] = [];

  searchTerm = '';
  roleFilter = 'ALL';
  statusFilter = 'ALL';

  currentPage = 1;
  pageSize = 8;

  loading = false;
  saving = false;

  showModal = false;
  showDeleteModal = false;
  showStatusModal = false;
  showPassword = false;

  editingUser: User | null = null;
  selectedUser: User | null = null;

  successMessage = '';
  errorMessage = '';
  modalError = '';

  private readonly passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9\s])\S{8}$/;

  userForm = this.fb.nonNullable.group({

    name: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50)
    ]],

    email: ['', [
      Validators.required,
      Validators.email,
      Validators.maxLength(50)
    ]],

    phone: ['', [
      Validators.required,
      Validators.pattern(/^[0-9]{10}$/)
    ]],

    password: ['', [
      Validators.required,
      Validators.pattern(this.passwordPattern)
    ]],

    role: this.fb.nonNullable.control<Role>(
      'USER',
      Validators.required
    )
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  get currentUserId(): number | undefined {
    return this.authService.getSession()?.id;
  }

  get filteredUsers(): User[] {

    const search = this.searchTerm
      .trim().toLowerCase();

    return this.users.filter(user => {

      const matchesSearch =
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.phone.includes(search);

      const matchesRole =
        this.roleFilter === 'ALL' ||
        user.role === this.roleFilter;

      const matchesStatus =
        this.statusFilter === 'ALL' ||
        (this.statusFilter === 'ACTIVE' && user.active) ||
        (this.statusFilter === 'INACTIVE' && !user.active);

      return matchesSearch &&
        matchesRole &&
        matchesStatus;
    });
  }

  get totalPages(): number {

    return Math.max(
      1,
      Math.ceil(
        this.filteredUsers.length / this.pageSize
      )
    );
  }

  get paginatedUsers(): User[] {

    const start =
      (this.currentPage - 1) * this.pageSize;

    return this.filteredUsers.slice(
      start,
      start + this.pageSize
    );
  }

  resetPage(): void {
    this.currentPage = 1;
  }

  previousPage(): void {

    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {

    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  loadUsers(): void {

    this.loading = true;
    this.errorMessage = '';

    this.userService.getAll().subscribe({

      next: users => {

        this.users = users;

        this.currentPage = Math.min(
          this.currentPage,
          this.totalPages
        );

        this.loading = false;
      },

      error: () => {

        this.errorMessage =
          'No se pudieron cargar los usuarios.';

        this.loading = false;
      }
    });
  }

  openCreateModal(): void {

    this.editingUser = null;
    this.modalError = '';
    this.showPassword = false;

    this.userForm.reset({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'USER'
    });

    this.userForm.controls.password.setValidators([
      Validators.required,
      Validators.pattern(this.passwordPattern)
    ]);

    this.userForm.controls.password
      .updateValueAndValidity();

    this.showModal = true;
  }

  openEditModal(user: User): void {

    this.editingUser = user;
    this.modalError = '';
    this.showPassword = false;

    this.userForm.reset({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: '',
      role: user.role
    });

    this.userForm.controls.password.setValidators([
      Validators.pattern(this.passwordPattern)
    ]);

    this.userForm.controls.password
      .updateValueAndValidity();

    this.showModal = true;
  }

  closeModal(): void {

    if (this.saving) return;

    this.showModal = false;
    this.editingUser = null;
    this.modalError = '';
  }

  saveUser(): void {

    if (this.saving) return;

    this.modalError = '';

    if (this.userForm.invalid) {

      this.userForm.markAllAsTouched();
      return;
    }

    const form = this.userForm.getRawValue();

    const data = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone,
      password: form.password,
      role: form.role
    };

    if (data.name.length < 2) {

      this.modalError =
        'Ingresa un nombre válido.';

      return;
    }

    const editing = this.editingUser;

    this.saving = true;

    const request = editing
      ? this.userService.update(editing.id, {
          ...data,
          password: data.password || null
        })
      : this.userService.create(data);

    request.subscribe({

      next: () => {

        this.saving = false;

        this.notifySuccess(
          editing
            ? 'Usuario actualizado correctamente.'
            : 'Usuario registrado correctamente.'
        );

        const emailChanged =
          editing !== null &&
          editing.id === this.currentUserId &&
          editing.email.toLowerCase() !==
            data.email.toLowerCase();

        this.closeModal();

        if (emailChanged) {
          this.authService.logout();
          return;
        }

        this.loadUsers();
      },

      error: error => {

        this.saving = false;

        this.modalError = this.translateError(
          error,
          'No se pudo guardar el usuario.'
        );
      }
    });
  }

  openDeleteModal(user: User): void {

    if (user.id === this.currentUserId) return;

    this.selectedUser = user;
    this.modalError = '';
    this.showDeleteModal = true;
  }

  confirmDelete(): void {

    if (!this.selectedUser || this.saving) return;

    this.saving = true;
    this.modalError = '';

    this.userService.delete(
      this.selectedUser.id
    ).subscribe({

      next: () => {

        this.saving = false;
        this.showDeleteModal = false;
        this.selectedUser = null;

        this.notifySuccess(
          'Usuario eliminado correctamente.'
        );

        this.loadUsers();
      },

      error: error => {

        this.saving = false;

        this.modalError = this.translateError(
          error,
          'No se pudo eliminar el usuario.'
        );
      }
    });
  }

  openStatusModal(user: User): void {

    if (user.id === this.currentUserId) return;

    this.selectedUser = user;
    this.modalError = '';
    this.showStatusModal = true;
  }

  confirmStatus(): void {

    if (!this.selectedUser || this.saving) return;

    const active = !this.selectedUser.active;

    this.saving = true;
    this.modalError = '';

    this.userService.updateStatus(
      this.selectedUser.id,
      active
    ).subscribe({

      next: () => {

        this.saving = false;
        this.showStatusModal = false;
        this.selectedUser = null;

        this.notifySuccess(
          active
            ? 'Usuario activado correctamente.'
            : 'Usuario desactivado correctamente.'
        );

        this.loadUsers();
      },

      error: error => {

        this.saving = false;

        this.modalError = this.translateError(
          error,
          'No se pudo actualizar el estado del usuario.'
        );
      }
    });
  }

  closeConfirmation(): void {

    if (this.saving) return;

    this.showDeleteModal = false;
    this.showStatusModal = false;
    this.selectedUser = null;
    this.modalError = '';
  }

  notifySuccess(message: string): void {

    this.successMessage = message;

    setTimeout(() => {

      if (this.successMessage === message) {
        this.successMessage = '';
      }

    }, 4000);
  }

  // Traducción de errores del backend

  private translateError(
    error: any,
    fallback: string
  ): string {

    const message = String(
      error.error?.message ||
      error.error?.detail ||
      ''
    ).toLowerCase();

    if (
      message.includes('email') &&
      (
        message.includes('exist') ||
        message.includes('duplicate') ||
        message.includes('registered') ||
        message.includes('already') ||
        message.includes('in use')
      )
    ) {
      return 'El correo electrónico ya está registrado.';
    }

    if (
      message.includes('phone') &&
      (
        message.includes('exist') ||
        message.includes('duplicate') ||
        message.includes('registered') ||
        message.includes('already') ||
        message.includes('in use')
      )
    ) {
      return 'El número de teléfono ya está registrado.';
    }

    switch (error.status) {

      case 0:
        return 'No se pudo establecer conexión con el servidor.';

      case 400:
        return 'Los datos ingresados no son válidos o la operación no está permitida.';

      case 401:
        return 'Tu sesión ha expirado. Inicia sesión nuevamente.';

      case 403:
        return 'No tienes permisos para realizar esta operación.';

      case 404:
        return 'No se encontró el usuario solicitado.';

      case 409:
        return 'Existe un conflicto con los datos registrados. Verifica el correo y teléfono.';

      case 500:
        return 'Ocurrió un error interno en el servidor.';

      default:
        return fallback;
    }
  }
}

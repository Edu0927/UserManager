import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  LucideAngularModule,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  ArrowRight,
  RefreshCw
} from 'lucide-angular';

import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  private userService = inject(UserService);
  private authService = inject(AuthService);

  readonly UsersIcon = Users;
  readonly ActiveIcon = UserCheck;
  readonly InactiveIcon = UserX;
  readonly AdminIcon = ShieldCheck;
  readonly ArrowIcon = ArrowRight;
  readonly RefreshIcon = RefreshCw;

  users: User[] = [];

  loading = false;
  errorMessage = '';

  get adminName(): string {
    return this.authService.getSession()?.name
      || 'Administrator';
  }

  get totalUsers(): number {
    return this.users.length;
  }

  get activeUsers(): number {
    return this.users.filter(u => u.active).length;
  }

  get inactiveUsers(): number {
    return this.users.filter(u => !u.active).length;
  }

  get adminUsers(): number {
    return this.users.filter(
      u => u.role === 'ADMIN'
    ).length;
  }

  get activePercentage(): number {

    return this.totalUsers
      ? Math.round(
          this.activeUsers / this.totalUsers * 100
        )
      : 0;
  }

  get recentUsers(): User[] {

    return [...this.users]
      .sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      )
      .slice(0, 5);
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {

    if (this.loading) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.userService.getAll().subscribe({

      next: users => {
        this.users = users;
        this.loading = false;
      },

      error: () => {
        this.errorMessage =
          'No se pudo cargar la información del panel de administración.';

        this.loading = false;
      }
    });
  }
}
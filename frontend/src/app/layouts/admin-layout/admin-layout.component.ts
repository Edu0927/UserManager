import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import {
  LucideAngularModule,
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronDown
} from 'lucide-angular';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {

  authService = inject(AuthService);

  readonly DashboardIcon = LayoutDashboard;
  readonly UsersIcon = Users;
  readonly LogoutIcon = LogOut;
  readonly MenuIcon = Menu;
  readonly CloseIcon = X;
  readonly ShieldIcon = ShieldCheck;
  readonly ChevronIcon = ChevronDown;

  sidebarOpen = false;

  get session() {
    return this.authService.getSession();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  logout(): void {
    this.authService.logout();
  }
}

import { Routes } from '@angular/router';
import { authGuard } from '@/core/guards/auth.guard';
import { roleGuard } from '@/core/guards/role.guard';
import { UserRole } from '@/features/auth/services/auth.service';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./core/pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Home',
  },
  {
    path: 'sandbox',
    loadComponent: () => import('./core/pages/sandbox/sandbox.component').then((m) => m.SandboxComponent),
    title: 'Sandbox',
    canActivate: [authGuard, () => roleGuard([UserRole.SUPER_USER])],
  },
  {
    path: 'account',
    loadComponent: () => import('./core/pages/account/account.component').then((m) => m.AccountComponent),
    title: 'Account',
    canActivate: [authGuard],
  },
  {
    path: 'preferences',
    loadComponent: () => import('./core/pages/preferences/preferences.component').then((m) => m.PreferencesComponent),
    title: 'Preferences',
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login/login.component').then((m) => m.LoginComponent),
    title: 'Login',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/components/register/register.component').then((m) => m.RegisterComponent),
    title: 'Register',
  },
];

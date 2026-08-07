import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ConfirmEmailComponent } from './confirm-email/confirm-email.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ProfileComponent } from './profile/profile.component';
import { ConfirmDeleteAccountComponent } from './confirm-delete-account/confirm-delete-account.component';
import { AuthorApprovalsComponent } from '../admin/author-approvals/author-approvals.component';
import { UsersManagementComponent } from '../admin/users-management/users-management.component';
import { authGuard, adminGuard } from '../../core/guards/auth.guard';

export const authRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'confirm-email', component: ConfirmEmailComponent },
  { path: 'confirm-delete-account', component: ConfirmDeleteAccountComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'admin/author-approvals', component: AuthorApprovalsComponent, canActivate: [adminGuard] },
  { path: 'admin/users', component: UsersManagementComponent, canActivate: [adminGuard] }
];



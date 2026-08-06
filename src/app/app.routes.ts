import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ConfirmEmailComponent } from './features/auth/confirm-email/confirm-email.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { ProfileComponent } from './features/auth/profile/profile.component';
import { AuthPageComponent } from './features/auth/auth-page/auth-page.component';
import { InternshipComponent } from './features/internship/internship.component';
import { authGuard, authorGuard } from './core/guards/auth.guard';
import { AuthorApprovalsComponent } from './features/admin/author-approvals/author-approvals.component';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: InternshipComponent },
  { path: 'login', component: AuthPageComponent },
  { path: 'register', component: AuthPageComponent },
  { path: 'confirm-email', component: AuthPageComponent },
  { path: 'bloglar', component: BlogHomeComponent, data: { fixedType: 'Blog' } },
  { path: 'kose-yazilari', component: BlogHomeComponent, data: { fixedType: 'Koseyazisi' } },
  { path: 'post/:id', component: BlogDetailComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'confirm-email', component: ConfirmEmailComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'admin/author-approvals', component: AuthorApprovalsComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: 'login' }
];

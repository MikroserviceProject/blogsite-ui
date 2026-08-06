import { Routes } from '@angular/router';
import { BlogHomeComponent } from './features/blog/blog-home/blog-home.component';
import { BlogDetailComponent } from './features/blog/blog-detail/blog-detail.component';
import { PostCreateComponent } from './features/blog/post-create/post-create.component';
import { ProfileComponent } from './features/auth/profile/profile.component';
import { AuthPageComponent } from './features/auth/auth-page/auth-page.component';
import { InternshipComponent } from './features/internship/internship.component';
import { authGuard, authorGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: InternshipComponent },
  { path: 'login', component: AuthPageComponent },
  { path: 'register', component: AuthPageComponent },
  { path: 'confirm-email', component: AuthPageComponent },
  { path: 'bloglar', component: BlogHomeComponent, data: { fixedType: 'Blog' } },
  { path: 'kose-yazilari', component: BlogHomeComponent, data: { fixedType: 'Koseyazisi' } },
  { path: 'post/:id', component: BlogDetailComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'create-post', component: PostCreateComponent, canActivate: [authorGuard] },
  { path: '**', redirectTo: '' }
];

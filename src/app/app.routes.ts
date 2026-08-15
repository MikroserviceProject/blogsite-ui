import { Routes } from '@angular/router';
import { blogRoutes } from './features/blog/blog.routes';
import { authRoutes } from './features/auth/auth.routes';
import { socialRoutes } from './features/social/social.routes';

export const routes: Routes = [
  ...blogRoutes,
  ...authRoutes,
  ...socialRoutes,
  { path: '**', redirectTo: '' }
];

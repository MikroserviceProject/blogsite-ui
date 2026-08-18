import { Routes } from '@angular/router';
import { blogRoutes } from './features/blog/blog.routes';
import { authRoutes } from './features/auth/auth.routes';
import { socialRoutes } from './features/social/social.routes';

export const routes: Routes = [
  ...blogRoutes,
  ...authRoutes,
  ...socialRoutes,
  { path: 'architecture', loadComponent: () => import('./features/architecture-schema/architecture-schema.component').then(m => m.ArchitectureSchemaComponent) },

  { path: '**', redirectTo: '' }
];

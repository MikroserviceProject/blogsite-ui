import { Routes } from '@angular/router';
import { blogRoutes } from './features/blog/blog.routes';
import { authRoutes } from './features/auth/auth.routes';
import { socialRoutes } from './features/social/social.routes';

export const routes: Routes = [
  ...blogRoutes,
  ...authRoutes,
  ...socialRoutes,
  { path: 'architecture', loadComponent: () => import('./features/architecture-schema/architecture-schema.component').then(m => m.ArchitectureSchemaComponent) },
  { path: 'post-architecture', loadComponent: () => import('./features/post-architecture/post-architecture.component').then(m => m.PostArchitectureComponent) },
  { path: 'post-2', loadComponent: () => import('./features/post-flow/post-flow.component').then(m => m.PostFlowComponent) },
  { path: 'aut', loadComponent: () => import('./features/auth-flow/auth-flow.component').then(m => m.AuthFlowComponent) },
  { path: 'learning', loadComponent: () => import('./features/microservices-learning/microservices-learning.component').then(m => m.MicroservicesLearningComponent) },

  { path: '**', redirectTo: '' }
];

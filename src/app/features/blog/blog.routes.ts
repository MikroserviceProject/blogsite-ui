import { Routes } from '@angular/router';
import { BlogHomeComponent } from './blog-home/blog-home.component';
import { BlogDetailComponent } from './blog-detail/blog-detail.component';
import { PostCreateComponent } from './post-create/post-create.component';
import { DraftsComponent } from './drafts/drafts.component';
import { InternshipComponent } from '../internship/internship.component';
import { authorGuard } from '../../core/guards/auth.guard';

export const blogRoutes: Routes = [
  { path: '', component: InternshipComponent },
  { path: 'bloglar', component: BlogHomeComponent, data: { fixedType: 'Blog' } },
  { path: 'kose-yazilari', component: BlogHomeComponent, data: { fixedType: 'Koseyazisi' } },
  { path: 'post/:id', component: BlogDetailComponent },
  { path: 'create-post', component: PostCreateComponent, canActivate: [authorGuard] },
  { path: 'create-post/:id', component: PostCreateComponent, canActivate: [authorGuard] },
  { path: 'taslaklarim', component: DraftsComponent, canActivate: [authorGuard] }
];

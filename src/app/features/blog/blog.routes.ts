import { Routes } from '@angular/router';
import { BlogHomeComponent } from './blog-home/blog-home.component';
import { BlogDetailComponent } from './blog-detail/blog-detail.component';
import { PostCreateComponent } from './post-create/post-create.component';
import { InternshipComponent } from '../internship/internship.component';
import { HistoryComponent } from '../history/history.component';
import { TagDetailComponent } from './tag-detail/tag-detail.component';
import { authorGuard } from '../../core/guards/auth.guard';

export const blogRoutes: Routes = [
  { path: '', component: InternshipComponent },
  { path: 'bloglar', component: BlogHomeComponent, data: { fixedType: 'Blog' } },
  { path: 'kose-yazilari', component: BlogHomeComponent, data: { fixedType: 'Koseyazisi' } },
  { path: 'tarihce', component: HistoryComponent },
  { path: 'etiket/:tag', component: TagDetailComponent },
  { path: 'post/:id', component: BlogDetailComponent },
  { path: 'create-post', component: PostCreateComponent, canActivate: [authorGuard] },
  { path: 'create-post/:id', component: PostCreateComponent, canActivate: [authorGuard] }
];

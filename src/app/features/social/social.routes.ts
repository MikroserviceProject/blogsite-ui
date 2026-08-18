import { Routes } from '@angular/router';
import { PublicProfileComponent } from './public-profile/public-profile.component';

export const socialRoutes: Routes = [
  { path: 'profile/:username', component: PublicProfileComponent }
];

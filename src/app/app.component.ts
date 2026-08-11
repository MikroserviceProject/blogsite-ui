import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { ToastComponent } from './shared/toast/toast.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    ToastComponent
  ],
  template: `
    @if (authService.isBanned()) {
      <div class="global-ban-overlay">
        <div class="ban-modal">
          <div class="ban-icon"></div>
          <h1>Hesabınız Askıya Alındı</h1>
          <p>Sistem kurallarını ihlal ettiğiniz veya yöneticiler tarafından kısıtlandığınız için hesabınız yasaklanmıştır.</p>
          <button class="btn btn-danger" (click)="logout()">🚪 Çıkış Yap</button>
        </div>
      </div>
    } @else {

      <app-navbar></app-navbar>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
      <app-toast></app-toast>
    }
  `,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'AuthFrontend';
  authService = inject(AuthService);

  logout() {
    this.authService.logout();
  }
}

import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private storageKey = 'lumina_theme';
  theme = signal<'light' | 'dark'>(this.getInitialTheme());

  constructor() {
    this.applyTheme(this.theme());
  }

  private getInitialTheme(): 'light' | 'dark' {
    const saved = localStorage.getItem(this.storageKey);
    return saved === 'light' ? 'light' : 'dark';
  }

  toggle() {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem(this.storageKey, next);
    this.applyTheme(next);
  }

  private applyTheme(theme: 'light' | 'dark') {
    document.documentElement.classList.toggle('light-theme', theme === 'light');
  }
}

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
    if (saved === 'light') return 'light';
    return 'dark'; // default
  }

  toggle() {
    const current = this.theme();
    const next = current === 'light' ? 'dark' : 'light';
    
    this.theme.set(next);
    localStorage.setItem(this.storageKey, next);
    this.applyTheme(next);
  }

  private applyTheme(theme: 'light' | 'dark') {
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.documentElement.classList.add(`${theme}-theme`);
  }
}

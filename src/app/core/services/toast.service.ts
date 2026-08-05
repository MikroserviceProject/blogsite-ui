import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(type: 'success' | 'error' | 'info' | 'warning', title: string, message: string, durationMs: number = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, type, title, message };
    
    this.toasts.update(current => [...current, toast]);

    setTimeout(() => {
      this.remove(id);
    }, durationMs);
  }

  success(title: string, message: string) {
    this.show('success', title, message);
  }

  error(title: string, message: string) {
    this.show('error', title, message);
  }

  info(title: string, message: string) {
    this.show('info', title, message);
  }

  warning(title: string, message: string) {
    this.show('warning', title, message);
  }

  remove(id: string) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}

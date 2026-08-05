import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [ngClass]="'toast-' + toast.type">
          <div class="toast-icon">
            @if (toast.type === 'success') { <span>✅</span> }
            @else if (toast.type === 'error') { <span>❌</span> }
            @else if (toast.type === 'warning') { <span>⚠️</span> }
            @else { <span>ℹ️</span> }
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="toastService.remove(toast.id)">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
      width: 100%;
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      background: #ffffff;
      border-radius: var(--radius-md);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      border-left: 4px solid #64748b;
      padding: 14px 16px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid var(--border);
    }

    .toast-success { border-left: 4px solid var(--success); }
    .toast-error { border-left: 4px solid var(--danger); }
    .toast-warning { border-left: 4px solid var(--warning); }
    .toast-info { border-left: 4px solid var(--primary); }

    .toast-icon {
      font-size: 16px;
      margin-top: 1px;
    }

    .toast-content {
      flex: 1;
    }

    .toast-title {
      font-family: var(--font-heading);
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 2px;
    }

    .toast-message {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      color: var(--text-light);
      cursor: pointer;
      font-size: 14px;
      padding: 2px 4px;
      border-radius: 4px;
      transition: var(--transition);
    }

    .toast-close:hover {
      color: var(--text-primary);
      background: var(--bg-subtle);
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}

import { Component, inject } from '@angular/core';
import { ToastService } from '@core/notification/toast.service';
import { ToastItemComponent } from './toast-item.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [ToastItemComponent],
  template: `
    <div class="toast-region" role="region" aria-label="Notifications" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <app-toast-item [toast]="toast" (dismiss)="toastService.dismiss(toast.id)" />
      }
    </div>
  `,
  styles: [`
    .toast-region {
      position: fixed;
      top: 1rem;
      right: 1rem;
      left: 1rem;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: .625rem;
      pointer-events: none;
    }
    .toast-region > * { pointer-events: auto; }

    @media (min-width: 640px) {
      .toast-region {
        left: auto;
        width: 22rem;
      }
    }
  `],
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}

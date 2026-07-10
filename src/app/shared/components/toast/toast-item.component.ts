import { Component, input, output } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Toast, ToastType } from '@shared/models/model';

interface ToastPalette {
  icon: string;
  iconColor: string;
  iconBg: string;
  accent: string;
}

const PALETTE: Record<ToastType, ToastPalette> = {
  success: { icon: '@tui.check',          iconColor: '#10B981', iconBg: '#ECFDF5', accent: '#10B981' },
  error:   { icon: '@tui.x',              iconColor: '#DC2626', iconBg: '#FEF2F2', accent: '#DC2626' },
  warning: { icon: '@tui.triangle-alert', iconColor: '#C9920D', iconBg: '#FDF4DC', accent: '#C9920D' },
  info:    { icon: '@tui.info',           iconColor: '#1B4F8A', iconBg: '#E5EEF8', accent: '#1B4F8A' },
};

@Component({
  selector: 'app-toast-item',
  standalone: true,
  imports: [TuiIcon, TranslatePipe],
  template: `
    <div class="toast" [style.--accent]="palette().accent" role="alert">
      <div class="toast-icon" [style.background]="palette().iconBg" [style.color]="palette().iconColor">
        <tui-icon [icon]="palette().icon" class="w-4 h-4" />
      </div>

      <p class="toast-msg">{{ toast().message }}</p>

      <button (click)="dismiss.emit()" class="toast-close" [attr.aria-label]="'common.close' | translate">
        <tui-icon icon="@tui.x" class="w-3.5 h-3.5" />
      </button>

      <div class="toast-progress"></div>
    </div>
  `,
  styles: [`
    .toast {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: .75rem;
      padding: .875rem 1rem;
      border-radius: 1rem;
      background: #FFFFFF;
      box-shadow: 0 12px 32px -8px rgba(15, 34, 64, .22), 0 2px 8px rgba(15, 34, 64, .08);
      overflow: hidden;
      animation: toastSlideIn .25s cubic-bezier(.16,1,.3,1);
    }

    .toast-icon {
      flex-shrink: 0;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: .0625rem;
    }

    .toast-msg {
      flex: 1;
      margin: 0;
      padding-top: .1875rem;
      font-size: .875rem;
      font-weight: 500;
      line-height: 1.4;
      color: #0F172A;
    }

    .toast-close {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      margin-top: .0625rem;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: #94A3B8;
      cursor: pointer;
      transition: background .15s, color .15s;
    }
    .toast-close:hover { background: #F1F5F9; color: #0F172A; }

    .toast-progress {
      position: absolute;
      left: 0;
      bottom: 0;
      height: 2px;
      width: 100%;
      background: var(--accent);
      opacity: .35;
      transform-origin: left;
      animation: toastShrink 4s linear forwards;
    }

    @keyframes toastSlideIn {
      from { transform: translateX(24px); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }

    @keyframes toastShrink {
      from { transform: scaleX(1); }
      to   { transform: scaleX(0); }
    }
  `],
})
export class ToastItemComponent {
  readonly toast   = input.required<Toast>();
  readonly dismiss = output<void>();

  protected palette(): ToastPalette {
    return PALETTE[this.toast().type] ?? PALETTE.info;
  }
}

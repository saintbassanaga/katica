import { Component, input, output, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  styles: [`
    @keyframes dialogPop {
      from { opacity: 0; scale: .97; }
      to   { opacity: 1; scale: 1; }
    }
    @media (min-width: 768px) {
      .dialog-pop-md { animation: dialogPop .2s cubic-bezier(.22,1,.36,1) both; }
    }
    @media (prefers-reduced-motion: reduce) {
      .dialog-pop-md { animation: none; }
    }
  `],
  template: `
    @if (open()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/40 z-40 animate-fade-in"
        (click)="close.emit()"
        aria-hidden="true"
      ></div>

      <!-- Mobile: bottom sheet — Desktop: centered dialog -->
      <div
        #sheet
        class="dialog-pop-md fixed z-50 bg-white overflow-y-auto
               bottom-0 left-0 right-0 max-h-[90vh] rounded-t-3xl shadow-2xl animate-slide-up
               md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
               md:w-full md:max-w-md md:max-h-[85vh] md:rounded-3xl md:animate-none"
        role="dialog"
        [attr.aria-label]="title()"
      >
        <!-- Handle (mobile only) -->
        <div class="flex justify-center pt-3 pb-1 md:hidden">
          <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        @if (title()) {
          <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
            <h3 class="text-base font-semibold text-gray-900">{{ title() }}</h3>
            <button
              type="button"
              class="hidden md:flex shrink-0 w-8 h-8 rounded-full items-center justify-center text-gray-400 border-none bg-transparent cursor-pointer transition-colors hover:bg-gray-100 hover:text-gray-600"
              (click)="close.emit()"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        }

        <div class="p-5">
          <ng-content />
        </div>
      </div>
    }
  `,
})
export class BottomSheetComponent {
  readonly open = input<boolean>(false);
  readonly title = input<string>('');
  readonly close = output<void>();

  @ViewChild('sheet') sheetRef?: ElementRef<HTMLElement>;
}

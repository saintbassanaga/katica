import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TuiIcon } from '@taiga-ui/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NotificationStore } from '@features/notifications/notification.store';
import { NavItem } from '@shared/models/model';

const NAV_ITEMS: NavItem[] = [
  { key: 'home',          route: '/dashboard'     },
  { key: 'escrow',        route: '/escrow'        },
  { key: 'wallet',        route: '/wallet'        },
  { key: 'notifications', route: '/notifications' },
  { key: 'profile',       route: '/profile'       },
];

const ICON_MAP: Record<string, string> = {
  home:          '@tui.home',
  escrow:        '@tui.arrow-up-down',
  wallet:        '@tui.wallet',
  disputes:      '@tui.triangle-alert',
  payouts:       '@tui.circle-arrow-up',
  profile:       '@tui.user',
  notifications: '@tui.bell',
};

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TuiIcon, TranslatePipe],
  styles: [':host { display: block; }'],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 z-50 bg-white/88 backdrop-blur-lg backdrop-saturate-180 border-t border-slate-200/80 safe-area-bottom" aria-label="Navigation principale">
      <div class="flex items-stretch h-15">
        @for (item of navItems; track item.route) {
          <a [routerLink]="item.route"
             routerLinkActive="nav-active"
             class="flex-1 flex flex-col items-center justify-center gap-0.75 text-slate-400 no-underline transition-colors relative min-h-11 hover:text-slate-500 [&.nav-active]:text-primary"
             [attr.aria-label]="'nav.' + item.key | translate">
            <div class="nav-icon w-9 h-7 flex items-center justify-center rounded-[10px] transition-colors in-[.nav-active]:bg-primary/10 relative">
              <tui-icon [icon]="iconMap[item.key]" class="w-5 h-5" />
              @if (item.key === 'notifications' && notifStore.unreadCount() > 0) {
                <span class="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-0.5 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {{ notifStore.unreadCount() > 99 ? '99+' : notifStore.unreadCount() }}
                </span>
              }
            </div>
            <span class="text-[.625rem] font-semibold tracking-[.02em]">{{ 'nav.' + item.key | translate }}</span>
          </a>
        }
      </div>
    </nav>
  `,
})
export class BottomNavComponent implements OnInit {
  protected readonly notifStore = inject(NotificationStore);
  protected readonly navItems   = NAV_ITEMS;
  protected readonly iconMap    = ICON_MAP;

  ngOnInit(): void {
    this.notifStore.loadUnreadCount();
  }
}

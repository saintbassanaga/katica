import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { StompSubscription } from '@stomp/stompjs';
import { NotificationService } from './notification.service';
import { StompService } from '@core/websocket/stomp.service';

export const NotificationStore = signalStore(
  { providedIn: 'root' },
  withState({ unreadCount: 0 }),
  withMethods((store, svc = inject(NotificationService), stomp = inject(StompService)) => {
    let notifSub: StompSubscription | null = null;

    return {
      loadUnreadCount(): void {
        svc.getUnreadCount().subscribe(r => patchState(store, { unreadCount: r.count }));
      },
      decrement(): void {
        patchState(store, { unreadCount: Math.max(0, store.unreadCount() - 1) });
      },
      resetCount(): void {
        patchState(store, { unreadCount: 0 });
      },
      async connectWs(userId: string): Promise<void> {
        if (notifSub) return;
        try {
          await stomp.connect();
          const dest = `/user/${userId}/queue/notifications`;
          notifSub = stomp.subscribe(dest);
          stomp.on(dest).subscribe(() =>
            patchState(store, { unreadCount: store.unreadCount() + 1 })
          );
        } catch { /* WS unavailable */ }
      },
    };
  }),
);

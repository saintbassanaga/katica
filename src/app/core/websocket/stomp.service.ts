import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable, Subject, filter, firstValueFrom, map, share } from 'rxjs';
import { environment } from '@env/environment';
import { StompMessage } from '@shared/models/model';
import { AuthService } from '@core/auth/auth.service';

// Minimum time between two refresh attempts triggered from beforeConnect.
// stompjs retries every `reconnectDelay` (5s) while disconnected — without
// this guard a stale ACCESS_TOKEN cookie would trigger a refresh call on
// every single retry for as long as the outage lasts.
const REFRESH_COOLDOWN_MS = 20_000;

@Injectable({ providedIn: 'root' })
export class StompService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  private client: Client | undefined;
  private readonly messages$ = new Subject<StompMessage>();
  private connectPromise: Promise<void> | null = null;
  private lastRefreshAttempt = 0;

  // stompjs hands the Client a brand-new internal handler on every reconnect,
  // which silently drops all previously-registered subscriptions. Tracking
  // destinations here lets onConnect re-issue them after every reconnect,
  // not just the first connect.
  private readonly activeSubscriptions = new Map<string, StompSubscription>();

  get connected(): boolean {
    return this.client?.connected ?? false;
  }

  connect(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise(async (resolve, reject) => {
      const SockJS = (await import('sockjs-client')).default;
      this.client = new Client({
        webSocketFactory: () => new SockJS(environment.wsUrl),
        reconnectDelay: 5000,
        // Runs before the initial connect AND every automatic reconnect.
        // The ACCESS_TOKEN cookie (BFF_ACCESS_TOKEN_TTL, 30 min default) can
        // expire while the WS session is idle; if the socket then drops for
        // any reason (network blip, backgrounded tab, backend redeploy), the
        // reconnect handshake would otherwise carry a stale cookie and get
        // 401'd by ResourceSecurityConfig before ever reaching STOMP — killing
        // live updates permanently since nothing else refreshes it for the WS
        // path (the HttpClient 401-interceptor never sees this connection).
        beforeConnect: () => this.ensureFreshToken(),
        onConnect: () => {
          this.resubscribeAll();
          resolve();
        },
        onStompError: frame => {
          this.connectPromise = null;
          reject(new Error(frame.headers['message']));
        },
        onWebSocketError: err => {
          this.connectPromise = null;
          reject(err);
        },
      });
      this.client.activate();
    });

    return this.connectPromise;
  }

  on<T>(destination: string): Observable<T> {
    return this.messages$.pipe(
      filter(msg => msg.destination === destination),
      map(msg => msg.body as T),
      share(),
    );
  }

  subscribe(destination: string): StompSubscription {
    if (!this.client) throw new Error('StompService: call connect() before subscribe()');
    this.doSubscribe(destination);
    return {
      id: destination,
      unsubscribe: () => {
        this.activeSubscriptions.get(destination)?.unsubscribe();
        this.activeSubscriptions.delete(destination);
      },
    };
  }

  publish(destination: string, body: object): void {
    if (!this.client?.connected) throw new Error('not_connected');
    this.client.publish({ destination, body: JSON.stringify(body) });
  }

  disconnect(): void {
    this.connectPromise = null;
    this.activeSubscriptions.clear();
    this.client?.deactivate();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  /**
   * Best-effort refresh of the ACCESS_TOKEN cookie before a (re)connect attempt.
   * Never throws — if refresh fails (e.g. the session is genuinely gone), the
   * WS handshake is left to fail on its own and stompjs's normal reconnect
   * loop takes over. A `beforeConnect` hook that rejects would abort that
   * loop entirely (no `_stompHandler` gets created to schedule the next
   * retry), so any error here must be swallowed.
   */
  private async ensureFreshToken(): Promise<void> {
    const now = Date.now();
    if (now - this.lastRefreshAttempt < REFRESH_COOLDOWN_MS) return;
    this.lastRefreshAttempt = now;
    try {
      await firstValueFrom(this.authService.refreshToken());
    } catch {
      // Swallowed by design — see method doc.
    }
  }

  /** Re-issues every tracked subscription against the current (post-reconnect) client. */
  private resubscribeAll(): void {
    for (const destination of this.activeSubscriptions.keys()) {
      this.doSubscribe(destination);
    }
  }

  private doSubscribe(destination: string): void {
    if (!this.client) return;
    const sub = this.client.subscribe(destination, (frame: IMessage) => {
      this.messages$.next({
        destination,
        body: JSON.parse(frame.body),
      });
    });
    this.activeSubscriptions.set(destination, sub);
  }
}

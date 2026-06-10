import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable, Subject, filter, map, share } from 'rxjs';
import { environment } from '@env/environment';
import { StompMessage } from '@shared/models/model';

@Injectable({ providedIn: 'root' })
export class StompService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private client: Client | undefined;
  private readonly messages$ = new Subject<StompMessage>();
  private connectPromise: Promise<void> | null = null;

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
        onConnect: () => resolve(),
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
    return this.client.subscribe(destination, (frame: IMessage) => {
      this.messages$.next({
        destination,
        body: JSON.parse(frame.body),
      });
    });
  }

  publish(destination: string, body: object): void {
    if (!this.client?.connected) throw new Error('not_connected');
    this.client.publish({ destination, body: JSON.stringify(body) });
  }

  disconnect(): void {
    this.connectPromise = null;
    this.client?.deactivate();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}

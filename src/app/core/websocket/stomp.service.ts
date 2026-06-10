import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable, Subject, filter, map, share } from 'rxjs';
import { environment } from '@env/environment';
import { StompMessage } from '@shared/models/model';

@Injectable({ providedIn: 'root' })
export class StompService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private client!: Client;
  private readonly messages$ = new Subject<StompMessage>();
  private connectPromise: Promise<void> | null = null;

  connect(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise(async (resolve, reject) => {
      const SockJS = (await import('sockjs-client')).default;
      this.client = new Client({
        webSocketFactory: () => new SockJS(environment.wsUrl),
        reconnectDelay: 5000,
        onConnect: () => resolve(),
        onStompError: frame => reject(new Error(frame.headers['message'])),
        onWebSocketError: err => reject(err),
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
    return this.client.subscribe(destination, (frame: IMessage) => {
      this.messages$.next({
        destination,
        body: JSON.parse(frame.body),
      });
    });
  }

  publish(destination: string, body: object): void {
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

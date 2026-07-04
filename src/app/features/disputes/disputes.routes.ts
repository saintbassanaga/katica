import { inject } from '@angular/core';
import { Routes, Router } from '@angular/router';
import { AuthStore } from '@core/auth/auth.store';

export const DISPUTE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/dispute-list.component').then(m => m.DisputeListComponent),
  },
  {
    path: 'new',
    canActivate: [() => {
      const auth = inject(AuthStore);
      const router = inject(Router);
      return auth.isSeller() ? router.createUrlTree(['/disputes']) : true;
    }],
    loadComponent: () => import('./create/dispute-create.component').then(m => m.DisputeCreateComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./chat/dispute-chat.component').then(m => m.DisputeChatComponent),
  },
];

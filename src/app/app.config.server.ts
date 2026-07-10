import { mergeApplicationConfig, ApplicationConfig, REQUEST, inject } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { WA_ANIMATION_FRAME } from '@ng-web-apis/common';
import { NEVER } from 'rxjs';
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // @ng-web-apis/common : requestAnimationFrame n'existe pas en Node.js
    { provide: WA_ANIMATION_FRAME, useValue: NEVER },
    // HttpClient ne peut pas résoudre d'URL relative pendant le SSR :
    // on force une URL absolue à partir de la requête entrante.
    // En local ("localhost"), certains rendus internes d'Angular (découverte
    // des routes de prerender) génèrent une URL sans port explicite — on
    // retombe alors sur le port du dev server plutôt que le port 80 par
    // défaut, qui peut être occupé par un tout autre service sur la machine.
    {
      provide: TRANSLATE_HTTP_LOADER_CONFIG,
      useFactory: () => {
        const req = inject(REQUEST, { optional: true });
        const url = req ? new URL(req.url) : null;
        const devOrigin = process.env['CLIENT_ORIGIN'] ?? 'http://localhost:4200';
        const origin = (!url || url.hostname === 'localhost') ? devOrigin : url.origin;
        return { prefix: `${origin}/i18n/`, useHttpBackend: true };
      },
    },
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);

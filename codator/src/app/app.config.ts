import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { API_STRATEGY, ApiStrategyProvider } from './api-strategy-provider';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: API_STRATEGY,
      useClass: ApiStrategyProvider,
    },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
  ],
};

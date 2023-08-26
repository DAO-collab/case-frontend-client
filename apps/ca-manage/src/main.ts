import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import * as Sentry from '@sentry/angular-ivy';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.PRODUCTION) {
  enableProdMode();
}

if (!(location.hostname.includes('localhost') || location.hostname.includes('codebuild.dev'))) {
  let ignoreError: boolean = false;

  Sentry.init({
    beforeBreadcrumb: response => {
      if (response?.category === 'xhr' && response?.data?.['status_code']) {
        const resultString = response.data['status_code']?.toString();
        ignoreError = ['1', '2', '3', '4', '5'].some(symbol => resultString?.startsWith(symbol));
      } else {
        ignoreError = false;
      }

      return response;
    },
    beforeSend: (event, hint) => {
      if (ignoreError) {
        return null;
      }

      return event;
    },
    dsn: 'https://ecdf77bb614346939c9cf1d87a672be5@o4505263941222400.ingest.sentry.io/4505309604020224',
    ignoreErrors: ['Non-Error exception captured'],
    environment: environment.PRODUCTION ? 'production' : location.hostname.includes('stage') ? 'stage' : 'develop',
    // environment: 'localhost',
    integrations: [
      new Sentry.BrowserTracing({
        // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
        // tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
        routingInstrumentation: Sentry.routingInstrumentation
      }),
      new Sentry.Replay()
    ],

    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0
  });
}

platformBrowserDynamic().bootstrapModule(AppModule);

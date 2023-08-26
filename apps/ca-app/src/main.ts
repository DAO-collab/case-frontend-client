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
      } else if (response?.type === 'http') {
        ignoreError = true;
      } else {
        ignoreError = false;
      }

      return response;
    },
    beforeSend: (event, hint) => {
      if (
        ignoreError ||
        event?.message?.includes('Http failure response for')
      ) {
        return null;
      }

      return event;
    },
    dsn: 'https://7c708363ac7d4c5db8c76dd570549329@o4505263941222400.ingest.sentry.io/4505309605068800',
    ignoreErrors: [
      'Non-Error exception captured',
      'Uncaught (in promise): AbortError: Starting videoinput failed',
      'Uncaught (in promise): NotReadableError: Could not start video source'
    ],
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

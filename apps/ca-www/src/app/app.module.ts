import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { LayoutModule } from '@angular/cdk/layout';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppComponent } from './app.component';
import { SharedModule } from './common/shared.module';
import { RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module } from 'ng-recaptcha';
import { CookieService } from 'ngx-cookie-service';

import { environment } from '@www-src/environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { MainModule } from './main/main.module';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        // useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'options/', '/translations/ang.json'),
        // useFactory: HttpLoaderFactory,
        useFactory: (http: HttpClient) =>
          new MultiTranslateHttpLoader(http, [
            { prefix: 'opts/', suffix: '/translations/ang.json' },
            { prefix: 'opts/', suffix: '/docs/metadata.json' }
          ]),
        deps: [HttpClient]
      }
    }),
    HttpClientModule,
    LayoutModule,
    MainModule,
    SharedModule,
    RecaptchaV3Module
  ],
  providers: [
    CookieService,
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.RECAPTCHA_KEY
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

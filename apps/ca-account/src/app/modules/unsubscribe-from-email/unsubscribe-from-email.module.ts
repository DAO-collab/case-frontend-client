import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { UnsubscribeFromEmailComponent } from './unsubscribe-from-email.component';
import { UnsubscribeFromEmailRoutingModule } from './unsubscribe-from-email-routing.module';

@NgModule({
  declarations: [UnsubscribeFromEmailComponent],
  exports: [UnsubscribeFromEmailComponent],
  imports: [
    CommonModule,
    UnsubscribeFromEmailRoutingModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'opts/', '/translations/ang.json'),
        deps: [HttpClient]
      }
    })
  ]
})
export class UnsubscribeFromEmailModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';

import { IntegrationRoutingModule } from './integration-routing.module';
import { SharedModule } from '../../shared/shared.module';

import { ImportsComponent } from './imports/imports.component';
import { ImportComponent } from './import/import.component';
import { KeysComponent } from './keys/keys.component';
import { WebhooksComponent } from './webhooks/webhooks.component';

@NgModule({
  imports: [CommonModule, IntegrationRoutingModule, SharedModule, NgxMaskDirective, NgxMaskPipe],
  declarations: [ImportsComponent, ImportComponent, KeysComponent, WebhooksComponent],
  providers: [provideNgxMask()]
})
export class IntegrationModule {}

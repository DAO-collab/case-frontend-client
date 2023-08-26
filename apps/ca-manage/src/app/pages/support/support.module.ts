import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { ButtonComponent } from '@ca/ui';

import { SharedModule } from '../../shared/shared.module';
import { CheckboxSelectModule } from '../../common/components/checkbox-select/checkbox-select.module';
import { SupportComponent } from './support.component';
import { CreateTicketModalComponent } from './create-ticket-modal/create-ticket-modal.component';
import { ViewTicketModalComponent } from './view-ticket-modal/view-ticket-modal.component';
import { NumberFieldModule } from '../../common/directives/number-field/number-field.module';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';

export const routes: Routes = [{ path: '', component: SupportComponent }];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule, CheckboxSelectModule, NumberFieldModule, ButtonComponent, NgxIntlTelInputModule],
  declarations: [SupportComponent, CreateTicketModalComponent, ViewTicketModalComponent]
})
export class SupportModule {}

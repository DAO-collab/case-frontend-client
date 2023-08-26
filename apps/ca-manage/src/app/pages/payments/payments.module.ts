import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { CopyComponent } from '@ca/ui';
import { SlideToggleModule } from 'ngx-slide-toggle';
import { ButtonComponent, ToggleComponent } from '@ca/ui';

import { GuardService } from '../../services/guard.service';
import { InvoicesComponent } from './invoices/invoices.component';
import { SettingsComponent } from './settings/settings.component';
import { SharedModule } from '../../shared/shared.module';
import { RefundPopupComponent } from './invoices/refund-popup/refund-popup.component';

const routes: Routes = [
  { path: '', component: InvoicesComponent, canActivate: [GuardService] },
  { path: 'settings', component: SettingsComponent, canActivate: [GuardService] }
];

@NgModule({
  declarations: [InvoicesComponent, SettingsComponent, RefundPopupComponent],
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule, SlideToggleModule, ButtonComponent, ToggleComponent, CopyComponent]
})
export class PagesModule {}

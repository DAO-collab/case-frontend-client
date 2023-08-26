import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CopyComponent } from '@ca/ui';
import { UsersRoutingModule } from './users-routing.module';
import { SharedModule } from '../../shared/shared.module';
import {NgxIntlTelInputModule} from 'ngx-intl-tel-input';
// Components
import { UsersComponent } from './users.component';
import { EditUserComponent } from './edit-user/edit-user.component';
import { ViewCasesComponent } from './view-cases/view-cases.component';

@NgModule({
  imports: [CommonModule, UsersRoutingModule, SharedModule, CopyComponent, NgxIntlTelInputModule],
  declarations: [UsersComponent, EditUserComponent, ViewCasesComponent]
})
export class UsersModule {}

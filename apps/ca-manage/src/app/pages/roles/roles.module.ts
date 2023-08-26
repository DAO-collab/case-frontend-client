import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RolesRoutingModule } from './roles-routing.module';
import { SharedModule } from '../../shared/shared.module';

// Components
import { RolesComponent } from './roles.component';
import { EditRoleComponent } from './edit-role/edit-role.component';
import { AddRoleComponent } from './add-role/add-role.component';

@NgModule({
  imports: [CommonModule, RolesRoutingModule, SharedModule],
  declarations: [RolesComponent, EditRoleComponent, AddRoleComponent]
})
export class RolesModule {}

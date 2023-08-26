import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { ButtonComponent, TimeSelectorComponent } from '@ca/ui';

import { AnnouncementsComponent } from './announcements.component';
import { SharedModule } from '../../shared/shared.module';
import { CreateAnnouncementModalComponent } from './create-announcement-modal/create-announcement-modal.component';
import { CheckboxSelectModule } from '../../common/components/checkbox-select/checkbox-select.module';

export const routes: Routes = [{ path: '', component: AnnouncementsComponent }];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule, CheckboxSelectModule, ButtonComponent, TimeSelectorComponent],
  declarations: [AnnouncementsComponent, CreateAnnouncementModalComponent]
})
export class AnnouncementsModule {}

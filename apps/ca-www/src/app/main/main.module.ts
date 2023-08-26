import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { MainComponent } from './main.component';

import { PopInNotificationsModule } from '../common/components/pop-in-notifications/pop-in-notifications.module';
import { NavigationModule } from '../common/components/navigation/navigation.module';
import { FooterModule } from '../common/components/footer/footer.module';
import { CallToActionModule } from '../common/components/call-to-action/call-to-action.module';
import { NotifyMeModalModule } from '../common/components/notify-me-modal/notify-me-modal.module';
import { ServerErrorModalModule } from '../common/components/server-error-modal/server-error-modal.module';
import { AuthModule } from '../auth/auth.module';
import { PopUpFormWrapperModule } from '../common/components/pop-up-form-wrapper/pop-up-form-wrapper.module';

@NgModule({
  declarations: [MainComponent],
  imports: [
    CommonModule,
    TranslateModule,
    PopInNotificationsModule,
    NavigationModule,
    FooterModule,
    CallToActionModule,
    NotifyMeModalModule,
    ServerErrorModalModule,
    AuthModule,
    PopUpFormWrapperModule
  ],
  exports: [MainComponent]
})
export class MainModule {}

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { ButtonComponent, ToggleComponent } from '@ca/ui';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SlideToggleModule } from 'ngx-slide-toggle';

import { AlwaysAuthGuard } from '../../services/user.service';
import { SharedModule } from '../../shared/shared.module';
import { ConvoComponent } from './convo/convo.component';
import { ConvoCameraComponent } from './convo-camera/convo-camera.component';
import { ConvoAudioComponent } from './convo-audio/convo-audio.component';
import { ConvoRecordingVideoComponent } from './convo-recording-video/convo-recording-video.component';
import { ConvoRecordingAudioComponent } from './convo-recording-audio/convo-recording-audio.component';

const routes: Routes = [
  {
    path: '',
    component: ConvoComponent,
    canActivate: [AlwaysAuthGuard]
  }
  // {
  //     path: 'recording-video',
  //     component: ConvoRecordingVideoComponent,
  //     canActivate: [AlwaysAuthGuard]
  // },
  // {
  //   path: 'recording-audio',
  //   component: ConvoRecordingAudioComponent,
  //   canActivate: [AlwaysAuthGuard]
  // }
];

@NgModule({
  declarations: [
    ConvoComponent,
    ConvoCameraComponent,
    ConvoAudioComponent,
    ConvoRecordingVideoComponent,
    ConvoRecordingAudioComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'options', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    SlideToggleModule,
    ButtonComponent,
    ToggleComponent
  ]
})
export class ConvoModule {}

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { AlwaysAuthGuard } from '../../services/user.service';
import { SharedModule } from '../../shared/shared.module';
import { AudiosComponent } from './audios/audios.component';
import { VideosComponent } from './videos/videos.component';
import { DocsComponent } from './docs/docs.component';
import { ImagesComponent } from './images/images.component';
import { FilesComponent } from './files/files.component';

const routes: Routes = [
  {
    path: 'audios',
    component: AudiosComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'videos',
    component: VideosComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'docs',
    component: DocsComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'images',
    component: ImagesComponent,
    canActivate: [AlwaysAuthGuard]
  },
  {
    path: 'files',
    component: FilesComponent,
    canActivate: [AlwaysAuthGuard]
  }
];

@NgModule({
  declarations: [AudiosComponent, VideosComponent, DocsComponent, ImagesComponent, FilesComponent],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'options', '/translations/ang.json'),
        deps: [HttpClient]
      }
    })
  ]
})
export class MediaModule {}

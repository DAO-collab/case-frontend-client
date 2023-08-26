import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { AlwaysAuthGuard } from '../../services/user.service';
import { InfoComponent } from './info/info.component';
import { SharedModule } from '../../shared/shared.module';
import { CopyComponent } from '@ca/ui';

const routes: Routes = [
  {
    path: '',
    component: InfoComponent,
    canActivate: [AlwaysAuthGuard]
  }
];

@NgModule({
  declarations: [InfoComponent],
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
    CopyComponent
  ]
})
export class InfoModule {}

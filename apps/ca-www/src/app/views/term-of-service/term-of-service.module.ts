import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TermOfServiceComponent } from './term-of-service/term-of-service.component';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

const routes: Routes = [
  {
    path: '',
    component: TermOfServiceComponent
  }
];

@NgModule({
  declarations: [TermOfServiceComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'opts/', '/translations/ang.json'),
        deps: [HttpClient]
      }
    })
  ]
})
export class TermOfServiceModule {}

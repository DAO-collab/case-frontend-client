import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExploreComponent } from './explore/explore.component';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ScrollSlidesModule } from '@www/common/directives/scroll-slides/scroll-slides.module';

const routes: Routes = [
  {
    path: '',
    component: ExploreComponent
  }
];

@NgModule({
  declarations: [ExploreComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'opts/', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    ScrollSlidesModule
  ]
})
export class ExploreModule {}

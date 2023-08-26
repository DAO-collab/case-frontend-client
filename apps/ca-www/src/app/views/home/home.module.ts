import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home/home.component';
import { Routes, RouterModule } from '@angular/router';
import { NgxHmCarouselModule } from 'ngx-hm-carousel';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SharedModule } from '@www/common/shared.module';
import { ScrollSlidesModule } from '@www/common/directives/scroll-slides/scroll-slides.module';
import { TestimonialsCarouselModule } from '@www/common/components/testimonials-carousel/testimonials-carousel.module';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  }
];

@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    NgxHmCarouselModule,
    RouterModule.forChild(routes),
    SharedModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'opts/', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    ScrollSlidesModule,
    TestimonialsCarouselModule
  ]
})
export class HomeModule {}

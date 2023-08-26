import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestimonialsCarouselComponent } from './testimonials-carousel.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [TestimonialsCarouselComponent],
  imports: [CommonModule, TranslateModule],
  exports: [TestimonialsCarouselComponent]
})
export class TestimonialsCarouselModule {}

import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * Frequently Asked Questions component.
 */
@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent implements AfterViewInit {
  @ViewChild('contactUs') contactUsComponent: ElementRef;
  @ViewChild('price') priceComponent: ElementRef;
  @ViewChild('faq') faq: ElementRef;

  constructor(private route: ActivatedRoute) {}

  ngAfterViewInit() {
    this.route.fragment.subscribe(fragment => {
      if (fragment === 'contact-us') {
        this.contactUsComponent.nativeElement.scrollIntoView();
      } else if (fragment === 'pricing') {
        this.priceComponent.nativeElement.scrollIntoView();
      } else if (fragment === 'faq') {
        this.faq.nativeElement.scrollIntoView();
      }
    });
  }

  public scrollToContactUs() {
    this.contactUsComponent.nativeElement.scrollIntoView();
  }
}

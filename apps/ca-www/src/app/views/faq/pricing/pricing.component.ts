import { Component, EventEmitter, OnDestroy, OnInit, Output, Renderer2 } from '@angular/core';

import { GET_ACCOUNT_CLIENT_URL } from '../../../shared/api.utils';

@Component({
  selector: 'app-pricing',
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.css']
})
export class PricingComponent implements OnInit, OnDestroy {
  @Output() scrollToContactUs: EventEmitter<void> = new EventEmitter<void>();

  public signupUrl: string;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.signupUrl = `${GET_ACCOUNT_CLIENT_URL('/apps/create')}`;

    this.renderer.addClass(document.querySelector('#root'), 'pricing-background');
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.querySelector('#root'), 'pricing-background');
  }

  public navigateToSignupPage() {
    window.open(this.signupUrl, '_blank');
  }

  public scrollToContactUsSection() {
    this.scrollToContactUs.emit();
  }
}

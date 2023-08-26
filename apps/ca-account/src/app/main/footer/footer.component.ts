import { Component, Input } from '@angular/core';
import { CONTACT_US_URL, TERMS_OF_USE_URL } from '@acc/utils/constants.utils';

/**
 * Footer component.
 */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  @Input() logo?: string;
  public currentYear: number = new Date().getFullYear();
  public termsOfUseUrl = TERMS_OF_USE_URL;
  public contactUs = CONTACT_US_URL;
}

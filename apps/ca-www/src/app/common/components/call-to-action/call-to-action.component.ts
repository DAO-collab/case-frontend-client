import { Component, Input } from '@angular/core';

/**
 * Call to action component.
 */
@Component({
  selector: 'app-call-to-action',
  templateUrl: './call-to-action.component.html',
  styleUrls: ['./call-to-action.component.css']
})
export class CallToActionComponent {
  @Input() signupUrl: string;
}

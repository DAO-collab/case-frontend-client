import { Component, Input } from '@angular/core';

/**
 * Loader component.
 */
@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css']
})
export class LoaderComponent {
  @Input() active!: boolean;
}

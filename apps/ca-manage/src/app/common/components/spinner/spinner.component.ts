import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-spinner, [spinner]',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.css']
})
export class SpinnerComponent implements OnInit {
  @Input() active?: boolean;

  constructor() {}

  ngOnInit() {}
}

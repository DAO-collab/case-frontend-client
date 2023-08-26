import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-loader, [loader]',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css']
})
export class LoaderComponent implements OnInit {
  @Input() active?: boolean;

  constructor() {}

  ngOnInit() {}
}

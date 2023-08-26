import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-svg-icon',
  templateUrl: './svg-icon.component.html',
  styleUrls: ['./svg-icon.component.css']
})
export class SvgIconComponent implements OnInit {
  @Input() icon!: string;
  @Input() size?: number = 20;
  @Input() isActive? = false;
  @Input() width?: number;
  @Input() height?: number;

  public srcLink?: string;
  public imageWidth?: number;
  public imageHeight?: number;

  ngOnInit(): void {
    this.srcLink = '/images/' + this.icon + '.svg#' + this.icon;
    this.imageWidth = this.width || this.size;
    this.imageHeight = this.height || this.size;
  }
}

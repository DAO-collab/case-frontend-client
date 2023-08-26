import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  Renderer2,
  ViewChild
} from '@angular/core';

export enum Tabs {
  Draw,
  Write
  // FromImage
}

export enum CanvasColors {
  Black = '#000000',
  LightBlue = '#2293FB',
  DarkBlue = '#4636E3'
}

@Component({
  selector: 'app-signature-box',
  templateUrl: './signature-box.component.html',
  styleUrls: ['./signature-box.component.css']
})
export class SignatureBoxComponent implements AfterViewInit {
  @ViewChild('sigPad') set content(content: ElementRef) {
    if (content?.nativeElement) {
      this._canvas = content;

      this.setCanvasOptions();
    }
  }

  @Input() attr?: any;

  @Output() imageSrc = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  tabs = Tabs;
  canvasColors = CanvasColors;
  activeTab = Tabs.Draw;
  selectedCanvasColor = CanvasColors.Black;
  canvasText = '';
  cordsArr: any[] = [];

  get canvas(): ElementRef {
    return this._canvas;
  }

  private canvasElement?: CanvasRenderingContext2D;
  private _canvas?: any;
  private isDrawing = false;

  constructor(private renderer: Renderer2) {}

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(): void {
    this.isDrawing = false;
  }

  ngAfterViewInit(): void {
    this.setCanvasOptions();
  }

  switchTab(tab: Tabs): void {
    if (this.activeTab !== tab) {
      this.activeTab = tab;
    }
  }

  onMouseDown(e: MouseEvent): void {
    this.isDrawing = true;

    const coords = this.relativeCoords(e);

    this.canvasElement?.moveTo(coords.x, coords.y);
  }

  onMouseMove(e: MouseEvent): void {
    if (this.isDrawing) {
      const coords = this.relativeCoords(e);

      this.cordsArr.push(coords);
      this.canvasElement?.lineTo(coords.x, coords.y);
      this.canvasElement?.stroke();
    }
  }

  clear(): void {
    if (this.activeTab === this.tabs.Draw) {
      this.canvasElement?.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
      this.canvasElement?.beginPath();
    } else if (this.activeTab === this.tabs.Write) {
      this.canvasText = '';
    }
  }

  save(): void {
    if (this.activeTab === this.tabs.Draw) {
      // resizing image
      // const cropRectangle = {
      //   xLeft: 999999,
      //   xRight: 0,
      //   yTop: 999999,
      //   yBottom: 0
      // };
      // const increase = 1;
      //
      // for (let item of this.cordsArr) {
      //   cropRectangle.xLeft = Math.min(cropRectangle.xLeft, item.x);
      //   cropRectangle.xRight = Math.max(cropRectangle.xRight, item.x);
      //   cropRectangle.yTop = Math.min(cropRectangle.yTop, item.y);
      //   cropRectangle.yBottom = Math.max(cropRectangle.yBottom, item.y);
      // }
      //
      // const rectangleCoords = {
      //   left: Math.floor(cropRectangle.xLeft) - increase,
      //   top: Math.floor(cropRectangle.yTop) - increase,
      //   right: Math.ceil(cropRectangle.xRight - cropRectangle.xLeft) + increase,
      //   bottom: Math.ceil(cropRectangle.yBottom - cropRectangle.yTop) + increase
      // }
      // const image = this.canvasElement.getImageData(
      //   rectangleCoords.left,
      //   rectangleCoords.top,
      //   rectangleCoords.right,
      //   rectangleCoords.bottom
      // );
      // const canvas = this.renderer.createElement("canvas") as HTMLCanvasElement;
      // canvas.width = rectangleCoords.right + increase;
      // canvas.height = rectangleCoords.bottom + increase;
      // const ctx = canvas.getContext("2d");
      // ctx.rect(0, 0, rectangleCoords.right, rectangleCoords.bottom);
      // ctx.fill();
      // ctx.putImageData(image, 0, 0);
      // this.imageSrc.emit(canvas.toDataURL("image/png"))

      this.imageSrc.emit(this.canvas.nativeElement.toDataURL('image/png'));
    } else if (this.activeTab === this.tabs.Write && this.canvasText.length) {
      const canvas = document.getElementById('textCanvas') as HTMLCanvasElement;
      canvas.width = this.attr.width?.slice(0, -2) > 10 ? this.attr.width?.slice(0, -2) : 300;
      canvas.height = this.attr.height?.slice(0, -2) || 40;
      const tCtx: any = (document.getElementById('textCanvas') as HTMLCanvasElement).getContext('2d');
      tCtx.fillStyle = this.selectedCanvasColor;
      tCtx.font = '1px Arial';
      tCtx.font = this.calculateFont(this.canvasText, tCtx, canvas.height);

      tCtx.fillText(this.canvasText, 0, canvas.height * 0.8, canvas.width);

      this.imageSrc.emit(tCtx.canvas.toDataURL('image/png'));
    }
  }

  calculateFont(text: string, tCtx: any, height: number): string {
    const size = 300 / tCtx.measureText(this.canvasText).width;

    if (size >= height) {
      return height + 'px Arial';
    } else {
      return size + 'px Arial';
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  changeCanvasColor(color: CanvasColors): void {
    this.selectedCanvasColor = color;
    this.canvasElement!.strokeStyle = color;
    this.canvasElement!.stroke();
  }

  private setCanvasOptions(): void {
    this.canvas.nativeElement.width = 600;
    this.canvasElement = this.canvas.nativeElement.getContext('2d');
    this.canvasElement!.strokeStyle = this.selectedCanvasColor;
    this.canvasElement!.lineWidth = 3;
    this.canvasElement!.imageSmoothingEnabled = true;
    this.canvasElement!.lineCap = 'round';
    this.canvasElement!.lineJoin = 'round';
  }

  private relativeCoords(event: MouseEvent): { x: number; y: number } {
    const bounds = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    return { x, y };
  }
}

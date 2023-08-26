import { Component, ViewChild, EventEmitter, Output, Renderer2, Inject, PLATFORM_ID, TemplateRef } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AccountService } from '../../profile/account.service';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ImageCroppedEvent } from 'ngx-image-cropper';

/**
 * Avatar modal component.
 */
@Component({
  selector: 'app-avatar-modal',
  templateUrl: './avatar-modal.component.html',
  styleUrls: ['./avatar-modal.component.css']
})
export class AvatarModalComponent {
  @ViewChild('content') content?: TemplateRef<AvatarModalComponent>;

  @Output() avatarOnUpload: EventEmitter<{ success: string }> = new EventEmitter<{ success: string }>();
  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();

  public croppedImage: string | undefined | null = '';
  public saving = false;
  public imageChangedEvent!: Event;

  private modalRef?: NgbModalRef;
  private requestImageChangedEvent!: Event;
  private croperCoords!: [number, number, number, number];

  constructor(
    private modalService: NgbModal,
    private accountService: AccountService,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platform: object
  ) {}

  public imageLoaded(): void {
    // show cropper
  }

  public loadImageFailed(): void {
    // show message
  }

  /**
   * Sets new file.
   */
  public imageCropped({ base64, imagePosition: { x1, x2, y1, y2 } }: ImageCroppedEvent): void {
    this.croppedImage = base64;
    // set left, top, width and height coords
    this.croperCoords = [x1, y1, x2 - x1, y2 - y1];
  }

  /**
   * Uploads avatar.
   */
  public uploadAvatar(): void {
    this.saving = true;

    this.accountService
      .uploadAvatar((this.requestImageChangedEvent.target as HTMLInputElement).files![0], this.croperCoords)
      .then((response: { data: string }) => {
        this.avatarOnUpload.emit({ success: response && response.data });
        this.saving = false;
        this.cancelAction();

        return response;
      })
      .catch((response: { data: { error: string } }) => {
        this.avatarOnUpload.emit({ success: response && response.data && response.data.error }); // er2ror
        this.saving = false;
      });
  }

  /**
   * Opens modal.
   */
  public open(file: Event): void {
    this.requestImageChangedEvent = file;
    this.imageChangedEvent = file;
    this.modalRef = this.modalService.open(this.content);

    setTimeout(() => {
      if (isPlatformBrowser(this.platform)) {
        const modalBody = this.document.querySelector('ngb-modal-window');
        const backDrop = this.document.querySelector('ngb-modal-backdrop');

        this.renderer.addClass(modalBody, 'ca-popup');
        this.renderer.addClass(modalBody, 'fade-in');
        this.renderer.addClass(modalBody, 'show-modal');
        this.renderer.addClass(backDrop, 'in');
      }
    });
  }

  /**
   * Cancels action.
   */
  public cancelAction() {
    this.modalRef?.dismiss();
    this.modalRef?.close();
    this.cancel.emit();
  }
}

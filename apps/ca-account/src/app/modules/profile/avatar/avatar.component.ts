import { Component, Input, Output, EventEmitter, ViewChild, SimpleChanges, OnChanges } from '@angular/core';
import { AvatarModalComponent } from '../avatar-modal/avatar-modal.component';
import { SettingsService } from '../../../../app/core/settings.service';

/**
 * Avatar component.
 */
@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.css']
})
export class AvatarComponent implements OnChanges {
  @ViewChild(AvatarModalComponent, { static: true }) avatarModal?: AvatarModalComponent;
  @Output() avatarOnUpload: EventEmitter<string> = new EventEmitter<string>();
  @Output() avatarOnRemove: EventEmitter<void> = new EventEmitter<void>();
  @Input() avatarIsLoading: boolean = false;
  @Input() uploadingAvatar?: boolean;
  @Input() profileImage?: string;

  public avatarModel?: string;
  public savingPhotoError: string[] = [];
  public acceptExtensions: string[] = ['.png', '.jpg', '.jpeg'];

  private uploadFileSizeLimit = 10000000;

  constructor(private settingsService: SettingsService) {}

  /**
   * Uploads image.
   */
  public fileChangeEvent(event: Event): void {
    if (!event.target) return;
    const fileExtension = (event.target as HTMLInputElement).files?.[0].type.split('/')[1];

    if (!~this.acceptExtensions.indexOf('.' + fileExtension)) {
      return alert('Not supported Extension. Accepted extensions: ' + this.acceptExtensions.join(', '));
    }

    (event.target as HTMLInputElement).files?.[0].size! <= this.uploadFileSizeLimit
      ? this.avatarModal?.open(event)
      : alert('Maximum allowed image size to upload is 10mb');
  }

  ngOnChanges(changes: SimpleChanges) {
    this.profileImage = changes['profileImage'].currentValue;
  }

  /**
   * Cancels image upload.
   */
  public cancelUploading(): void {
    this.avatarModel = '';
  }

  /**
   * Emits the response.
   * Upadte profileImage
   * Subscribe upload image
   */
  public avatarOnUploadDone(response: { success: string }): void {
    this.avatarOnUpload.emit(response.success);
    this.profileImage = response.success;
    this.settingsService.updateAvatarImage(response.success);
  }

  public removeAvatar() {
    this.avatarOnRemove.emit();
  }
}

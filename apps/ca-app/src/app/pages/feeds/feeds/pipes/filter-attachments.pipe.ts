import { Pipe, PipeTransform } from '@angular/core';
import { IMediaAttachment } from '../../models/feed.model';
import { MediaParent } from '../types/media-parent.type';

@Pipe({
  name: 'filterAttachments',
  standalone: true,
  pure: false
})
export class FilterAttachmentsPipe implements PipeTransform {
  transform(attachments: IMediaAttachment[], mediaParentType: MediaParent, postId?: string): IMediaAttachment[] {
    return attachments.filter(attachment => {
      if (postId) {
        return attachment.mediaParentType === mediaParentType && postId === attachment.postId;
      }
      return attachment.mediaParentType === mediaParentType;
    });
  }
}

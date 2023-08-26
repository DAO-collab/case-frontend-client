import { Pipe, PipeTransform } from '@angular/core';
import { MediaParent } from '../types/media-parent.type';
import { AttachmentForViewer } from '@app/services/feed-media.service';

@Pipe({
  name: 'showAttachments',
  standalone: true,
})
export class ShowAttachmentsPipe implements PipeTransform {
  transform(attachments: AttachmentForViewer[], mediaParentType: MediaParent, commentId?: string): AttachmentForViewer[] {
    if (mediaParentType === 'all') {
      return attachments;
    }
    return attachments.filter(attachment => {
      if (commentId) {
        return attachment.mediaParentType === mediaParentType && commentId === attachment.commentId;
      }
      return attachment.mediaParentType === mediaParentType;
    });
  }
}

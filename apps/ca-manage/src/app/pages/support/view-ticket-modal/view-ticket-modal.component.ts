import { Component, ElementRef, EventEmitter, Input, Output, QueryList, Renderer2, ViewChildren } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-view-ticket-modal',
  templateUrl: './view-ticket-modal.component.html',
  styleUrls: ['./view-ticket-modal.component.css']
})
export class ViewTicketModalComponent {
  @ViewChildren('ticketComment') set content(content: QueryList<ElementRef>) {
    if (content?.length) {
      this.scrollToComment(content);
    }
  }

  @Input() ticket?: any;
  @Input() users?: any;

  @Output() closeModal = new EventEmitter<void>();
  @Output() postCommentEvent = new EventEmitter<string>();

  inputValue = '';

  constructor(private renderer: Renderer2, private sanitizer: DomSanitizer, private adminService: AdminService) {}

  close(): void {
    this.closeModal.emit();
  }

  postComment(): void {
    this.postCommentEvent.next(this.inputValue);

    this.inputValue = '';
  }

  getUserAvatar(userId: string, height: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.adminService.getAvatarUrl(height, userId));
  }

  showUserName(id: string): string | void {
    const user = this.users.find((element: any) => element.user_id === id);

    if (user) {
      return user.given_name + ' ' + user.family_name;
    }

    return;
  }

  showLocalDate(date: Date): Date | string {
    if (date) {
      return new Date(date);
    }
    return '';
  }

  private scrollToComment(content: any): void {
    if (this.ticket.higlightIndex <= this.ticket.comments) {
      const nativeElement = content.toArray()[this.ticket.higlightIndex].nativeElement;
      nativeElement.scrollIntoView();

      this.renderer.addClass(nativeElement, 'highlight-comment');

      of(null)
        .pipe(
          delay(5000),
          tap(() => {
            if (this.ticket.higlightIndex) {
              this.renderer.removeClass(nativeElement, 'highlight-comment');

              delete this.ticket.higlightIndex;
            }
          })
        )
        .subscribe();
    }
  }
}

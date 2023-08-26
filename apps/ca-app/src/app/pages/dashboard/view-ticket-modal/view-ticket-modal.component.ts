import { Component, ElementRef, EventEmitter, Input, Output, QueryList, Renderer2, ViewChildren } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { WhoAmI, Ticket } from '@app/interfaces';

import { UserService } from '../../../services/user.service';

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

  @Input() ticket!: Ticket;
  @Input() currentUser!: WhoAmI;

  @Output() closeModal = new EventEmitter<void>();
  @Output() postCommentEvent = new EventEmitter<string>();

  inputValue = '';

  constructor(private sanitizer: DomSanitizer, private renderer: Renderer2, private userService: UserService) {}

  close(): void {
    this.closeModal.emit();
  }

  postComment(): void {
    this.postCommentEvent.next(this.inputValue);

    this.inputValue = '';
  }

  getUserAvatar(userId: string, height: number): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.userService.getUserAvatar(height, userId));
  }

  showUserName(id: string): string {
    if (id.toString() === this.currentUser.user_id) {
      return this.currentUser?.given_name + ' ' + this.currentUser?.family_name;
    }

    return this.currentUser?.company_name!;
  }

  showLocalDate(date: Date): Date | string {
    if (date) {
      return new Date(date);
    }
    return '';
  }

  private scrollToComment(content: QueryList<ElementRef>): void {
    if ((this.ticket as any).higlightIndex <= this.ticket!.comments) {
      const nativeElement = content.toArray()[(this.ticket as any).higlightIndex].nativeElement;
      nativeElement.scrollIntoView();

      this.renderer.addClass(nativeElement, 'highlight-comment');

      of(null)
        .pipe(
          delay(5000),
          tap(() => {
            if ((this.ticket as any).higlightIndex) {
              this.renderer.removeClass(nativeElement, 'highlight-comment');

              delete (this.ticket as any).higlightIndex;
            }
          })
        )
        .subscribe();
    }
  }
}

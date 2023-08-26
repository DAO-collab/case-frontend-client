import {
  Component,
  OnInit,
  ApplicationRef,
  Renderer2,
  Inject,
  PLATFORM_ID,
  ViewChild,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { PopInNotificationConnectorService } from './../pop-in-notification-connector.service';
import { LocalTranslationService } from '../../../../core/local-translation.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { INotification } from '../notification.model';

/**
 * Pop In Box component.
 */
@Component({
  selector: 'app-pop-in-box',
  templateUrl: './pop-in-box.component.html',
  styleUrls: ['./pop-in-box.component.css']
})
export class PopInBoxComponent implements OnInit, OnDestroy {
  @ViewChild('notificationBox') notificationBox?: ElementRef<HTMLDivElement>;
  public notificationList: INotification[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private popInNotificationConnectorService: PopInNotificationConnectorService,
    private applcationRef: ApplicationRef,
    private errorDictionary: LocalTranslationService,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platform: object
  ) {}

  /**
   * Shows notification.
   */
  ngOnInit() {
    this.popInNotificationConnectorService.notificationAddedSubscription
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification: INotification) => {
        if (!~this.notificationList.indexOf(notification)) {
          if (this.notificationList.length) {
            this.notificationList.shift();
          }

          this.notificationList.push(notification);
          // this.initNotification();
        } else {
          setTimeout(() => {
            this.notificationList.splice(this.notificationList.indexOf(notification), 1);
            this.applcationRef.tick();
          }, 3000);

          if (notification.status === 'error') {
            if (!notification.text) {
              this.errorDictionary.showError(notification.text!).then((r: string) => {
                notification.text = r;
              });
            }
          }
        }
      });
  }

  /**
   * Controls notification position.
   */
  // private initNotification(): void {
  // if (isPlatformBrowser(this.platform)) {
  //   const footer: HTMLElement = this.document.querySelector('#footer');
  // const html: HTMLElement = this.document.querySelector('html');
  // const tempHeight = window.pageYOffset + footer?.getBoundingClientRect().top;

  // const tempScreenHeight: number = window.innerHeight;
  // const tempScrollHeight: number = tempHeight - html.scrollTop;
  // const footerWindowTopRelation: number = tempScrollHeight - tempScreenHeight;

  // if (footerWindowTopRelation < 0) {
  //   const bottom = Math.abs(footerWindowTopRelation) + 'px';
  //   this.renderer.setStyle(this.notificationBox.nativeElement, 'bottom', bottom);
  // } else {
  //   this.renderer.removeStyle(this.notificationBox.nativeElement, 'bottom');
  // }
  // }
  // }

  /**
   * Removes notification.
   */
  removeNotification(i: number, notificationList: INotification[]) {
    notificationList.splice(i, 1);
  }

  /**
   * Unsubscribes from observable.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}

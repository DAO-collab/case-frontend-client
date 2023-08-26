import { Component, OnInit, OnDestroy, Input, EventEmitter, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { Team } from '@app/interfaces';
import { FeedsService } from '../../../services/feeds.service';
import { ExtensionsResponse, FeedMediaService } from '../../../services/feed-media.service';
import { CasesService } from '../../../services/cases.service';
import { UserService } from '../../../services/user.service';
import { UtilsService } from '../../../services/utils.service';
import { IFeed } from '../../../pages/feeds/models/feed.model';

@Component({
  selector: 'app-media-view',
  templateUrl: './media-view.component.html',
  styleUrls: ['./media-view.component.css']
})
export class MediaViewComponent implements OnInit, OnDestroy {
  @Output() isLoaded: EventEmitter<any> = new EventEmitter();
  @Input() feedsList: IFeed[] = [];
  @Input() mediaFilter?: keyof ExtensionsResponse;
  @Input() edit?: boolean;
  @Input() delete?: boolean;

  public caseId: string = '';
  private subscribers: Subscription[] = [];
  public permissions: { [key: string]: string } = {};
  public loading = true;
  private noFiles = false;
  public loadedAttachments: ExtensionsResponse[] = [];
  public teamData: { [key: string]: Team } = {};
  public userId = '';
  public showViwer = false;
  public viewerIndx: any = 0;
  public viewiengItems: any[] = [];

  private firstInit = true;

  constructor(
    public utilsService: UtilsService,
    private feedsService: FeedsService,
    private feedMediaService: FeedMediaService,
    private caseService: CasesService,
    private userService: UserService
  ) {}

  ngOnInit() {
    /**
     *  Subscribe to caseId change
     *  - if changed, all content should be reloaded, due to selected case
     */
    this.subscribers.push(
      this.caseService.getCaseId.subscribe(res => {
        this.caseId = res['case_id'];
        this.userId = this.userService.userData?.['user_id'];

        this.showFeedsList();

        if (this.userService.rolesPermissions[this.caseId]) {
          this.userService.rolesPermissions[this.caseId].data.permissions.posts.map((v: any) => {
            this.permissions[v] = v;
          });
        }

        if (this.userService.casePermissionsData) {
          this.permissions = {};

          this.userService.casePermissionsData.role.permissions.posts.map((v) => {
            this.permissions[v] = v;
          });
        }

        this.subscribers.push(
          this.userService.getCasePermissionsData.subscribe(data => {
            this.permissions = {};
            
            data.role.permissions.posts.map((v) => {
              this.permissions[v] = v;
            });
          })
        );

        /**
         * Subscribe to team data of selected case
         * - needed to show user friendly details about user (for example Username by user id)
         */
        this.subscribers.push(
          this.userService.getTeamData.subscribe(data => {
            data?.items.map((usr) => {
              this.teamData[usr.user_id] = usr;
            });
          })
        );

        if (this.firstInit) {
          /**
           * add global click event listener, to close all feeds context menus
           */
          document.addEventListener('click', function (event) {
            if (!(event.target as HTMLElement)['closest']('.more-to-feed-menu')) {
              const allMenus = document.querySelectorAll('.more-to-feed-menu'),
                len = allMenus.length;

              for (let i = 0; i < len; i++) {
                allMenus[i].classList.remove('expanded');
              }
            }
          });

          /**
           * Run polifills that are needed for feeds component only
           */
          this.polyfills();
          this.firstInit = false;
        }
      })
    );
  }

  /**
   * Runs when out of route
   */
  ngOnDestroy(): void {
    this.subscribers.map(ev => {
      ev.unsubscribe();
    });
  }

  // All polyfills that using only on feeds page should be added inside this method
  private polyfills() {
    // Methods to count strings amount
    // @ts-ignore
    String.prototype['splitToLines'] = function () {
      return this.split(/\r*\n/);
    };
    // @ts-ignore
    String.prototype['linesAmount'] = function () {
      // @ts-ignore
      return this.splitToLines().length;
    };
  }

  /**
   * showFeedsList - load and show all feeds of current case
   * - can be called on page load and when case changed
   */
  private showFeedsList() {
    // this.feedsService.getFeeds(this.caseId, this.mediaFilter)
    this.feedsService.getFeeds(this.caseId).subscribe(
      res => {
        if (res.items) {
          res.items.map((fl, i) => {
            this.loadedAttachments[i] = this.feedMediaService.loadAllFeedAttachments(
              fl['media'],
              fl['post_id'],
              this.caseId
            );
          });

          this.feedsList = res.items.map(item => {
            item['replaceMessage'] = item['message'];
            item['activeEditing'] = false;
            item['loading'] = false;
            return item;
          });
        }
        this.loading = false;
        // this.noFiles = this.loadedAttachments.length === 0
        //   ? true
        //   : this.loadedAttachments.reduce((a, b) => {
        //       return a + b['totalCount'];
        //     }, 0) === 0;
        // this.isLoaded.emit({
        //   loading: this.loading,
        //   noFiles: this.noFiles
        // });

        this.isLoadedEmit();
      },
      err => {
        if (err.status === 404) {
          this.feedsList = [];
          this.noFiles = true;
        }

        this.loading = false;
        this.isLoaded.emit({
          loading: this.loading,
          noFiles: this.noFiles
        });
      }
    );
  }

  /**
   * onFeedImageLoaded - runs when feed attachment loaded
   */
  public onFeedImageLoaded(ob: any) {
    ob.loaded = true;
  }

  /**
   * removeFeedAttachment(feed)
   */
  public removeFeedAttachment(feed: any, i: number, doc: any, typeKey: any, ind: number) {
    this.feedsService.removeMedia(this.caseId, feed.post_id, doc.media_group, doc.media_id).subscribe(() => {
      this.loadedAttachments[i][typeKey as keyof ExtensionsResponse].list.splice(ind, 1);

      if (this.loadedAttachments[i]['images'].list.length === 0) {
        this.loadedAttachments.splice(i, 1);
        this.feedsList.splice(i, 1);
      }

      // if (this.loadedAttachments.length === 0) {
      //   this.noFiles = true;
      // }
      //
      // this.isLoaded.emit({
      //   loading: this.loading,
      //   noFiles: this.noFiles
      // });

      this.isLoadedEmit();
    });

    this.loadedAttachments[i]['totalCount' as keyof ExtensionsResponse] -= 1;
  }

  /**
   * shortFileName - short version of string with ... in the end if string too long
   */
  public shortFileName(val: string, am: number) {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  showInViewer(loadedAttachments: any, mediaId: string) {
    let startIndx = 0;

    this.viewiengItems = [];

    Object.keys(loadedAttachments).map(v => {
      const list = loadedAttachments[v].list;

      list.map((vl: any) => {
        if (mediaId === vl.media_id) {
          this.viewerIndx = startIndx;
        }

        this.viewiengItems.push(this.feedMediaService.getViwerObject(vl));
        startIndx += 1;
      });
    });

    this.showViwer = true;
  }

  /**
   * toggleClass - toggle feed context menu class
   */
  public toggleMenuClass(event: Event) {
    (event.target as HTMLElement).classList.toggle('expanded');
  }

  downloadDoc(doc: any) {
    this.feedMediaService.downloadDocument(doc.downloadLink);
  }

  showGif(video: any) {
    if (!video.gifUrl && video.gif) {
      this.feedMediaService.getStreamUrl(video.gif).subscribe(url => {
        video.gifUrl = url;
        video.showGif = 1;
      });
    } else if (video.gifUrl) {
      video.showGif = 1;
    }
  }

  viewerClosed() {
    this.showViwer = false;
  }

  /**
   * deleteFeed - delete feed
   */
  public deleteFeed(i: number, e: Event) {
    (e.target as HTMLElement)?.closest('.more-to-feed-menu')?.classList.remove('expanded');

    this.feedsService.deleteFeedItem({ case_id: this.caseId, post_id: this.feedsList[i]['post_id'] }).subscribe(
      () => {
        this.feedsList.splice(i, 1);
        this.loadedAttachments.splice(i, 1);

        // if (this.loadedAttachments.length === 0) {
        //   this.noFiles = true;
        // }
        //
        // this.isLoaded.emit({
        //   loading: this.loading,
        //   noFiles: this.noFiles
        // });

        this.isLoadedEmit();
      },
      err => {
        if (err.status === 404) {
          // this.feedsList = [];
        } else {
          // alert(err);
        }
      }
    );
  }

  // emmit values
  private isLoadedEmit(): void {
    this.noFiles = this.loadedAttachments?.length === 0;

    if (!this.noFiles) {
      const currentExtensionFiles = this.loadedAttachments.map(item => item[this.mediaFilter as keyof ExtensionsResponse].list);
      let itemsCount = 0;
      currentExtensionFiles.forEach(array => (itemsCount += array.length));

      this.noFiles = itemsCount === 0;
      this.isLoaded.emit({
        loading: this.loading,
        noFiles: this.noFiles
      });
    } else {
      this.isLoaded.emit({
        loading: this.loading,
        noFiles: this.noFiles
      });
    }
  }
}

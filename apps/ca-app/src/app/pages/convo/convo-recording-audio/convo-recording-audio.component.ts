import { Component, HostListener, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { CasesService } from '../../../services/cases.service';
import { ConvoService } from '../../../services/convo.service';
import { HostService } from '../../../services/host.service';
import { UserService } from '../../../services/user.service';
import { ExtensionsResponse, FeedMediaService } from '../../../services/feed-media.service';

@Component({
  selector: 'app-convo-recording-audio',
  templateUrl: './convo-recording-audio.component.html',
  styleUrls: ['./convo-recording-audio.component.css']
})
export class ConvoRecordingAudioComponent implements OnInit {
  public caseId: any = '';
  public recordList: any = [];
  public loading = true;
  public permissions: any = {};
  public loadedAttachments: ExtensionsResponse[] = [];
  public viewiengItems: any[] = [];
  public viewerIndx: any = 0;
  public showViwer = false;
  public people?: any[];

  private unsubscribe$: Subject<void> = new Subject();

  @HostListener('document:click', ['$event'])
  clickOut(event: any) {
    if (!event.target['closest']('.expand-recording-menu')) {
      const allMenus = document.querySelectorAll('.expand-recording-menu');

      for (let i = 0; i < allMenus.length; i++) {
        allMenus[i].classList.remove('expanded');
      }
    }
  }

  constructor(
    private convoService: ConvoService,
    private casesService: CasesService,
    private titleService: Title,
    private userService: UserService,
    private feedMediaService: FeedMediaService,
    private hostService: HostService
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | Convo`);
    this.userService.getTeamData.pipe(takeUntil(this.unsubscribe$)).subscribe(data => (this.people = data?.items));
    this.casesService.getCaseId.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
      this.caseId = res['case_id'];
      this.loadRecordAudio();
    });
    this.userService.getCasePermissionsData.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      data.role.permissions.convos.map((v: any) => {
        this.permissions[v] = v;
      });
    });
  }

  loadRecordAudio() {
    this.convoService.getConvosRecordings(this.caseId).subscribe(
      (res: any) => {
        this.loadedAttachments = [];
        this.recordList = res.items.filter((item: any) => item.audio_only);
        res.items.map((fl: any, i: number) => {
          this.loadedAttachments[i] = this.feedMediaService.loadAllFeedAttachments(
            fl['media'],
            fl['post_id'],
            this.caseId
          );
        });
        this.loading = false;
      },
      err => {
        this.loading = false;
      }
    );
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

  viewerClosed() {
    this.showViwer = false;
  }

  downloadDoc(doc: any) {
    this.feedMediaService.downloadDocument(doc.downloadLink);
  }

  getConvoUserInfo(userId: string) {
    const participant: any = this.people?.filter(user => user.user_id === userId);
    return participant[0];
  }

  getConvoUserAvatar(userId: string) {
    return this.userService.getAvatarUrl(0, this.getConvoUserInfo(userId));
  }

  toggleMenuClass(event: any): void {
    event.target.classList.toggle('expanded');
  }

  deleteRecord(i: number, target: any): void {
    target.closest('.expand-recording-menu').classList.remove('expanded');

    this.convoService
      .deleteConvoRecording(this.caseId, this.recordList[i].convo_id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.recordList.splice(i, 1);
        this.loadedAttachments.splice(i, 1);
      });
  }
}

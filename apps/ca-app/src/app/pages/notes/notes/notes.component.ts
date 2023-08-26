import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Subscription, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CaseStatus } from '@app/types';

import { UserService } from '../../../services/user.service';
import { CasesService } from '../../../services/cases.service';
import { HostService } from '../../../services/host.service';
import { NotesService, Note } from '../../../services/notes.service';
import { RolesService } from '../../../services/roles.service';
import {
  PopInNotificationConnectorService,
  Notification
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { ViewerItem } from '../../../directives/component-directives/viewer/viewer.component';
import { FeedMediaService } from '../../../services/feed-media.service';
import { SchemaService } from '../../../services/schema.service';
import { SchemaProperty, SchemaComponent } from '../../../shared/components/schema/schema.component';
import { UtilsService } from '../../../services/utils.service';
import { Router } from '@angular/router';
import { UtilsLibsService } from '@ca/ui';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.css']
})
export class NotesComponent implements OnInit, OnDestroy {
  public notesList: Note[] = [];
  public permissions: { [key: string]: string } = {};
  public loading?: boolean;
  public rolesList: any[] = [];
  public columns?: any[];
  public selectedNoteId?: string;
  public showViwer?: boolean;
  public viewerIndx!: number;
  public viewerItems?: ViewerItem[];
  public caseId = '';
  public currentCaseStatus$: Observable<CaseStatus | undefined>;
  public showLoadMore: boolean = false;
  public newElementsSectionIsLoading = false;

  private subscribers: Subscription[] = [];
  private limitIncrease: number = 50;
  private limit: number = this.limitIncrease;

  get userId(): string {
    return this.userService?.userData?.user_id || '';
  }

  constructor(
    public notesService: NotesService,
    private rolesService: RolesService,
    private userService: UserService,
    private casesService: CasesService,
    private hostService: HostService,
    private titleService: Title,
    private feedMediaService: FeedMediaService,
    private notificationsService: PopInNotificationConnectorService,
    private schemaService: SchemaService,
    private utilsService: UtilsService,
    private router: Router,
    private utilsLibsService: UtilsLibsService
  ) {
    this.currentCaseStatus$ = this.casesService.activeCaseObs$.pipe(map(data => data?.status));
  }

  ngOnInit(): void {
    this.loading = true;
    this.columns = [];
    this.titleService.setTitle(`${this.hostService.appName} | Notes`);

    this.subscribers.push(
      combineLatest([
        this.casesService.getCaseId,
        this.schemaService.getSchemas(),
        this.userService.getCasePermissionsData
      ]).subscribe(([caseData, schema, data]) => {
        this.caseId = caseData.case_id;
        this.permissions = {};

        data.role.permissions.notes.map((v) => (this.permissions[v] = v));

        this.loadingNotes();
        const noteSchema =
          schema.default_schemas.notes && schema.default_schemas.notes[0] && schema.default_schemas.notes[0].schema
            ? schema.default_schemas.notes[0].schema
            : null;
        const noteUiSchema =
          schema.default_schemas.notes && schema.default_schemas.notes[0] && schema.default_schemas.notes[0].ui_schema
            ? schema.default_schemas.notes[0].ui_schema
            : null;
        const properties: { [key: string]: any } = {};
        noteUiSchema.elements.map((item: { scope: string, type: string }) => {
          const key = item.scope.split('/')[2];
          properties[key] = noteSchema.properties[key];
        });
        Object.keys(properties).map(key => {
          this.columns?.push({
            name: properties[key].title,
            key: key
          });
        });
      })
    );

    if (this.userService.rolesPermissions[this.caseId]) {
      this.permissions = {};
      this.userService.rolesPermissions[this.caseId].data.permissions.notes.map((v: any) => {
        this.permissions[v] = v;
      });
    }

    if (this.userService.casePermissionsData) {
      this.permissions = {};

      this.userService.casePermissionsData.role.permissions.notes.map((v) => {
        this.permissions[v] = v;
      });
    }

    this.rolesList = this.rolesService.rolesList;

    // Get user roles
    this.subscribers.push(
      this.rolesService.rolesGetSub.subscribe(items => {
        this.rolesList = items;
      })
    );

    this.subscribers.push(
      this.notesService.noteDirectLinkSubject.asObservable().subscribe(res => {
        if (res?.id && res?.action === 'view') {
          this.router.navigate(['notes/view', res.id]);

          this.notesService.noteDirectLinkSubject.next(null);
        }
      })
    );
  }

  public stringFromProperty(v: any) {
    return SchemaComponent.anyTypeToString(v);
  }

  public viewAttachments(note: Note): void {
    this.viewerIndx = 0;
    this.showViwer = true;
    this.viewerItems = [];

    const media: any = this.feedMediaService.loadAllFeedAttachments(note.media as any, note.note_id as any, this.caseId);
    console.log(media)
    Object.keys(media).map(v => {
      const list = media[v].list;

      list.map((vl: any) => {
        this.viewerItems?.push(this.feedMediaService.getViwerObject(vl));
      });
    });
  }

  public loadMoreNotes(): void {
    this.limit += this.limitIncrease;
    this.newElementsSectionIsLoading = true;

    this.loadingNotes();
  }

  private loadingNotes(): void {
    this.subscribers.push(
      this.notesService.getNotes(this.caseId, this.limit).subscribe((data) => {
          const items = data.items;

          this.notesList = items.filter(
            note => !note.permissions || note.permissions.includes(this.userService?.userData?.role_id as any)
          );
          this.showLoadMore = !!data?.nextLink;
          this.loading = false;
          this.newElementsSectionIsLoading = false;
        },
        () => {
          this.loading = false;
          this.notesList = [];
        }
      )
    );
  }

  public openNote(noteId: string) {
    this.selectedNoteId = noteId;
    this.notesService.showCreateNoteModal = true;
  }

  public convertTimeFieldToLocalTime(note: any) {
    if ((new Date(note) as any) !== 'Invalid Date' && !isNaN(new Date(note) as any) && note.length > 11) {
      return new Date(note).toLocaleTimeString();
    }

    return note;
  }

  public deleteNote(noteId: string) {
    const notification: Notification = this.notificationsService.addNotification({
      title: `Deleting Note`
    });

    this.subscribers.push(
      this.notesService.deleteNote(this.caseId, noteId).subscribe(
        () => {
          this.notificationsService.ok(notification, 'Note deleted');
          const removingNote = this.notesList.filter(n => n.note_id === noteId)[0];
          const removingNoteIndex = this.notesList.indexOf(removingNote);
          this.notesList.splice(removingNoteIndex, 1);
        },
        err => {
          this.notificationsService.failed(notification, err.message);
        }
      )
    );
  }

  public refreshModal(): void {
    this.notesService.showCreateNoteModal = false;
  }

  ngOnDestroy() {
    this.subscribers.map(s => s.unsubscribe());
  }
}

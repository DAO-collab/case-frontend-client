import { Component, OnInit } from '@angular/core';
import { GarbageCollectorService } from '../../../services/garbage-collector.service';
import { UserService } from '../../../services/user.service';
import { Title } from '@angular/platform-browser';
import { HostService } from '../../../services/host.service';

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.css']
})
export class FilesComponent implements OnInit {
  public permissions?: any;
  public loading: boolean = true;
  public loadingFailed: boolean = false;
  public noFiles: boolean = false;

  private subscribers: any[] = [];
  private teamData: any = {};

  constructor(
    private garbageCollectorService: GarbageCollectorService,
    private userService: UserService,
    private hostService: HostService,
    private titleService: Title
  ) {}

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | Feed`);

    this.subscribers.push(
      this.userService.getTeamData.subscribe(data => {
        data?.items.map((usr) => {
          this.teamData[usr.user_id] = usr;
        });
      })
    );

    if (this.userService.casePermissionsData) {
      this.permissions = {};

      this.userService.casePermissionsData.role.permissions.posts.map((v: any) => {
        this.permissions[v] = v;
      });
    }

    this.subscribers.push(
      this.userService.getCasePermissionsData.subscribe(data => {
        this.permissions = {};

        data.role.permissions.posts.map((v: any) => {
          this.permissions[v] = v;
        });
      })
    );

    /**
     * Subscribe to destroy command from app component
     * - needed to destroy subscribers in the moment when route triggered
     */
    this.subscribers.push(
      this.garbageCollectorService.destroyCommand.subscribe(() => {
        this.ngOnDestroy();
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

  /**
   * countObjectLength - needed to count object length in template
   */
  public objectLength(object: {[key: string]: any}) {
    return Object.keys(object).length;
  }

  loaded(loadedInfo: any) {
    Object.keys(loadedInfo).map(k => {
      if (this[k as keyof FilesComponent] !== undefined) {
        this[k as keyof FilesComponent] = loadedInfo[k];
      }
    });
  }
}

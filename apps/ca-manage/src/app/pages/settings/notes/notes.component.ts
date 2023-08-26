import { Component } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Title } from '@angular/platform-browser';

import { UtilsService } from '../../../services/utils.service';
import { HostService } from '../../../services/host.service';
import { CustomField } from '../../../shared/classes/custom-fields';
import { AdminService } from '../../../services/admin.service';
import { StylesService } from '../../../services/styles.service';
import { DesignService } from '../../../services/design.service';
import { PopInNotificationConnectorService } from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.css']
})
export class NotesComponent extends CustomField {
  constructor(
    adminService: AdminService,
    utils: UtilsService,
    stylesService: StylesService,
    notificationsService: PopInNotificationConnectorService,
    titleService: Title,
    designService: DesignService,
    hostService: HostService
  ) {
    super(adminService, utils, stylesService, notificationsService, titleService, designService, hostService);

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.shownDefaultsModal) {
        this.shownDefaultsModal = false;
        this.stylesService.popUpDisactivated();
      }
    });

    this.titleService.setTitle(`${this.hostService.appName} | Library`);
    this.formType = 'Notes';
    this.schemaType = 'notes';
    this.loading = false;
  }

  /**
   * Moves an item one index in an array to another.
   * Saves the new configuration.
   * @param event: CdkDragDrop<string[]>
   */
  drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.propertiesOrder, event.previousIndex, event.currentIndex);
    this.save();
  }
}

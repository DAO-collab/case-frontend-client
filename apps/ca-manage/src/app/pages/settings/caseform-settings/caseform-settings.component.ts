import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { AdminService } from '../../../services/admin.service';
import { UtilsService } from '../../../services/utils.service';
import { StylesService } from '../../../services/styles.service';
import { CustomField } from '../../../shared/classes/custom-fields';
import { PopInNotificationConnectorService } from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { HostService } from '../../../services/host.service';
import { DesignService } from '../../../services/design.service';

@Component({
  selector: 'app-caseform-settings',
  templateUrl: './caseform-settings.component.html',
  styleUrls: ['./caseform-settings.component.css']
})
export class CaseformSettingsComponent extends CustomField {
  staticFields = [
    {
      description: '',
      fieldType: 'dropdown',
      title: 'Case Status',
      type: 'string',
      editable: false,
      required: true
    },
    {
      description: '',
      fieldType: 'dropdown',
      title: 'Case Types',
      type: 'string',
      editable: true,
      required: true
    },
    {
      description: '',
      fieldType: 'date',
      title: 'Date Opened',
      type: 'string',
      editable: false,
      required: true
    },
    {
      description: '',
      fieldType: 'text',
      title: 'Tag Id',
      type: 'string',
      editable: false,
      required: true
    },
    {
      description: '',
      fieldType: 'text',
      title: 'About',
      editable: false,
      type: 'string'
    }
  ];
  override formType = 'Case';
  override schemaType = 'cases';

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

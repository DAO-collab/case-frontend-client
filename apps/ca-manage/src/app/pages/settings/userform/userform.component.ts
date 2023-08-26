import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { CustomField } from '../../../shared/classes/custom-fields';
import { AdminService } from '../../../services/admin.service';
import { UtilsService } from '../../../services/utils.service';
import { StylesService } from '../../../services/styles.service';
import { PopInNotificationConnectorService } from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { HostService } from '../../../services/host.service';
import { DesignService } from '../../../services/design.service';

@Component({
  selector: 'app-userform',
  templateUrl: './userform.component.html',
  styleUrls: ['./userform.component.css']
})
export class UserformComponent extends CustomField {
  staticFields = [
    {
      description: '',
      fieldType: 'text',
      title: 'First Name',
      type: 'string',
      required: true
    },
    {
      description: '',
      fieldType: 'text',
      title: 'Last Name',
      type: 'string',
      required: true
    },
    {
      description: '',
      fieldType: 'text',
      title: 'Email',
      type: 'string',
      required: true
    },
    {
      description: '',
      fieldType: 'text',
      title: 'User Status',
      type: 'string',
      required: true
    },
    {
      description: '',
      fieldType: 'text',
      title: 'User Type',
      type: 'string',
      required: true
    },
    {
      description: '',
      fieldType: 'text',
      title: 'Locale',
      type: 'string',
      required: true
    },
    {
      description: '',
      fieldType: 'text',
      title: 'Zoneinfo',
      type: 'string',
      required: true
    },
    {
      description: '',
      fieldType: 'text',
      title: 'Phone',
      type: 'string'
    },
    {
      description: '',
      fieldType: 'text',
      title: 'Tag Id',
      type: 'string'
    },
    {
      description: '',
      fieldType: 'date',
      title: 'Birth Date',
      type: 'string'
    },
    {
      description: '',
      fieldType: 'text',
      title: 'Gender',
      type: 'string'
    },
    {
      description: '',
      fieldType: 'dropdown',
      title: 'Company',
      type: 'string'
    },
    {
      description: '',
      fieldType: 'text',
      title: 'Title',
      type: 'string'
    },
    {
      description: '',
      fieldType: 'text',
      title: 'Address 1',
      type: 'string'
    },
    {
      description: '',
      fieldType: 'text',
      title: 'Address 2',
      type: 'string'
    },
    {
      description: '',
      fieldType: 'dropdown',
      title: 'Locality',
      type: 'string'
    },
    {
      description: '',
      fieldType: 'text',
      title: 'Region',
      type: 'string'
    },
    {
      description: '',
      fieldType: 'text',
      title: 'Postal Code',
      type: 'string'
    },
    {
      description: '',
      fieldType: 'dropdown',
      title: 'Country',
      type: 'string'
    }
  ];
  override formType = 'User';
  override schemaType = 'users';

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

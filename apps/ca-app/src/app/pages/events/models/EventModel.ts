import { NotificationModel } from '../../../directives/component-directives/notification-field/models/NotificationModel';

export class EventModel {
  description = '';
  recurring = false;
  strict_date = false;
  location = {
    location_type: 'no_location',
    address: ''
  };
  duration = {
    rrule: '',
    start_date: '',
    end_date: ''
  };
  participants_ids = [];
  name = '';
  notifications: NotificationModel = {
    names: [],
    values: [],
    valid: true
  };
  permissions = [];
  event_id = '';
}

import { NotificationModel } from '../../../directives/component-directives/notification-field/models/NotificationModel';

export class TaskModel {
  description? = '';
  duration = {
    due_date: '',
    rrule: ''
  };
  instant_notify = true;
  name = '';
  notifications?: NotificationModel = {
    names: [],
    values: [],
    valid: true
  };
  published = 1;
  tasks?: [
    {
      participants: [];
      task_name: '';
    }
  ];
  tasks_ct?: number;
  task_id? = '';
  items?: any[];
}

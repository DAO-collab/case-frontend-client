import { Component, OnInit } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, takeUntil, tap } from 'rxjs/operators';
import { ITask, TasksService } from '../../../services/tasks.service';
import { RolesService } from '../../roles/services/roles.service';
import { IRole } from '../../roles/models/role.model';
import {
  PopInNotificationConnectorService,
  Notification
} from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';
import { FormModalMode } from '../intake-forms/intake-modal/intake-modal.component';
import { IForm } from '../../../services/forms.service';
import { IApiGridResponse } from '../../../interfaces/api-response.model';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent extends UnsubscriptionHandler implements OnInit {
  public loading: boolean = true;
  public tasks: ITask[] = [];
  public shownPopUp$: Observable<boolean>;
  public roles: IRole[] = [];
  public formModalMode: FormModalMode = FormModalMode.Create;
  public getRoles$: Observable<IApiGridResponse<IRole[]>> = this.getRoles();
  public taskForm?: IForm | null = null;
  public createFormType = 'builder';

  private rolesNamesById: any = {};
  private openedId: string = '';

  constructor(
    private tasksService: TasksService,
    private rolesService: RolesService,
    private notificationsService: PopInNotificationConnectorService
  ) {
    super();
    this.shownPopUp$ = this.tasksService.activateTaskModal$;
  }

  ngOnInit(): void {
    this.getTasks();
  }

  public normalizeRolesList(permissions: string[]): string[] | string {
    return permissions ? permissions.map(v => this.rolesNamesById[v]).join(', ') : 'All';
  }

  public cancelAddingTask(): void {
    this.tasksService.hideModal();
    this.formModalMode = FormModalMode.Create;
    this.taskForm = null;
    this.openedId = '';
  }

  public getTasks(): void {
    this.tasksService
      .getTasks()
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.loading = false;
          return throwError(res.error);
        })
      )
      .subscribe((res: { items: ITask[] }) => {
        this.loading = false;
        this.tasks = res.items;
      });
  }

  public saveOrEditTask(task: ITask): void {
    const notification: Notification = this.notificationsService.addNotification({
      title: ''
    });

    if (!this.openedId) {
      notification.title = 'Task creating ';

      if (task.notifications && task.notifications.names && task.notifications.names.length === 0) {
        delete task.notifications;
      }

      this.tasksService
        .createTask(task)
        .pipe(
          takeUntil(this.unsubscribe$),
          catchError(res => {
            this.notificationsService.failed(notification, res.message);
            return throwError(res.error);
          })
        )
        .subscribe(() => {
          this.notificationsService.ok(notification, ' Task created ');
          this.getTasks();
        });
    } else {
      notification.title = 'Task updating ';

      if (task.notifications && task.notifications.names && task.notifications.names.length === 0) {
        task.notifications = null as any;
      }

      this.tasksService
        .updateForm(task, this.openedId)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(
          () => {
            this.notificationsService.ok(notification, ' Task updated ');
            this.getTasks();
          },
          err => this.notificationsService.failed(notification, err.message)
        );
    }
    this.tasksService.hideModal();
  }

  public deleteTask(tasks: ITask[], index: number): void {
    const task: ITask = tasks[index];
    const removedTask: ITask[] = tasks.splice(index, 1);

    const notification: Notification = this.notificationsService.addNotification({
      title: 'Removing task '
    });

    this.tasksService
      .deleteTask(task.asset_id!)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.notificationsService.failed(notification, res.message);
          tasks.unshift(removedTask[0]);
          return throwError(res.error);
        })
      )
      .subscribe(() => this.notificationsService.ok(notification, ' Task removed'));
  }

  public editTask(task: ITask): void {
    this.openedId = task.asset_id!;
    this.taskForm = task;
    this.tasksService.activateModal();
    this.formModalMode = FormModalMode.Edit;
  }

  private getRoles(): Observable<IApiGridResponse<IRole[]>> {
    return this.rolesService.getRoles().pipe(
      tap(({ items }) => {
        this.roles = items;
        items.forEach((role: any) => (this.rolesNamesById[role.role_id] = role.name));
      })
    );
  }
}

import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { catchError, delay, map, mergeMap, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { EMPTY, Observable, Subject, throwError } from 'rxjs';
import { CaseStatus } from '@app/types';
import { IDefaultResponse, Role, Task, Subtask, WhoAmIResponse } from '@app/interfaces';
import { TaskStatuses } from '@app/enums/task-statuses.enum';

import { CasesService } from '../../../services/cases.service';
import { StylesService } from '../../../services/styles.service';
import { UserService } from '../../../services/user.service';
import { TasksService } from '../../../services/tasks.service';
import { CreateTaskComponent } from '../create-task/create-task.component';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { Title } from '@angular/platform-browser';
import { HostService } from '../../../services/host.service';
import { TaskModel } from '../models/task.model';

export enum TaskTabs {
  Uncompleted = 'uncompleted',
  Completed = 'completed',
  Self = 'self'
}

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit, OnDestroy {
  @ViewChild(CreateTaskComponent) createTaskComponent?: CreateTaskComponent;
  @ViewChild('tasksTable') tasksTable?: ElementRef;
  @ViewChildren('participant') participants?: QueryList<ElementRef>;

  public showModal = false;
  public permissions: any;
  public addTaskTitle?: string;
  public loading = true;
  public tasksList: any[] = [];
  public taskTabs = TaskTabs;
  public currentTab = this.taskTabs.Self;
  public dragDisabled = false;
  public currentCaseStatus$: Observable<CaseStatus>;
  public initialParticipants: Role[] = [];
  public shownParticipants: boolean = false;
  public currentEditingTask?: string | null;
  public currentEditingSubtaskIndex: number = -1;
  public expandedTaskIndex?: number;
  public showCreateSubtaskSection = false;
  public isSubtaskSectionLoading = false;
  public taskStatuses = TaskStatuses;
  public taskStatusesForDropdown = [
    { value: this.taskStatuses.ToDo, text: 'To Do', icon: 'calendar-outline' },
    { value: this.taskStatuses.Inprogress, text: 'In Progress', icon: 'time-refresh' },
    { value: this.taskStatuses.Done, text: 'Done', icon: 'location-arrow-outline' }
  ];
  public userData = this.userService.userData;

  private teamData: any;
  private caseId!: string;
  private unsubscribe$: Subject<void> = new Subject();
  private currentCaseStatus: CaseStatus = 1;
  private draggingTask: TaskModel | null = null;
  private editingSubtask: any;
  private subtasksMap: Map<string, Subtask[]> = new Map();
  public subtasks?: Subtask[] | null;
  public testtasks: any;
  public tempIndex?: number;
  public tempTasks: any[] = [];
  constructor(
    public stylesService: StylesService,
    public tasksService: TasksService,
    private renderer: Renderer2,
    private casesService: CasesService,
    private userService: UserService,
    private notificationsService: PopInNotificationConnectorService,
    private hostService: HostService,
    private titleService: Title
  ) {
    this.currentCaseStatus$ = this.casesService.activeCaseObs$.pipe(
      map(data => data?.status as any),
      tap(status => (this.currentCaseStatus = status))
    );
  }

  ngOnInit(): void {
    this.casesService.getCaseId.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
      this.caseId = res['case_id'];

      this.loadTasks(this.currentTab);
    });

    this.userService.getCasePermissionsData
      .pipe(
        takeUntil(this.unsubscribe$),
        tap(data => {
          this.permissions = {};
          data.role.permissions.tasks.map((v: any) => (this.permissions[v] = v));
        }),
        mergeMap(() => this.tasksService.activateCreateModal.asObservable().pipe(delay(100)))
      )
      .subscribe(res => res ? this.openModal() : this.showModal = res);

    this.userService.getTeamData
      .pipe(
        takeUntil(this.unsubscribe$),
        tap(res => {
          this.teamData = res?.items.filter((item: any) => item.case_role_id !== 'role::bots');
          this.setInitialParticipants();
          return this.teamData;
        })
      )
      .subscribe();

    this.titleService.setTitle(`${this.hostService.appName} | Tasks`);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  public closeModal(): void {
    this.showModal = false;

    this.stylesService.popUpDisactivated();
    this.tasksService.activateCreateModal.next(false);

    this.createTaskComponent!.formTouched = false;
  }

  public openModal(task?: any): void {
    if (!this.createTaskComponent) {
      return;
    }

    this.createTaskComponent.refreshModal();

    this.createTaskComponent!.caseId = this.caseId!;

    if (task) {
      this.addTaskTitle = task.task_id ? 'Edit Task' : 'Add Task';
      this.createTaskComponent!.taskModel.task_id = task.task_id ?? '';
    } else {
      this.addTaskTitle = 'Add Task';
    }

    this.createTaskComponent?.loadOpenedTaskInformation();

    this.showModal = !this.showModal;
    this.createTaskComponent!.isOpened = this.showModal;
  }

  public loadTasks(filter: TaskTabs): void {
    this.loading = true;
    this.currentTab = filter;

    this.tasksService
      .getTasks(this.caseId as string, filter)
      .pipe(
        takeUntil(this.unsubscribe$),
        tap(res => {
          this.tasksList = res.items;
          if (!this.expandedTaskIndex && res.items.length && res.items[0]?.subtasks_ct > 0) {
            this.setExpandedTaskIndex(0, res.items[0].task_id);
          }
          this.loading = false;
        })
      )
      .subscribe();
  }

  public deleteTask(task: any): void {
    const notification: Notification = this.notificationsService.addNotification({ title: `Deleting Task` });

    this.tasksService
      .deleteTask(this.caseId, task.task_id)
      .pipe(
        takeUntil(this.unsubscribe$),
        tap(() => {
          this.notificationsService.ok(notification, 'Task Deleted');
          this.subtasks = this.subtasks?.filter((subtask: Subtask) => subtask.task_id !== task.task_id);
          this.loadTasks(this.currentTab);
          this.expandedTaskIndex = -1;
        }),
        catchError(error => {
          this.notificationsService.failed(notification, error?.error?.message);

          return throwError(error);
        })
      )
      .subscribe();
  }

  public deleteSubtask(task: Task, subtaskId: string, index: number): void {
    const taskId = task.task_id;
    const notification: Notification = this.notificationsService.addNotification({ title: `Updating Task` });

    this.tasksService.deleteSubtask(this.caseId,taskId, subtaskId)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        task.subtasks_ct--;

        this.subtasks?.splice(index, 1);
        this.notificationsService.ok(notification, 'Task Updated');
      })
  }

  public dragStart(task: TaskModel): void {
    this.dragDisabled = true;
    this.draggingTask = task;
  }

  public drop(event: CdkDragDrop<any>): void {
    const previousIndex = this.tasksList.findIndex(el => el === event.item.data);

    moveItemInArray(this.tasksList, previousIndex, event.currentIndex);

    this.dragDisabled = false;
  }

  public dropSubtask(event: CdkDragDrop<TaskModel>): void {
    const notification: Notification = this.notificationsService.addNotification({ title: `Updating Task` });
    const task = {...(this.tasksList.find(item => item.task_id === this.subtasks?.[0].task_id))};

    moveItemInArray(this.subtasks!, event.previousIndex, event.currentIndex);

    task.subtasks_order = [];

    this.subtasks?.forEach((item: any) => task.subtasks_order.push(item.subtask_id));

    const updatedTask = JSON.parse(JSON.stringify(task));

    if (updatedTask.published === 0) {
      delete updatedTask.published;
    }

    this.tasksService.putTask(this.caseId, updatedTask.task_id, updatedTask)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => this.notificationsService.ok(notification, 'Task Updated'));
  }

  public getConvoUserAvatar(userId: string): string {
    return this.userService.getAvatarUrl(24, this.getConvoUserInfo(userId));
  }

  public onSubtaskTitleChange(subtask: any, event: Event, taskId: string): void {
    this.updateSubtask(subtask, (event.target as HTMLInputElement).value, taskId);
  }

  public setEditableAttr(event: Event): void {
    (event.target as HTMLTableCellElement).setAttribute('editable', 'true');
    setTimeout(() => {
      (event.target as HTMLTableCellElement).querySelector('input')?.focus();
    }, 10);
  }

  public unsetTdEditableAttr(event: Event): void {
    (event.target as HTMLInputElement).parentElement?.setAttribute('editable', 'false');
    this.resetEditableRow();
  }

  public resetEditableRow(): void {
    this.currentEditingTask = null;
    this.currentEditingSubtaskIndex = -1;
  }

  public setParticipant(task: any, subtask: any, event: any): void {
    const notification: Notification = this.notificationsService.addNotification({ title: `Updating Task` });
    const updatedSubtask = JSON.parse(JSON.stringify(subtask));

    if (event?.length) {
      updatedSubtask.participants_ids = event;
      subtask.participants_ids = event;
    } else {
     updatedSubtask.participants_ids = [];
    }

    this.updateSubtaskRequest(notification, updatedSubtask, task.task_id)
  }

  public onShowParticipants(): void {
    if (this.currentTab !== this.taskTabs.Self) return;
    this.shownParticipants = true;
  }

  public toggleMenuClass(event: Event): void {
    (event.target as HTMLElement).classList.toggle('expanded');
  }

  // get current participant info
  private getConvoUserInfo(userId: string): WhoAmIResponse | null {
    const participant = this.teamData?.filter((user: any) => user.user_id === userId);

    if (participant) {
      return participant[0];
    } else {
      return null;
    }
  }

  public completeTask(task: TaskModel): void {
    const tasksToAnswer = task.tasks?.map(() => ({ completed: 'completed' }));
    this.tasksService
      .postTaskConfirmation(this.caseId as any, task.task_id as any, {
        task_answers: tasksToAnswer as any,
        user_id: this.userService.userData.user_id
      })
      .pipe(
        take(1),
        switchMap(() => this.loadTasksAsync(this.taskTabs.Completed))
      )
      .subscribe();
  }

  public setEditableSubtask(task: TaskModel, subTaskIndex: number): void {
    this.currentEditingTask = task.task_id;
    this.currentEditingSubtaskIndex = subTaskIndex;
  }

  public setExpandedTaskIndex(index: number, taskId: string): void | null {
    this.subtasks = null;
    this.expandedTaskIndex = index;
    this.showCreateSubtaskSection = false;
    if (!this.subtasksMap.get(taskId)) {
      this.getExpandedSubtasks(taskId);
    } else {
      this.subtasks = this.subtasksMap.get(taskId);
    }
  }

  private getExpandedSubtasks(taskId: string): void {
    this.tasksService.getSubtasks(this.caseId, taskId)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => {
        this.subtasks = res.items;
        this.isSubtaskSectionLoading = false;
        this.subtasksMap.set(taskId, this.subtasks);
      });
  }

  public showLocalDate(date: Date): Date {
    return new Date(date);
  }

  public formatDateForDatePicker(date: Date): string {
    const formatedDate = new Date(date);

    return `${formatedDate.getMonth() + 1}/${formatedDate.getDate()}/${formatedDate.getFullYear()}`
  }

  public updateSubtaskDate(event: any, subtask: any): void {
    const notification: Notification = this.notificationsService.addNotification({ title: `Updating Task` });

    subtask.due_date = new Date(event.selectedDates).toISOString();

    const newSubTask = JSON.parse(JSON.stringify(subtask));
    newSubTask.duration = { due_date: subtask.due_date };

    delete newSubTask.due_date;

    this.resetEditableRow();
    this.updateSubtaskRequest(notification, newSubTask, newSubTask.task_id);
  }

  public updateSubtaskStatus(event: { value: TaskStatuses, text: string }, subtask: Subtask): void {
    const notification: Notification = this.notificationsService.addNotification({ title: `Updating Subtask` });

    if (subtask.responses_ct > 0) {
      this.tasksService.changeSubtaskStatus(this.caseId, subtask.task_id, subtask.subtask_id, Object.values(subtask.responses)[0], event.value).pipe(take(1), catchError(() => {
        this.notificationsService.failed({ title: 'Error occurred' });
        return EMPTY;
      })).subscribe(() => {
        subtask.status = event.value;
        this.notificationsService.addNotification({ title: `Subtask Updated` })
      });
    } else {
      this.tasksService.postSubtaskStatus(this.caseId, subtask.task_id, subtask.subtask_id, event.value).pipe(take(1), catchError(() => {
        this.notificationsService.failed({ title: 'Error occurred' });
        return EMPTY;
      })).subscribe((data) => {
        subtask.responses = { [this.userService.userData.user_id]: data.response_id };
        subtask.responses_ct++;
        subtask.status = event.value;
        this.notificationsService.addNotification({ title: `Subtask Updated` });
      });
    }
  }

  public updateTaskStatus(event: { value: TaskStatuses, text: string }, task: Task): void {
    const notification: Notification = this.notificationsService.addNotification({ title: `Updating Task` });
    if (task.responses_ct > 0) {
      this.tasksService.changeTaskStatus(this.caseId, task.task_id, Object.values(task.responses)[0], event.value).pipe(take(1), catchError(() => {
        this.notificationsService.failed({ title: 'Error occurred' });
        return EMPTY;
      })).subscribe(() => {
        task.status = event.value;
        this.notificationsService.addNotification({ title: `Task Updated` })
      });
    } else {
      this.tasksService.postTaskStatus(this.caseId, task.task_id, event.value).pipe(take(1), catchError(() => {
        this.notificationsService.failed({ title: 'Error occurred' });
        return EMPTY;
      })).subscribe((data) => {
        task.responses = { [this.userService.userData.user_id]: data.response_id };
        task.responses_ct++;
        task.status = event.value;
        this.notificationsService.addNotification({ title: `Task Updated` });
      });
    }
  }

  private loadTasksAsync(filter: TaskTabs): Observable<IDefaultResponse<Task[]>> {
    this.loading = true;
    this.currentTab = filter;

    return this.tasksService.getTasks(this.caseId as string, filter).pipe(
      takeUntil(this.unsubscribe$),
      tap(res => {
        this.tasksList = res.items;
        this.loading = false;
      })
    );
  }

  private createSubtaskRequest(notification: any, subTask: any, taskId: string, updateAssignees: boolean = false): void {
    this.tasksService
      .postSubtasks(this.caseId, taskId, subTask)
      .pipe(
        takeUntil(this.unsubscribe$),
        tap(() => {
          this.notificationsService.ok(notification, 'Task Updated');
          this.getExpandedSubtasks(taskId);
        }),
        catchError(error => {
          this.notificationsService.failed(notification, error?.error?.message);

          return throwError(error);
        })
      )
      .subscribe();
  }

  private updateSubtaskRequest(notification: any, subTask: any, taskId: string): void {
    const subtaskId = subTask.subtask_id;

    delete subTask.subtask_id;
    delete subTask.case_id;
    delete subTask.encoding_ct;
    delete subTask.media_ct;
    delete subTask.task_id;

    this.tasksService
      .putSubtasks(this.caseId as any, taskId, subTask, subtaskId)
      .pipe(
        takeUntil(this.unsubscribe$),
        tap(() => {
          this.notificationsService.ok(notification, 'Task Updated');
          //this.getExpandedSubtasks(taskId);
        }),
        catchError(error => {
          this.notificationsService.failed(notification, error?.error?.message);

          return throwError(error);
        })
      )
      .subscribe();
  }

  public inputFocusOut(event: any, task: any): void {
    if (event.target.value.trim().length > 0) {
      this.updateSubtask(null, event.target.value, task.task_id);
      task.subtasks_ct++;
    } 

    this.showCreateSubtaskSection = false;
  }

  public expandCreateSubtaskSection(): void {
    this.showCreateSubtaskSection = true;
  }

  private updateSubtask(subtask: any, taskName: string, taskId: string, subTaskIndex: number = -1): void {
    const notification: Notification = this.notificationsService.addNotification({ title: `Updating Task` });
    const defaultDate = new Date(new Date().getTime() + (2 * 24 * 60 * 60 * 1000)).toISOString();
    let newSubTask: any;

    if (subtask?.subtask_id) {
      subtask.name = taskName;
      newSubTask = JSON.parse(JSON.stringify(subtask));

      if (!newSubTask?.duration?.due_date) {
        newSubTask.duration = {};
        newSubTask.duration.due_date = defaultDate;
      }
    
      this.updateSubtaskRequest(notification, newSubTask, taskId) 
    } else {
      newSubTask = {
        participants: this.teamData.map((item: any) => item.user_id),
        name: taskName,
        status: 'todo',
        duration: {
          due_date: defaultDate
        },
        published: 1
      };

      this.createSubtaskRequest(notification, newSubTask, taskId);
    }
  }

  private setInitialParticipants(): void {
    this.initialParticipants = [];
    this.teamData.map((pl: any) => {
      const avatar = this.getConvoUserAvatar(pl.user_id);
      this.initialParticipants.push({
        role_id: pl.user_id,
        name: pl.full_name,
        avatar
      });
    });
  }

  @HostListener('document:click', ['$event'])
  private clickOut(event: Event): void {
    this.participants?.forEach(participant => {
      if (participant.nativeElement !== event.target && this.shownParticipants) {
        participant.nativeElement.setAttribute('editable', 'false');
      }
    });
  }
}

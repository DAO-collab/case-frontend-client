import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { pluck } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';

import { IDefaultResponse, Subtask, Task } from '@app/interfaces';
import { TaskStatuses } from '@app/enums/task-statuses.enum';
import { API_URL } from '../utils/constants.utils';
import { TaskAnswer } from '../shared/interfaces/task-answer.interface';
import { ISubtaskInterface } from '@app/shared/interfaces/tasks.interface';
import { PostPutTaskResponse } from './interfaces';

@Injectable()
export class TasksService {
  public activateCreateModal: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private withCredentials = { withCredentials: true };

  constructor(private http: HttpClient) {}

  public getTasks(caseId: string, filter: string): Observable<IDefaultResponse<Task[]>> {
    return this.http.get<{ data : IDefaultResponse<Task[]> }>(`${API_URL}/${caseId}/tasks?filter=${filter}`, this.withCredentials).pipe(pluck('data'));
  }

  public postTask(caseId: string, taskModel: any): Observable<any> {
    return this.http.post(`${API_URL}/${caseId}/tasks`, taskModel, this.withCredentials).pipe(pluck('data'));
  }

  public deleteTask(caseId: string, taskId: string): Observable<any> {
    return this.http.delete(`${API_URL}/${caseId}/tasks/${taskId}`, this.withCredentials).pipe(pluck('data'));
  }

  public getTask(caseId: string, taskId: string): Observable<any> {
    return this.http.get(`${API_URL}/${caseId}/tasks/${taskId}`, this.withCredentials).pipe(pluck('data'));
  }

  public putTask(caseId: string, taskId: string, taskModel: any): Observable<any> {
    return this.http.put(`${API_URL}/${caseId}/tasks/${taskId}`, taskModel, this.withCredentials).pipe(pluck('data'));
  }

  public postTaskConfirmation(caseId: string, taskId: string, request: TaskAnswer): Observable<TaskAnswer> {
    return this.http.post<TaskAnswer>(`${API_URL}/${caseId}/tasks/answers/${taskId}`, request, this.withCredentials);
  }

  public postTaskStatus(caseId: string, taskId: string, taskStatus: TaskStatuses): Observable<PostPutTaskResponse['data']> {
    return this.http.post<PostPutTaskResponse['data']>(`${API_URL}/${caseId}/tasks/${taskId}/responses`, { status: taskStatus }, this.withCredentials).pipe(pluck('data'));
  }

  public changeTaskStatus(caseId: string, taskId: string, responseId: string, taskStatus: TaskStatuses): Observable<PostPutTaskResponse> {
    return this.http.put<PostPutTaskResponse>(`${API_URL}/${caseId}/tasks/${taskId}/responses/${responseId}`, { status: taskStatus }, this.withCredentials);
  }

  public postSubtaskStatus(caseId: string, taskId: string, subtaskId: string, taskStatus: TaskStatuses): Observable<PostPutTaskResponse['data']> {
    return this.http.post<PostPutTaskResponse['data']>(`${API_URL}/${caseId}/tasks/${taskId}/subtasks/${subtaskId}/responses`, { status: taskStatus }, this.withCredentials).pipe(pluck('data'));
  }

  public changeSubtaskStatus(caseId: string, taskId: string, subtaskId: string, responseId: string, taskStatus: TaskStatuses): Observable<PostPutTaskResponse> {
    return this.http.put<PostPutTaskResponse>(`${API_URL}/${caseId}/tasks/${taskId}/subtasks/${subtaskId}/responses/${responseId}`, { status: taskStatus }, this.withCredentials);
  }

  public getSubtasks(caseId: string, taskId: string): Observable<IDefaultResponse<Subtask[]>> {
    return this.http.get(`${API_URL}/${caseId}/tasks/${taskId}/subtasks`, this.withCredentials).pipe(pluck('data'));
  }

  public postSubtasks(caseId: string, taskId: string, request: ISubtaskInterface): Observable<any> {
    return this.http.post<ISubtaskInterface>(`${API_URL}/${caseId}/tasks/${taskId}/subtasks`, request, this.withCredentials);
  }

  public putSubtasks(caseId: string, taskId: string, request: ISubtaskInterface, subtaskId: string): Observable<any> {
    return this.http.put<ISubtaskInterface>(`${API_URL}/${caseId}/tasks/${taskId}/subtasks/${subtaskId}`, request, this.withCredentials);
  }

  public getSubtask(caseId: string, taskId: string, subtaskId: string): Observable<ISubtaskInterface> {
    return this.http.get<ISubtaskInterface>(`${API_URL}/${caseId}/tasks/${taskId}/subtasks${subtaskId}`, this.withCredentials).pipe(pluck('data'));
  }

  public deleteSubtask(caseId: string, taskId: string, subtaskId: string): Observable<any> {
    return this.http.delete(`${API_URL}/${caseId}/tasks/${taskId}/subtasks/${subtaskId}`, this.withCredentials);
  }
}

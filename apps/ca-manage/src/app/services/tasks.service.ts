import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, pluck } from 'rxjs/operators';
import { API_URL } from '../shared/constants.utils';
import { IApiGridResponse } from '../interfaces/api-response.model';

export interface ITask {
  asset_id?: string;
  asset_type?: string;
  created_on?: string;
  updated_on?: string;
  host_id?: string;
  media?: {
    audios: any;
    docs: any;
    files: any;
    images: any;
    videos: any;
  };
  description: string;
  tag_id?: string;
  due_mins?: number;
  encoding_ct: number;
  media_ct?: number;
  notifications?: {
    names: string[];
    values: string[];
  };
  permissions?: string[];
  tasks_ct: number;
}

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  public activateTaskModal$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private apiUrl: string = '';
  private withCredentials = { withCredentials: true };

  constructor(private http: HttpClient) {
    this.apiUrl = API_URL();
  }

  /**
   * Show Create Task Modal
   */
  public activateModal(): void {
    this.activateTaskModal$.next(true);
  }

  /**
   * Hide Create Task Modal
   */
  public hideModal(): void {
    this.activateTaskModal$.next(false);
  }

  /**
   * Get tasks
   */
  public getTasks(): Observable<{ items: ITask[] }> {
    return this.http.get<{ items: ITask[] }>(`${this.apiUrl}/tasks`, this.withCredentials).pipe(pluck('data'));
  }

  /**
   * Create task
   * @param data: ITask
   */
  public createTask(data: ITask): Observable<ITask> {
    return this.http.post<ITask>(`${this.apiUrl}/tasks`, data, this.withCredentials);
  }

  /**
   * Delete task
   * @param taskId: string
   */
  public deleteTask(taskId: string): Observable<ITask> {
    return this.http.delete<ITask>(`${this.apiUrl}/tasks/${taskId}`, this.withCredentials);
  }

  /**
   * Update task.
   * @param request: ITask
   * @param taskId: string
   */
  public updateForm(request: ITask, taskId: string): Observable<ITask> {
    return this.http.put<ITask>(`${this.apiUrl}/tasks/${taskId}`, request, this.withCredentials);
  }

  /**
   * Get tasks filtered
   */
  public getTasksFilter(filter: string): Observable<IApiGridResponse<ITask[]>> {
    return this.http
      .get<IApiGridResponse<ITask[]>>(`${this.apiUrl}/tasks?filter=${filter}`, this.withCredentials)
      .pipe(pluck('data'));
  }
}

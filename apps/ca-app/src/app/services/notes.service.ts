import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { map, pluck } from 'rxjs/operators';

import { UserService } from './user.service';
import { API_URL } from '../utils/constants.utils';
import { IMedia } from '../pages/feeds/models/feed.model';
import { IDefaultResponse } from '../interfaces/default-response.interface';
import { NoteModel } from '../models/NoteModel';

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  public showCreateNoteModal = false;
  public activeteCreateNoteModal = new Subject<any>();
  public refreshNotesListSubject = new Subject<any>();
  public noteDirectLinkSubject: Subject<{ id: string; action: string } | null> = new Subject();

  private withCredentials = { withCredentials: true };

  constructor(private http: HttpClient, private userService: UserService) {}

  get readAll(): boolean {
    return !!this.userService.notesPermissions.read_all;
  }

  get moderateOthers(): boolean {
    return !!this.userService.notesPermissions.moderate_others;
  }

  get manageOwn(): boolean {
    return !!this.userService.notesPermissions.manage_own;
  }

  public refreshNotesList() {
    this.refreshNotesListSubject.next(true);
  }

  public activateCreateModal() {
    this.activeteCreateNoteModal.next(true);
  }

  public getNotes(caseId: string, limit: number = 20): Observable<IDefaultResponse<Note[]>> {
    return this.http.get(`${API_URL}/${caseId}/notes?limit=${limit}`).pipe(pluck('data'));
  }

  public createNote(
    caseId: string,
    note: NoteModel
  ): Observable<{ case_id: string; note_id: string; selfLink: string }> {
    return this.http.post(`${API_URL}/${caseId}/notes`, note, this.withCredentials).pipe(pluck('data'));
  }

  public deleteNote(caseId: string, noteId: string): Observable<any> {
    return this.http.delete(`${API_URL}/${caseId}/notes/${noteId}`, this.withCredentials);
  }

  public getNote(caseId: string, noteId: string): Observable<any> {
    return noteId
      ? this.http.get<any>(`${API_URL}/${caseId}/notes/${noteId}`).pipe(
          map(r => {
            return r.data;
          })
        )
      : of(null);
  }

  public updateNote(
    caseId: string,
    note: NoteModel
  ): Observable<{ case_id: string; note_id: string; selfLink: string }> {
    return this.http.put(`${API_URL}/${caseId}/notes/${note.note_id}`, note, this.withCredentials).pipe(pluck('data'));
  }

  /**
   * Attach Media To Note
   * @param caseId: string
   * @param moduleItemId: string
   * @param data: { media: { media_key: string }[]
   */
  public attachMediaToNote(
    caseId: string,
    moduleItemId: string,
    data: { media: { media_key: string }[] }
  ): Observable<{ case_id: string; note_id: string; selfLink: string; editLink: string }> {
    return this.http
      .put(`${API_URL}/${caseId}/notes/media/${moduleItemId}`, data, this.withCredentials)
      .pipe(pluck('data'));
  }

  /**
   * Remove note's media
   * @param caseId: string
   * @param moduleItemId: string
   * @param mediaGroup: string
   * @param mediaId: string
   */
  public removeMediaFromNote(
    caseId: string,
    moduleItemId: string,
    mediaGroup: string,
    mediaId: string
  ): Observable<any> {
    return this.http.delete(
      `${API_URL}/${caseId}/notes/media/${moduleItemId}?media_group=${mediaGroup}&media_id=${mediaId}`,
      this.withCredentials
    );
  }
}

export class Note {
  case_id?: string;
  category?: string;
  created_on?: string;
  media?: IMedia;
  media_ct?: number;
  message?: string;
  note_id?: string;
  permissions?: string[];
  updated_on?: string;
  user_id?: string;
  notes: any;
}

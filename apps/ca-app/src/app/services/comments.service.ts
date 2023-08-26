import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';
import { IDefaultResponse, AddComment, AddCommentResponse, DeleteCommentRequest, CommentListResponse } from '@app/interfaces';
import { CommentsListRequest } from '@app/models/CommentsListRequest';
import { API_URL } from '../utils/constants.utils';

@Injectable()
export class CommentsService {
  private withCredentials = { withCredentials: true };

  constructor(private http: HttpClient) {}

  /**
   * addComment - method to add new comment to FEED
   */
  public addComment(caseId: string, feedId: string, message: AddComment): Observable<AddCommentResponse> {
    const requestData = message;

    return this.http
      .post(`${API_URL}/${caseId}/posts/${feedId}/comments`, requestData, this.withCredentials)
      .pipe(pluck('data'));
  }

  /**
   * updateComment
   */
  public updateComment(caseId: string, feedId: string, commentId: string, message: AddComment) {
    return this.http
      .put(`${API_URL}/${caseId}/posts/${feedId}/comments/${commentId}`, message, this.withCredentials)
      .pipe(pluck('data'));
  }

  /**
   * getCommentsList - method to get all comments list for FEED
   */
  public getCommentsList(getCommentReq: CommentsListRequest, limit?: number): Observable<IDefaultResponse<CommentListResponse>> {
    const limitComments = limit ? `?limit=${limit}` : '';
    return this.http
      .get<{ data: IDefaultResponse<CommentListResponse>}>(`${API_URL}/${getCommentReq.case_id}/posts/${getCommentReq.parent_id}/comments${limitComments}`, this.withCredentials)
      .pipe(pluck('data'));
  }

  /**
   * deleteComment - method to remove one comment of FEED
   */
  public deleteComment(deleteCommentRequest: DeleteCommentRequest): Observable<{ data: AddCommentResponse }> {
    return this.http.delete<{ data: AddCommentResponse }>(
      `${API_URL}/${deleteCommentRequest.case_id}/posts/${deleteCommentRequest.parent_id}/comments/${deleteCommentRequest.post_id}`,
      this.withCredentials
    );
  }
}

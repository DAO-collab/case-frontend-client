import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../shared/constants.utils';
import { Observable, Subject } from 'rxjs';
import { IApiGridResponse } from '../interfaces/api-response.model';
import { pluck } from 'rxjs/operators';
import { IFeedPost, IMediaResponse, IAddMediaRequest } from '../pages/modules/media/models/media.model';

@Injectable()
export class ContentMediaService {
  private withCredentials = { withCredentials: true };
  private createFilePopUpSubject = new Subject();

  public createFilePopCommand = this.createFilePopUpSubject.asObservable();

  public activateAddFileModal() {
    this.createFilePopUpSubject.next();
  }

  constructor(private http: HttpClient) {}

  /**
   * Get feed posts
   */
  public getFeedPosts(): Observable<IApiGridResponse<IFeedPost[]>> {
    return this.http.get<IApiGridResponse<IFeedPost[]>>(API_URL('/posts'), this.withCredentials).pipe(pluck('data'));
  }

  public getFeedPostsFilter(filter: string): Observable<IApiGridResponse<IFeedPost[]>> {
    return this.http
      .get<IApiGridResponse<IFeedPost[]>>(API_URL(`/posts?filter=${filter}`), this.withCredentials)
      .pipe(pluck('data'));
  }

  /**
   * Add new feed post
   * @param data: IFeedPost
   */
  public addNewFeedPost(data: IFeedPost): Observable<IMediaResponse> {
    return this.http.post<IMediaResponse>(API_URL('/posts'), data, this.withCredentials).pipe(pluck('data'));
  }

  /**
   * Update feed post
   * @param data: IFeedPost
   * @param postId: string
   */
  public updateFeedPost(data: IFeedPost, postId: string): Observable<IMediaResponse> {
    return this.http.put<IMediaResponse>(API_URL(`/posts/${postId}`), data, this.withCredentials).pipe(pluck('data'));
  }

  /**
   * Remove feed post
   * @param postId: string
   */
  public removeFeedPost(postId: string): Observable<any> {
    return this.http.delete(API_URL(`/posts/${postId}`), this.withCredentials);
  }

  /**
   * Attach media to the feed post
   * @param data: IAddMediaRequest
   * @param postId: string
   */
  public addPostMedia(data: IAddMediaRequest, postId: string): Observable<IMediaResponse> {
    return this.http.put<IMediaResponse>(API_URL(`/media/${postId}`), data, this.withCredentials);
  }

  /**
   * Remove feed post's media
   * @param postId: string
   * @param mediaGroup: string
   * @param mediaId: string
   */
  public removePostMedia(postId: string, mediaGroup: string, mediaId: string): Observable<IMediaResponse> {
    return this.http.delete<IMediaResponse>(
      API_URL(`/media/${postId}?media_group=${mediaGroup}&media_id=${mediaId}`),
      this.withCredentials
    );
  }
}

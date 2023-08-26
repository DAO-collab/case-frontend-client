import { Injectable } from '@angular/core';
import { HttpRequest, HttpClient, HttpBackend, HttpHeaders } from '@angular/common/http';
import { DeleteFeedRequest, FeedsLibraryItem } from '@app/interfaces/feed.interface';
import { IAddFeedRequest, IAwsUploadData } from '../pages/feeds/models/feed.model';
import { GetExtensionResponse } from './../models/GetExtensionResponse';
import { GetMediaInfoRequest } from './../models/GetMediaInfoRequest';
import { IDefaultResponse } from '../interfaces/default-response.interface';
import { API_URL } from '../utils/constants.utils';
import { pluck } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { FeedsListResponse } from '../models/GetFeedsListResponse';

@Injectable()
export class FeedsService {
  public allJson: any;
  public directLink?: { id: string; action: string } | null;

  private withCredentials = { withCredentials: true };
  private httpClient: HttpClient;

  constructor(private http: HttpClient, handler: HttpBackend) {
    this.httpClient = new HttpClient(handler);
  }

  /**
   * Add new feed to the current case
   * @param caseId: case id
   * @param feedData: IAddFeedRequest
   */
  public addFeed(
    caseId: string,
    feedData: IAddFeedRequest
  ): Observable<{ case_id: string; post_id: string; selfLink: string }> {
    return this.http.post(`${API_URL}/${caseId}/posts`, feedData, { withCredentials: true }).pipe(pluck('data'));
  }

  /**
   * getFeeds - get FEEDS list according to current CASE
   * @param caseId: string
   */
  public getFeeds(caseId: string): Observable<FeedsListResponse> {
    return this.http.get(`${API_URL}/${caseId}/posts`).pipe(pluck('data'));
  }

  /**
   * deleteFeedItem - method to delete one FEED
   */
  public deleteFeedItem(deleteFeedRequest: DeleteFeedRequest) {
    return this.http.delete(
      `${API_URL}/${deleteFeedRequest.case_id}/posts/${deleteFeedRequest.post_id}`,
      this.withCredentials
    );
  }

  /**
   * getExtesions - get list of supported files
   */
  public getExtesions(): Observable<GetExtensionResponse> {
    return this.allJson ? of(this.allJson) : this.http.get<GetExtensionResponse>('/opts/en/filetypes/all.json');
  }

  /**
   * getMediaInfo - get list of supported files
   */
  public getMediaInfo(getMediaInfoRequest: GetMediaInfoRequest) {
    return this.http
      .get(
        `${API_URL}/${getMediaInfoRequest.case_id}/posts/${getMediaInfoRequest.post_id}/${getMediaInfoRequest.media_group}/${getMediaInfoRequest.media_id}`,
        this.withCredentials
      )
      .pipe(pluck('data'));
  }

  /**
   * Get upload params for the post media
   * @param caseId: string
   * @param mediaGroup: string
   * @param mediaExtension: string
   * @param moduleName: string
   * @param moduleItemId: string
   * @param tagId: string
   */
  public getUploadParams(
    caseId: string,
    mediaGroup: string,
    mediaExtension: string,
    moduleName: string,
    moduleItemId: string,
    tagId: string
  ): Observable<IAwsUploadData> {
    return this.http
      .get(
        `${API_URL}/${caseId}/drive/private?media_group=${mediaGroup}&media_extension=${mediaExtension}&module_name=${moduleName}&module_item_id=${moduleItemId}&tag_id=${tagId}`,
        this.withCredentials
      )
      .pipe(pluck('data'));
  }

  /**
   * Attach Media To Post
   * @param caseId: string
   * @param moduleItemId: string
   * @param data: { media: { media_key: string }[]
   */
  public attachMediaToPost(
    caseId: string,
    moduleItemId: string,
    data: { media: { media_key: string }[] }
  ): Observable<{ case_id: string; post_id: string; selfLink: string; editLink: string }> {
    return this.http
      .put(`${API_URL}/${caseId}/posts/media/${moduleItemId}`, data, this.withCredentials)
      .pipe(pluck('data'));
  }

  /**
   * Attach Media To Comment
   * @param caseId: string
   * @param moduleItemId: string
   * @param data: { media: { media_key: string }[]
   */
  public attachMediaToComment(
    caseId: string,
    postId: string,
    moduleItemId: string,
    data: { media: { media_key: string }[] }
  ): Observable<IDefaultResponse<{ media_id: string, media_key: string }>> {
    return this.http
      .put(`${API_URL}/${caseId}/posts/${postId}/comments/${moduleItemId}/media`, data, this.withCredentials)
      .pipe(pluck('data'));
  }

  public removeMediaFromComment(
    caseId: string,
    postId: string,
    moduleItemId: string,
    data: { media_group: string, media_id: string }
  ): Observable<IDefaultResponse<{ media_id: string, media_key: string }>> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: data,
      withCredentials: true
    };

    return this.http
      .delete(`${API_URL}/${caseId}/posts/${postId}/comments/${moduleItemId}/media`, options)
      .pipe(pluck('data'));
  }

  /**
   * filetoAWSUpload
   */
  public filetoAWSUpload(AWSData: IAwsUploadData, fileBody: File) {
    const formData: FormData = new FormData();
    const fields: any = AWSData['fields'];
    const keys = Object.keys(fields);

    // Content-Type is empty sometimes so it's better to supply manually in that case
    fields['Content-Type'] = fields['Content-Type'] || fileBody.type;

    keys.forEach(f => formData.append(f, fields[f]));

    formData.append('file', fileBody);

    return this.httpClient.request(
      new HttpRequest('POST', AWSData['url'], formData, { responseType: 'text', reportProgress: true })
    );
  }

  /**
   * updateFeed
   */
  public updateFeed(caseId: string, postId: string, feed: any) {
    return this.http.put(`${API_URL}/${caseId}/posts/${postId}`, feed, this.withCredentials);
  }

  /**
   * removeMedia
   */
  public removeMedia(caseId: string, postId: string, mediaGroup: any, mediaId: string) {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      params: {
        media_group: mediaGroup,
        media_id: mediaId
      },
      withCredentials: true
    };

    return this.http.delete(`${API_URL}/${caseId}/posts/media/${postId}`, options);
  }

  /**
   * Get Posts Templates
   */
  public getPostsTemplates(caseId: string): Observable<IDefaultResponse<FeedsLibraryItem[]>> {
    return this.http.get(`${API_URL}/${caseId}/posts/templates`, this.withCredentials).pipe(pluck('data'));
  }
}

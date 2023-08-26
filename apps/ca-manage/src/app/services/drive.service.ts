import { Injectable } from '@angular/core';
import { API_URL } from '../shared/constants.utils';
import { HttpClient } from '@angular/common/http';
import { pluck } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface IAwsUploadData {
  fields: {
    AWSAccessKeyId: string;
    'Cache-Control': string;
    'Content-Disposition': string;
    'Content-Type': string;
    acl: string;
    key: string;
    policy: string;
    signature: string;
    success_action_status: number;
    'x-amz-meta-media_group': string;
    'x-amz-meta-tag_id': string;
    'x-amz-security-token': string;
  };
  selfLink: string;
  url: string;
}

export enum ModuleName {
  Logo = 'logo',
  Favicon = 'favicon',
  Assets = 'assets',
  Imports = 'imports'
}

@Injectable({
  providedIn: 'root'
})
export class DriveService {
  private withCredentials = { withCredentials: true };

  constructor(private http: HttpClient) {}

  /**
   * Get request data to upload avatar in amazon s3 public bucket
   * @param group: string
   * @param extension: string
   * @param name: string
   */
  public getUploadingRequestData(
    group: string,
    extension: string,
    name: string,
    coords?: number[]
  ): Observable<IAwsUploadData> {
    return this.http
      .get(
        API_URL(
          `/drive/public?media_group=${group}&media_extension=${extension}&module_name=${name}&crop=${
            coords ? coords.join(',') : ''
          }`
        ),
        this.withCredentials
      )
      .pipe(pluck('data'));
  }

  /**
   * Get request data to upload avatar in amazon s3 private bucket
   * @param group: string
   * @param extension: string
   * @param moduleName: ModuleName
   * @param tagId: string
   * @param assetId: string
   */
  public getUploadingRequestDataPrivate(
    group: string,
    extension: string,
    moduleName: ModuleName,
    tagId: string,
    assetId: string
  ): Observable<IAwsUploadData> {
    return this.http
      .get(
        API_URL(
          `/drive/private?media_group=${group}&media_extension=${extension}&module_name=${moduleName}&module_item_id=${assetId}&tag_id=${tagId}`
        ),
        this.withCredentials
      )
      .pipe(pluck('data'));
  }
}

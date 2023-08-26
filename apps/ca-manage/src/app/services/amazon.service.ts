import { Injectable } from '@angular/core';
import { HttpRequest, HttpBackend, HttpClient } from '@angular/common/http';
import { IAwsUploadData } from './drive.service';
import { Observable } from 'rxjs';

@Injectable()
export class AmazonService {
  private httpClient: HttpClient;

  constructor(handler: HttpBackend) {
    this.httpClient = new HttpClient(handler);
  }

  /**
   * Upload file to AWS
   * @param AWSData: IAwsUploadData
   * @param fileBody: File
   */
  public filetoAWSUpload(AWSData: IAwsUploadData, fileBody: File): Observable<any> {
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
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { saveAs as importedSaveAs } from 'file-saver';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PrivateFilesHelperService {
  constructor(private http: HttpClient) {}

  /**
   * Get image file
   * @param imgUrl: string
   * @param withCredentials: boolean
   */
  getImageSrc(imgUrl: string, withCredentials?: boolean): Observable<Blob> {
    return this.http.get(imgUrl, {
      withCredentials: withCredentials !== undefined ? withCredentials : true,
      responseType: 'blob'
    });
  }

  /**
   * Download file
   * @param url: string
   * @param name: string
   */
  downloadFile(url: string, name: string) {
    return this.http
      .get(url, {
        withCredentials: true,
        responseType: 'blob',
        headers: {
          'Content-Type': 'blob'
        }
      })
      .subscribe((responseData: Blob) => importedSaveAs(responseData, name));
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PrivateFilesHelperService {
  constructor(private http: HttpClient) {}

  getImageSrc(imgUrl: string, withCredentials?: boolean) {
    return this.http.get(imgUrl, {
      withCredentials: withCredentials !== undefined ? withCredentials : true
    });
  }
}

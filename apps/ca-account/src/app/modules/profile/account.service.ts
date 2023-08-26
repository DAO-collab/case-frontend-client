import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { of, Observable } from 'rxjs';
import * as _ from 'lodash';
import { pluck } from 'rxjs/operators';
import { IUser } from '@acc/core/user.model';
import { IApiResponse } from '@acc/core/api-response.model';
import { API_URL, RESPONSE_DATA } from '@acc/utils/constants.utils';
import { ContactDetailsType } from './user-contact-details.model';
import { AuthService } from '@acc/auth/auth.service';
import { UserService } from '../../services/user.service';
import { GetS3Options } from './interfaces/get-s3-options.interface';

/**
 * Account service.
 */
@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private deleteAttributes = [
    'birthdate',
    'gender',
    'company',
    'title',
    'address1',
    'address2',
    'locality',
    'region',
    'postal_code',
    'country',
    'create_app',
    'host_write_fields_id',
    'notify_email'
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cookieService: CookieService,
    private userService: UserService
  ) {}

  /**
   * Returns credentials.
   */
  private credentials(params = {}) {
    return {
      headers: { 'X-XSRF-TOKEN': this.cookieService.get('XSRF-TOKEN') },
      withCredentials: true,
      ...params
    };
  }

  /**
   * Verifies code received.
   */
  public verifyCode(type: string, code: string): Observable<IApiResponse> {
    type = type.toLowerCase();

    if (!(type === ContactDetailsType.Email || type === ContactDetailsType.Phone)) {
      throw new Error('Verification type should ether email or phone, got: ' + type);
    }

    return this.http
      .put<{ data: IApiResponse }>(API_URL('/v1/self/contact'), { code, alias_type: type }, this.credentials())
      .pipe(pluck('data'));
  }

  /**
   * Deletes phone number.
   */
  public deletePhone(phoneType: string): Observable<IApiResponse> {
    phoneType = phoneType || 'current';

    if (!(phoneType === 'current' || phoneType === 'new')) {
      throw new Error('Phone type should be ether "current" or "new" got: ' + phoneType);
    }

    return this.http
      .delete<{ data: IApiResponse }>(API_URL('/v1/self/phone?type=' + phoneType), this.credentials())
      .pipe(pluck('data'));
  }

  /**
   * Deletes attributes.
   */
  public deleteValuesByAttributeNames(attributes: string[]): Observable<IApiResponse | null> {
    return attributes.length
      ? this.http
          .delete<{ data: IApiResponse }>(
            API_URL('/v1/self/attributes?attributes=' + attributes.join(',')),
            this.credentials()
          )
          .pipe(pluck('data'))
      : of(null);
  }

  /**
   * Saves contact detail.
   */
  public saveContact(alias_type: string, username: string): Observable<IApiResponse> {
    return this.http
      .post<{ data: IApiResponse }>(API_URL('/v1/self/contact'), { username, alias_type }, this.credentials())
      .pipe(pluck('data'));
  }

  /**
   * Deletes contact.
   */
  public deleteContact(type: string, alias_type: string): Observable<IApiResponse> {
    return this.http
      .delete<{ data: IApiResponse }>(API_URL('/v1/self/contact'), { params: { type, alias_type } })
      .pipe(pluck('data'));
  }

  /**
   * Unused method.
   *
   * Saves company access to user profile.
   */
  public saveAccess(data: any): Observable<any> {
    return this.http.put(API_URL('/v1/self/permissions'), data, this.credentials()).pipe(pluck('data'));
  }

  /**
   * Gets Amazon S3 options.
   */
  private getS3Options(file_extension: string, file_group: string, coords?: [number, number, number, number]): Promise<GetS3Options> {
    return this.http
      .get<GetS3Options>(
        API_URL('/v1/self/drive/public'),
        this.credentials({
          params: {
            media_group: file_group,
            media_extension: file_extension,
            module_name: 'avatar',
            crop: coords?.join(',')
          }
        })
      )
      .toPromise();
  }

  /**
   * Uploads to Amazon S3.
   */
  private uploadToS3(url: string, policy: {[key: string]: string}, file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const fd = new FormData();

      Object.keys(policy).forEach(key => {
        fd.append(key, policy[key]);
      });

      fd.append('file', file);

      const xhr = new XMLHttpRequest();
      // xhr.withCredentials = true;

      xhr.addEventListener('load', uploadComplete, false);
      xhr.addEventListener('error', uploadFailed, false);
      xhr.addEventListener('abort', uploadFailed, false);

      xhr.open('POST', url, true);
      xhr.setRequestHeader('cache-control', 'no-cache');

      xhr.withCredentials = false;
      xhr.send(fd);
      function uploadComplete() {
        resolve(xhr.responseText);
      }

      function uploadFailed(e: any) {
        reject(e);
      }
    });
  }

  /**
   * Removes avatar.
   */
  public deleteAvatar() {
    this.authService.removeAvatar().toPromise();
  }

  /**
   * Uploads avatar.
   */
  public uploadAvatar(file: File, croperCoords: [number, number, number, number]): Promise<{ data: string }> {
    let file_extension!: string;

    if (file) {
      file_extension = file.type.split('/')[1];
    }

    return this.getS3Options(file_extension, 'images', croperCoords)
      .then(RESPONSE_DATA)
      .then((data: GetS3Options['data']) => {
        data.s3_url.fields['Content-Type'] = file.type;

        return this.uploadToS3(data.s3_url.url, data.s3_url.fields, file)
          .then(() => data.s3_url.fields['key'])
          .then(() => {
            this.authService.getCurrentUser().toPromise();
            // const dataToSend: any = { key: key };

            // if (croperCoords.length) {
            //   dataToSend.crop = croperCoords;
            // }

            // return this.http.put(
            //   API_URL(environment.PUBLIC_CDN_URL + `/users/{user_id}/avatar/images/avatar.png?max_age={max_age}&width={width}&height={height}`),
            //   dataToSend,
            //   this.credentials()
            // ).toPromise().then((response) => {
            return this.userService.getProfile();
            //   return response;
            // }).catch((err) => {
            //   return err;
            // });
          })
          .then((user: IUser) => {
            return {
              data: this.userService.getAvatarUrl(user, '150')
            };
          });
      });
  }

  /**
   * Saves account.
   */
  public saveAccount(user: Partial<IUser>): Observable<IApiResponse> {
    user = _.cloneDeep(user);

    if (!_.isUndefined(user.email)) {
      delete user.email;
    }

    if (!_.isUndefined(user.phone)) {
      delete user.phone;
    }

    return this.http.put<{ data: IApiResponse }>(API_URL('/v1/self'), user, this.credentials()).pipe(pluck('data'));
  }

  /**
   * Saves profile.
   */
  public saveProfile(profile: Partial<IUser>): Observable<IApiResponse> {
    return this.http.put(API_URL('/v1/self'), profile, this.credentials()).pipe(pluck('data'));
  }

  /**
   * Attributes to be deleted.
   */
  public attributesToBeRemoved(profile: Partial<IUser>): string[] {
    let attributesToDelete: string[] = [];

    Object.keys(profile).forEach(fieldName => {
      if (profile[fieldName as keyof IUser]) {
        if (!(profile[fieldName as keyof IUser] as string)?.length) {
          attributesToDelete.push(fieldName);
        }
      } else {
        attributesToDelete.push(fieldName);
      }
    });

    // Clean the fields which should be removed, from put request
    attributesToDelete.forEach(k => {
      delete profile[k as keyof IUser];
    });

    attributesToDelete = attributesToDelete.filter(a => this.deleteAttributes.indexOf(a) > -1);

    return attributesToDelete;
  }
}

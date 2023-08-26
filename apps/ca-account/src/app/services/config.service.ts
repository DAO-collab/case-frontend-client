import { Injectable } from '@angular/core';
import { ErrorComponent } from '@acc/common/components/error/error.component';
import * as _ from 'lodash';
import { SettingsService } from '../core/settings.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private loadTry = false;
  private messages: { [key: string]: string } = {};

  constructor(private settingsService: SettingsService) {}

  public loadMessages(scope: ErrorComponent): void {
    scope.messages = this.messages;

    if (!this.loadTry) {
      this.settingsService
        .serverResponses(['/responses/error'])
        .toPromise()
        .then((data: { [key: string]: string }[]) => {
          const errs = data[0];

          this.extendErrors(errs);
        });

      this.loadTry = true;
    } else {
      this.extendErrors(this.messages);
    }
  }

  private extendErrors(errs: {[key: string]: string}): void {
    Object.keys(errs).forEach(k => {
      this.messages[k] = errs[k];
    });
    this.messages = errs;
  }
}

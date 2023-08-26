import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SettingsService } from '@acc/core/settings.service';

/**
 * Translate component.
 */
@Component({
  selector: 'app-ca-translate, [app-ca-translate]',
  templateUrl: './translate.component.html'
})
export class TranslateComponent implements OnInit, OnDestroy {
  @Input() message!: string;

  public messages: any = {};

  private destroy$ = new Subject<void>();

  constructor(private settingsService: SettingsService, private translateService: TranslateService) {}

  /**
   * Initializes messages.
   */
  ngOnInit(): void {
    this.loadMessages(this)();
    this.translateService.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadMessages(this)();
    });
  }

  /**
   * Loads messages.
   */
  private loadMessages(scope: this): any {
    return () => {
      this.settingsService.serverResponses(['/responses/error', '/responses/success']).subscribe((data: any[]) => {
        _.extend(scope.messages, data[0], data[1]);
      });
    };
  }

  /**
   * Unsubscribes from observables.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}

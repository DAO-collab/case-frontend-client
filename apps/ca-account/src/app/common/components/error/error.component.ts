import { Component, OnInit, Input } from '@angular/core';
import { ConfigService } from '@acc/services/config.service';

import * as _ from 'lodash';
/**
 * Error component.
 */
@Component({
  selector: 'app-ca-error, [app-ca-error]',
  templateUrl: './error.component.html'
})
export class ErrorComponent implements OnInit {
  @Input() errors: any[] = [];
  @Input() location!: string;

  public messages: { [key: string]: string } = {};
  public showEmpty = false;

  constructor(private configService: ConfigService) {}

  /**
   * Initializes and loads messages.
   */
  ngOnInit(): void {
    this.messages = {};
    this.configService.loadMessages(this);
  }
}

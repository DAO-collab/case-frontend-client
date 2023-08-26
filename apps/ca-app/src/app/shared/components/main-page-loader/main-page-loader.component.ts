import { Component, OnInit } from '@angular/core';

import { ACCOUNT_CLIENT_URL } from '../../../utils/constants.utils';

@Component({
  selector: 'app-main-page-loader',
  templateUrl: './main-page-loader.component.html',
  styleUrls: ['./main-page-loader.component.css']
})
export class MainPageLoaderComponent implements OnInit {
  accountClientUrl = ACCOUNT_CLIENT_URL;

  constructor() {}

  ngOnInit(): void {}
}

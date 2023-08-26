import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { HostService } from '../../services/host.service';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.css']
})
export class NotFoundComponent implements OnInit, OnDestroy {
  htmlEl = document.querySelector('html');

  constructor(private titleService: Title, private hostService: HostService) {}

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | 404 Not Found`);
    this.htmlEl?.classList.add('d');
  }

  ngOnDestroy() {
    this.htmlEl?.classList.remove('d');
  }
}

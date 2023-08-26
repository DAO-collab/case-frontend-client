import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-server-error-modal',
  templateUrl: './server-error-modal.component.html',
  styleUrls: ['./server-error-modal.component.css']
})
export class ServerErrorModalComponent implements OnInit {
  constructor() {}

  ngOnInit() {}

  public closeModal(): void {
    const elem = document.querySelector('.server-error-popup');

    elem?.classList.remove('shown');
  }
}

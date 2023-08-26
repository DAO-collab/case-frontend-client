import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DomainsService } from '../domains/domains.service';

@Component({
  selector: 'app-sso',
  templateUrl: './sso.component.html',
  styleUrls: ['./sso.component.css']
})
export class SsoComponent implements OnInit, OnDestroy {
  private unsubscribe$: Subject<void> = new Subject();

  constructor(private route: ActivatedRoute, private domainsService: DomainsService) {}

  ngOnInit(): void {
    this.domainsService
      .getSso(this.route.snapshot.paramMap.get('id')!)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => (window.location.href = res.data.sso_url));
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}

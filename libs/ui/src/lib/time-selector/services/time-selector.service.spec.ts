import { TestBed } from '@angular/core/testing';

import { TimeSelectorService } from './time-selector.service';

describe('TimeSelectorService', () => {
  let service: TimeSelectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeSelectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

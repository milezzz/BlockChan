import { TestBed } from '@angular/core/testing';

import { CreateBoardService } from './create-board.service';

describe('CreateBoardService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CreateBoardService = TestBed.get(CreateBoardService);
    expect(service).toBeTruthy();
  });
});

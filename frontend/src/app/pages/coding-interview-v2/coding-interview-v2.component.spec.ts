import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodingInterviewV2Component } from './coding-interview-v2.component';

describe('CodingInterviewV2Component', () => {
  let component: CodingInterviewV2Component;
  let fixture: ComponentFixture<CodingInterviewV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CodingInterviewV2Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodingInterviewV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

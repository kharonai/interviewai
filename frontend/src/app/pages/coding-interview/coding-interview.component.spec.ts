import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodingInterviewComponent } from './coding-interview.component';

describe('CodingInterviewComponent', () => {
  let component: CodingInterviewComponent;
  let fixture: ComponentFixture<CodingInterviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CodingInterviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodingInterviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodingPromptComponent } from './coding-prompt.component';

describe('CodingPromptComponent', () => {
  let component: CodingPromptComponent;
  let fixture: ComponentFixture<CodingPromptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CodingPromptComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodingPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

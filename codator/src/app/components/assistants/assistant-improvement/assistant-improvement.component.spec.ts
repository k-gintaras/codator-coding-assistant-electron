import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantImprovementComponent } from './assistant-improvement.component';

describe('AssistantImprovementComponent', () => {
  let component: AssistantImprovementComponent;
  let fixture: ComponentFixture<AssistantImprovementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantImprovementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssistantImprovementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

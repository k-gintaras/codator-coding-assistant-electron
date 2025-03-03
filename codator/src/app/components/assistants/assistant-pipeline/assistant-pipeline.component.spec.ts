import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantPipelineComponent } from './assistant-pipeline.component';

describe('AssistantPipelineComponent', () => {
  let component: AssistantPipelineComponent;
  let fixture: ComponentFixture<AssistantPipelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantPipelineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssistantPipelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

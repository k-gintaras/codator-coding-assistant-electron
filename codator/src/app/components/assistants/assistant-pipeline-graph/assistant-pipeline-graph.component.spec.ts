import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantPipelineGraphComponent } from './assistant-pipeline-graph.component';

describe('AssistantPipelineGraphComponent', () => {
  let component: AssistantPipelineGraphComponent;
  let fixture: ComponentFixture<AssistantPipelineGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantPipelineGraphComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssistantPipelineGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

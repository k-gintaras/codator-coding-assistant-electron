import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoryBrainManagementComponent } from './memory-brain-management.component';

describe('MemoryBrainManagementComponent', () => {
  let component: MemoryBrainManagementComponent;
  let fixture: ComponentFixture<MemoryBrainManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoryBrainManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemoryBrainManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

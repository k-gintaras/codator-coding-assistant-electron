import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoryBrainSwapperComponent } from './memory-brain-swapper.component';

describe('MemoryBrainSwapperComponent', () => {
  let component: MemoryBrainSwapperComponent;
  let fixture: ComponentFixture<MemoryBrainSwapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoryBrainSwapperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemoryBrainSwapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

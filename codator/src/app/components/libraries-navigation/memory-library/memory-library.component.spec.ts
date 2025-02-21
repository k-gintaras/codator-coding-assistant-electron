import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoryLibraryComponent } from './memory-library.component';

describe('MemoryLibraryComponent', () => {
  let component: MemoryLibraryComponent;
  let fixture: ComponentFixture<MemoryLibraryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoryLibraryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemoryLibraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

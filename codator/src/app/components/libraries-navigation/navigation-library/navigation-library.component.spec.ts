import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationLibraryComponent } from './navigation-library.component';

describe('NavigationLibraryComponent', () => {
  let component: NavigationLibraryComponent;
  let fixture: ComponentFixture<NavigationLibraryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationLibraryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavigationLibraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

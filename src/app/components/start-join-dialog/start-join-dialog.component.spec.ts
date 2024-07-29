import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartJoinDialogComponent } from './start-join-dialog.component';

describe('StartJoinDialogComponent', () => {
  let component: StartJoinDialogComponent;
  let fixture: ComponentFixture<StartJoinDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartJoinDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StartJoinDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

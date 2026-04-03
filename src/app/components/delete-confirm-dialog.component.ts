import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ChangeDetectionService } from '../services/change-detection.service';
import { LifecycleTrackerService } from '../services/lifecycle-tracker.service';
import { ZoneTrackerService } from '../services/zone-tracker.service';
import { TrackedComponentBase } from '../shared/tracked-component.base';

@Component({
  selector: 'app-delete-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <h2 mat-dialog-title>Delete {{ data.name }}?</h2>
    <mat-dialog-content>
      This opens a Material dialog overlay, mounts a dialog component, traps focus, and will destroy the component again when closed.
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">Cancel</button>
      <button mat-flat-button color="warn" type="button" (click)="confirm()">Delete</button>
    </mat-dialog-actions>
  `
})
export class DeleteConfirmDialogComponent extends TrackedComponentBase {
  constructor(
    lifecycleTracker: LifecycleTrackerService,
    changeDetection: ChangeDetectionService,
    private readonly zoneTracker: ZoneTrackerService,
    private readonly dialogRef: MatDialogRef<DeleteConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: { id: number; name: string }
  ) {
    super('DeleteDialogComponent', lifecycleTracker, changeDetection);
  }

  cancel(): void {
    this.zoneTracker.beginInteraction({
      action: 'User cancelled the delete dialog',
      component: 'DeleteDialogComponent',
      triggerType: 'click',
      reasons: [
        'A dialog button click entered Angular through Zone.js.',
        'Angular checked the overlay because the dialog close action changed visible state.',
        'Closing the dialog destroys the overlay component and returns focus to the page.'
      ],
      optimization: 'Dialogs are overlay-bound components. Keeping them focused and short-lived makes the lifecycle easy to understand and cheap to render.',
      uiChange: 'The delete dialog closed without removing the item.'
    });
    this.dialogRef.close({ confirmed: false });
  }

  confirm(): void {
    this.zoneTracker.beginInteraction({
      action: 'User confirmed deletion in the dialog',
      component: 'DeleteDialogComponent',
      triggerType: 'click',
      reasons: [
        'A dialog button click entered Angular through Zone.js.',
        'Angular checked the overlay because the confirmation changed visible state.',
        'Closing the dialog destroys the overlay component and hands the delete result back to the list.'
      ],
      optimization: 'The dialog is isolated from the main list until the close result returns, which keeps the overlay work focused.',
      uiChange: 'The delete dialog closed and returned a confirmed delete result.'
    });
    this.dialogRef.close({ confirmed: true, id: this.data.id });
  }
}


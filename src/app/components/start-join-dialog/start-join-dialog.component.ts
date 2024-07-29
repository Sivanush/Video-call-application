import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
@Component({
  selector: 'app-start-join-dialog',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule, CommonModule, MatDialogModule,DialogModule,ButtonModule,InputTextModule],
  templateUrl: './start-join-dialog.component.html',
  styleUrls: ['./start-join-dialog.component.scss']
})
export class StartJoinDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<StartJoinDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { peerId: string | null; joinCall: boolean },
    private _snackBar: MatSnackBar,
    private clipboard: Clipboard
  ) {}

  copyToClipboard(): void {
    if (!this.data.joinCall && this.data.peerId) {
      this.clipboard.copy(this.data.peerId);
      this._snackBar.open('ID copied to clipboard', 'Close', { duration: 2000 });
    }
  }
}
import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { filter } from 'rxjs/operators';
import { VideoCallService } from '../../service/video-call.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StartJoinDialogComponent } from '../start-join-dialog/start-join-dialog.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AsyncPipe, MatIconModule, CommonModule, MatButtonModule, MatDialogModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  isMuted = false;
  isVideoOff = false;
  isCallStarted$ = this.videoCallService.isCallStarted$;
  private _peerId = '';

  constructor(
    private videoCallService: VideoCallService,
    private _snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initializeLocalStream();
    this.initializePeer();
  }

  ngOnDestroy(): void {
    this.videoCallService.destroyPeer();
  }

  private async initializeLocalStream() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.localVideo.nativeElement.srcObject = stream;
      this.videoCallService.setLocalStream(stream);
    } catch (err) {
      console.error('Error accessing media devices.', err);
      this._snackBar.open('Failed to access camera and microphone', 'Close', { duration: 3000 });
    }
  }

  private initializePeer(): void {
    this.videoCallService.initPeer().then(peerId => {
      this._peerId = peerId;
    }).catch(error => {
      console.error('Failed to initialize peer', error);
      this._snackBar.open('Failed to initialize peer', 'Close', { duration: 3000 });
    });

    this.videoCallService.remoteStream$.pipe(filter(Boolean)).subscribe(stream => {
      this.remoteVideo.nativeElement.srcObject = stream;
    });
  }

  startCall(): void {
    this.showCallInfoDialog(false);
  }

  joinCall(): void {
    this.showCallInfoDialog(true);
  }

  private showCallInfoDialog(isJoining: boolean): void {
    const dialogRef = this.dialog.open(StartJoinDialogComponent, {
      width: '300px',
      data: { peerId: isJoining ? null : this._peerId, joinCall: isJoining }
    });

    dialogRef.afterClosed().subscribe(remotePeerId => {
      if (remotePeerId) {
        if (isJoining) {
          this.videoCallService.joinCall(remotePeerId).catch(error => {
            this._snackBar.open(`Failed to join call: ${error}`, 'Close', { duration: 3000 });
          });
        } else {
          this.videoCallService.startCall().catch(error => {
            this._snackBar.open(`Failed to start call: ${error}`, 'Close', { duration: 3000 });
          });
        }
      }
    });
  }

  endCall(): void {
    this.videoCallService.endCall();
    this._snackBar.open('Call ended', 'Close', { duration: 3000 });
  }

  toggleAudio(): void {
    this.videoCallService.toggleAudio();
    this.isMuted = this.videoCallService.isAudioMuted();
    this._snackBar.open(this.isMuted ? 'Microphone muted' : 'Microphone unmuted', 'Close', { duration: 2000 });
  }

  toggleVideo(): void {
    this.videoCallService.toggleVideo();
    this.isVideoOff = this.videoCallService.isVideoOff();
    this._snackBar.open(this.isVideoOff ? 'Camera turned off' : 'Camera turned on', 'Close', { duration: 2000 });
  }
}
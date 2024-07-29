import { Injectable } from '@angular/core';
import Peer, { MediaConnection, PeerJSOption } from 'peerjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class VideoCallService {
  private _peer!: Peer;
  private _mediaCall!: MediaConnection;
  private localStreamBs = new BehaviorSubject<MediaStream | null>(null);
  public localStream$ = this.localStreamBs.asObservable();
  private remoteStreamBs = new BehaviorSubject<MediaStream | null>(null);
  public remoteStream$ = this.remoteStreamBs.asObservable();
  private isCallStartedBs = new BehaviorSubject<boolean>(false);
  public isCallStarted$ = this.isCallStartedBs.asObservable();
  private localStream: MediaStream | null = null;

  constructor(private _snackBar: MatSnackBar) {}

  async initPeer(): Promise<string> {
    if (this._peer && !this._peer.disconnected) {
      return this._peer.id;
    }

    const peerJsOptions: PeerJSOption = {
      debug: 3,
      config: {
        iceServers: [
          { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
        ]
      }
    };

    try {
      const id = uuidv4();
      this._peer = new Peer(id, peerJsOptions);
      return new Promise((resolve) => {
        this._peer.on('open', () => resolve(id));
      });
    } catch (error) {
      console.error(error);
      this._snackBar.open('Failed to initialize peer', 'Close');
      return '';
    }
  }

  async startCall(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.localStreamBs.next(stream);
      this.isCallStartedBs.next(true);
      this.enableCallAnswer();
    } catch (err) {
      console.error(err);
      this._snackBar.open('Failed to start call', 'Close');
      this.isCallStartedBs.next(false);
    }
  }

  async joinCall(remotePeerId: string): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.localStreamBs.next(stream);
      
      this._mediaCall = this._peer.call(remotePeerId, stream);
      if (!this._mediaCall) {
        throw new Error('Unable to connect to remote peer');
      }

      this._mediaCall.on('stream', (remoteStream) => {
        this.remoteStreamBs.next(remoteStream);
        this.isCallStartedBs.next(true);
      });

      this._mediaCall.on('error', this.handleCallError.bind(this));
      this._mediaCall.on('close', this.onCallClose.bind(this));
    } catch (err) {
      console.error(err);
      this._snackBar.open('Failed to join call', 'Close');
      this.isCallStartedBs.next(false);
    }
  }

  private enableCallAnswer(): void {
    this._peer.on('call', (call) => {
      call.answer(this.localStreamBs.value!);
      this._mediaCall = call;
      
      call.on('stream', (remoteStream) => {
        this.remoteStreamBs.next(remoteStream);
        this.isCallStartedBs.next(true);
      });

      call.on('error', this.handleCallError.bind(this));
      call.on('close', this.onCallClose.bind(this));
    });
  }

  private handleCallError(err: Error): void {
    console.error(err);
    this._snackBar.open(err.message, 'Close');
    this.isCallStartedBs.next(false);
  }

  private onCallClose(): void {
    this.remoteStreamBs.value?.getTracks().forEach(track => track.stop());
    this.localStreamBs.value?.getTracks().forEach(track => track.stop());
    this.remoteStreamBs.next(null);
    this.localStreamBs.next(null);
    this.isCallStartedBs.next(false);
    this._snackBar.open('Call Ended', 'Close');
  }


  setLocalStream(stream: MediaStream): void {
    this.localStream = stream;
    this.localStreamBs.next(stream);
  }


  toggleAudio(): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }



  toggleVideo(): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }

  isAudioMuted(): boolean {
    return this.localStream?.getAudioTracks()[0]?.enabled === false;
  }

  isVideoOff(): boolean {
    return this.localStream?.getVideoTracks()[0]?.enabled === false;
  }

  public endCall(): void {
    this._mediaCall?.close();
    this.onCallClose();
  }

  public destroyPeer(): void {
    this._mediaCall?.close();
    this._peer?.disconnect();
    this._peer?.destroy();
  }
}
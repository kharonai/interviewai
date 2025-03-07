import { Injectable } from '@angular/core';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { Observable, Subject } from 'rxjs';

export interface SpeechState {
  isSpeaking: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  private speechConfig!: SpeechSDK.SpeechConfig; // Added definite assignment assertion (!)
  private synthesizer!: SpeechSDK.SpeechSynthesizer; // Added definite assignment assertion (!)
  private speechStateSubject = new Subject<SpeechState>();
  
  constructor() {
    this.initialize();
  }
  
  private initialize(): void {
    // Replace these with your actual Azure Speech Service credentials
    this.speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      'FJFgX9PhdsBcLj11dmYad6A80oLsPVxywtrSBcCNPbh383hj8vmPJQQJ99BCAC8vTInXJ3w3AAAYACOGh2oV',
      'westus2'  // e.g., 'eastus'
    );
    
    // Configure voice - you can choose different voices
    this.speechConfig.speechSynthesisVoiceName = 'en-US-JennyNeural';
    
    // Create the synthesizer
    this.synthesizer = new SpeechSDK.SpeechSynthesizer(this.speechConfig);
  }
  
  speak(text: string): Observable<SpeechState> {
    this.speechStateSubject.next({ isSpeaking: true });
    
    this.synthesizer.speakTextAsync(
      text,
      result => {
        if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          console.log("Speech synthesis completed successfully");
          this.speechStateSubject.next({ isSpeaking: false });
        } else {
          console.error(`Speech synthesis failed: ${result.errorDetails}`);
          this.speechStateSubject.next({ isSpeaking: false });
        }
      },
      error => {
        console.error(`Error during synthesis: ${error}`);
        this.speechStateSubject.next({ isSpeaking: false });
      }
    );
    
    return this.speechStateSubject.asObservable();
  }
  
  stopSpeaking(): void {
    this.synthesizer.close();
    this.initialize(); // Reinitialize for future use
    this.speechStateSubject.next({ isSpeaking: false });
  }
  
  dispose(): void {
    if (this.synthesizer) {
      this.synthesizer.close();
    }
  }
}

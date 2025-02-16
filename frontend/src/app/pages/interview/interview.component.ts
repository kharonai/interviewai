import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-interview',
  templateUrl: './interview.component.html',
  styleUrls: ['./interview.component.css']
})
export class InterviewComponent implements AfterViewChecked {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  interviewMode: 'text' | 'voice' = 'text';
  chatMessages: { sender: 'user' | 'ai', text: string }[] = [];
  transcriptions: string[] = [];
  userMessageControl = new FormControl('');
  speechRecognition: any;
  speechSynth: SpeechSynthesis;
  currentQuestionIndex = 0;
  aiThinking = false;
  micActive = false;
  interviewEnded = false;
  hasStarted = false; // Prevents AI from repeating the first question

  // Sample AI Questions
  questions = [
    "Tell me about yourself.",
    "What are your strengths and weaknesses?",
    "Describe a challenging project you worked on.",
    "How do you handle conflict in the workplace?",
    "Why do you want this role?"
  ];

  constructor() {
    this.speechSynth = window.speechSynthesis;
    this.startInterview(); // Ensure AI starts immediately
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleMode() {
    if (this.interviewEnded) return;

    this.interviewMode = this.interviewMode === 'text' ? 'voice' : 'text';

    // Only speak if AI has already started the interview
    if (this.interviewMode === 'voice' && this.hasStarted) {
      this.speakAIMessage(this.questions[this.currentQuestionIndex]);
    }
  }

  startInterview() {
    if (!this.hasStarted) {
      this.hasStarted = true;
      this.chatMessages.push({ sender: 'ai', text: this.questions[this.currentQuestionIndex] });

      if (this.interviewMode === 'voice') {
        this.speakAIMessage(this.questions[this.currentQuestionIndex]);
      }
    }
  }

  sendMessage() {
    if (this.interviewMode === 'voice' || this.interviewEnded) return;

    const message = this.userMessageControl.value?.trim();
    if (!message) return;

    this.chatMessages.push({ sender: 'user', text: message });
    this.userMessageControl.reset();
    this.moveToNextQuestion();
  }

  startVoiceRecognition() {
    if (this.interviewEnded) return;

    this.micActive = true;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    this.speechRecognition = new SpeechRecognition();
    this.speechRecognition.continuous = false;
    this.speechRecognition.lang = 'en-US';
    this.speechRecognition.interimResults = false;
    this.speechRecognition.maxAlternatives = 1;

    this.speechRecognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.chatMessages.push({ sender: 'user', text: transcript });
      this.transcriptions.push(transcript);
      this.moveToNextQuestion();
    };

    this.speechRecognition.start();
  }

  stopVoiceRecognition() {
    this.micActive = false;
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
  }

  moveToNextQuestion() {
    if (this.currentQuestionIndex >= this.questions.length - 1) {
      this.endInterview();
      return;
    }

    this.aiThinking = true;
    setTimeout(() => {
      this.aiThinking = false;
      this.currentQuestionIndex++;
      const question = this.questions[this.currentQuestionIndex];
      this.chatMessages.push({ sender: 'ai', text: question });

      if (this.interviewMode === 'voice') {
        setTimeout(() => this.speakAIMessage(question), 500);
      }
    }, 2000);
  }

  endInterview() {
    this.interviewEnded = true;
    this.userMessageControl.reset();
    this.chatMessages.push({ sender: 'ai', text: "That's the end of the interview. Thank you!" });

    if (this.speechRecognition) this.speechRecognition.stop();
    this.speechSynth.cancel();
  }

  scrollToBottom() {
    this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
  }

  speakAIMessage(message: string) {
    if (!this.speechSynth || this.interviewEnded) return;

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    this.speechSynth.speak(utterance);
  }
}

import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { InterviewService, Message } from '../../services/interview.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-interview',
  templateUrl: './interview.component.html',
  styleUrls: ['./interview.component.css']
})
export class InterviewComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  interviewMode: 'text' | 'voice' = 'text';
  chatMessages: { sender: 'user' | 'ai', text: string }[] = [];
  userMessageControl = new FormControl('');
  
  // This array holds the full conversation history to be sent to the AI endpoint
  conversation: Message[] = [];
  aiThinking = false;
  interviewEnded = false;

  // For voice recognition (optional)
  speechRecognition: any;
  speechSynth: SpeechSynthesis;
  micActive = false;

  constructor(
    private interviewService: InterviewService,
    private authService: AuthService
  ) {
    this.speechSynth = window.speechSynthesis;
  }

  ngOnInit(): void {
    // Retrieve the current user from AuthService
    const currentUser = this.authService.getCurrentUser();
    const jobTitle = currentUser?.jobTitle || 'the position';
    const resume = currentUser?.resume || 'no resume provided';

    // Begin conversation with a system prompt to set context for the AI
    const systemMessage: Message = {
      role: 'system',
      content: `You are a professional interviewer. Conduct an interview for a candidate applying for ${jobTitle}. The candidate's resume details are: ${resume}.`
    };
    this.conversation.push(systemMessage);

    // Fetch the first AI response dynamically
    this.startInterview();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  startInterview(): void {
    this.aiThinking = true;
    this.interviewService.getNextMessage(this.conversation).subscribe({
      next: (response) => {
        this.aiThinking = false;
        const aiMessage: Message = { role: 'assistant', content: response.message };
        this.conversation.push(aiMessage);
        this.chatMessages.push({ sender: 'ai', text: response.message });
        if (this.interviewMode === 'voice') {
          this.speakAIMessage(response.message);
        }
      },
      error: (err) => {
        this.aiThinking = false;
        console.error('Error starting interview:', err);
      }
    });
  }

  sendMessage(): void {
    if (this.interviewMode === 'voice' || this.interviewEnded) return;
    const messageText = this.userMessageControl.value?.trim();
    if (!messageText) return;

    // Add the user's message to the conversation
    const userMessage: Message = { role: 'user', content: messageText };
    this.conversation.push(userMessage);
    this.chatMessages.push({ sender: 'user', text: messageText });
    this.userMessageControl.reset();

    // Call the backend for the next AI response
    this.aiThinking = true;
    this.interviewService.getNextMessage(this.conversation).subscribe({
      next: (response) => {
        this.aiThinking = false;
        const aiMessage: Message = { role: 'assistant', content: response.message };
        this.conversation.push(aiMessage);
        this.chatMessages.push({ sender: 'ai', text: response.message });
        if (this.interviewMode === 'voice') {
          this.speakAIMessage(response.message);
        }
      },
      error: (err) => {
        this.aiThinking = false;
        console.error('Error fetching AI response:', err);
      }
    });
  }

  scrollToBottom(): void {
    if (this.chatContainer) {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    }
  }

  speakAIMessage(message: string): void {
    if (!this.speechSynth || this.interviewEnded) return;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    this.speechSynth.speak(utterance);
  }

  startVoiceRecognition(): void {
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
      const userMessage: Message = { role: 'user', content: transcript };
      this.conversation.push(userMessage);
      this.chatMessages.push({ sender: 'user', text: transcript });
      this.sendMessage();
    };
    this.speechRecognition.start();
  }

  stopVoiceRecognition(): void {
    this.micActive = false;
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
  }

  toggleMode(): void {
    if (this.interviewEnded) return;
    this.interviewMode = this.interviewMode === 'text' ? 'voice' : 'text';
    if (this.interviewMode === 'voice') {
      const lastAiMessage = this.conversation.filter(msg => msg.role === 'assistant').pop()?.content;
      if (lastAiMessage) {
        this.speakAIMessage(lastAiMessage);
      }
    }
  }

  endInterview(): void {
    this.interviewEnded = true;
    this.userMessageControl.reset();
    this.chatMessages.push({ sender: 'ai', text: "That's the end of the interview. Thank you!" });
    if (this.speechRecognition) this.speechRecognition.stop();
    this.speechSynth.cancel();
  }
}

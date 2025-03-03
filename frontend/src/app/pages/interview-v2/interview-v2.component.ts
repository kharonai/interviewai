import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { InterviewService, Message } from '../../services/interview.service';
import { AuthService } from '../../services/auth.service';
import { SpeechService } from '../../services/speech.service'; // Import the SpeechService
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-interview-v2',
  templateUrl: './interview-v2.component.html',
  styleUrls: ['./interview-v2.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('200ms ease-in-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(30px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class InterviewV2Component implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  @ViewChild('videoElement') private videoElement!: ElementRef<HTMLVideoElement>;

  interviewMode: 'text' | 'voice' = 'text';
  chatMessages: { sender: 'user' | 'ai', text: string }[] = [];
  userMessageControl = new FormControl('');
  
  // Holds the full conversation history (system, user, and AI messages)
  conversation: Message[] = [];
  aiThinking = false;
  interviewEnded = false;
  interviewStarted = false;
  interviewDuration = 0;
  interviewTimer: any;
  
  // UI states
  isMuted = false;
  isCameraOff = false;
  isFullScreen = false;
  showEndConfirmation = false;
  isMinimized = false;
  showNotes = false;
  interviewerName = 'Alex Johnson';
  userNotes = '';

  // For voice mode
  speechRecognition: any;
  speechSynth: SpeechSynthesis;
  micActive = false;
  isListening = false;
  
  // Interview configuration
  maxQuestions = 10;
  questionCount = 0;
  feedback: any = null;
  
  // Interviewer states
  interviewerStates = [
    { url: 'assets/interviewer/neutral.png', state: 'neutral' },
    { url: 'assets/interviewer/speaking.png', state: 'speaking' },
    { url: 'assets/interviewer/thinking.png', state: 'thinking' },
    { url: 'assets/interviewer/pleased.png', state: 'pleased' }
  ];
  currentInterviewerState = 'neutral';

  constructor(
    @Inject(AuthService) private authService: AuthService,
    private interviewService: InterviewService,
    private speechService: SpeechService,
    private router: Router
  ) {
    this.speechSynth = window.speechSynthesis; // Keep for fallback
  }

  ngOnInit(): void {
    // Retrieve interview setup data from localStorage
    const setupData = JSON.parse(localStorage.getItem('interviewSetup') || '{}');
    const role = setupData.role || 'the role';
    const company = setupData.company || 'the company';
    const resume = setupData.resume || 'no resume provided';
    const difficulty = setupData.difficulty || 'medium';

    // Build a system prompt using the interview setup information
    const systemMessage: Message = {
      role: 'system',
      content: `
      You are a professional interviewer and hiring manager at ${company}. You are conducting a realistic interview for a candidate applying for the role of ${role} at ${company} for a ${difficulty}-level position. Begin by greeting the candidate warmly and briefly introducing yourself in a natural, conversational tone—do not include any labels like "Interviewer:" or quotation marks around your text. Then, naturally ask the candidate, "Tell me a little about yourself and your current role." 
      
      After this introduction, use the candidate's resume details (${resume}) to ask one or two follow-up questions. Then continue with three to four more detailed questions that explore the candidate's skills, experiences, and fit for the role. Each question should be concise (at most two sentences) and should be asked one at a time, waiting for the candidate's response before proceeding.
      
      Always maintain a friendly, empathetic, and professional tone. If the candidate's response is vague or off-topic, ask a clarifying question to refocus the conversation. With every new message, include the entire conversation history in your context so that your questions remain relevant and build upon previous answers.

      Example:
      Hello, and welcome! My name is Alex, and I am the hiring manager at ${company}. Could you please tell me a little about yourself and your current role?
      `
    };
    
    this.conversation.push(systemMessage);

    // Set default to voice mode
    this.interviewMode = 'voice';

    // Start interview timer
    this.startTimer();
    
    // Initialize camera for pre-interview preview
    this.initializeCamera();
  }

  startTimer(): void {
    this.interviewTimer = setInterval(() => {
      this.interviewDuration++;
    }, 1000);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  joinInterview(): void {
    // Simulate joining the interview
    this.interviewStarted = true;
    
    // Need to reinitialize camera for the interview view as the video element changes in the DOM
    // Wait for view to update before attempting to initialize the camera
    setTimeout(() => {
      this.initializeCamera();
    }, 100);
    
    // Start the interview with first AI question
    this.startInterview();
  }

  initializeCamera(): void {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (this.videoElement && this.videoElement.nativeElement) {
            this.videoElement.nativeElement.srcObject = stream;
            
            // Preserve camera state if previously turned off
            const videoTracks = stream.getVideoTracks();
            videoTracks.forEach(track => {
              track.enabled = !this.isCameraOff;
            });
          }
        })
        .catch(error => {
          console.error('Error accessing camera:', error);
          this.isCameraOff = true;
        });
    } else {
      console.error('Media devices not supported');
      this.isCameraOff = true;
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    // Clean up resources
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
    
    this.speechSynth.cancel();
    this.speechService.dispose(); // Clean up speech service resources
    
    // Stop interview timer
    if (this.interviewTimer) {
      clearInterval(this.interviewTimer);
    }
    
    // Stop camera if active
    if (this.videoElement && this.videoElement.nativeElement.srcObject) {
      const stream = this.videoElement.nativeElement.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  }

  // Update the startInterview method to use the speech service
  startInterview(): void {
    this.aiThinking = true;
    this.currentInterviewerState = 'thinking';
    this.isMuted = true; // Mute user when AI starts speaking
  
    this.interviewService.getNextMessage(this.conversation).subscribe({
      next: (response) => {
        this.aiThinking = false;
        const aiMessage: Message = { role: 'assistant', content: response.message };
        this.conversation.push(aiMessage);
        this.chatMessages.push({ sender: 'ai', text: response.message });
        
        this.currentInterviewerState = 'speaking';
  
        if (this.interviewMode === 'voice') {
          this.speakAIMessage(response.message);
        }
  
        this.questionCount++;
        
        // The state change to neutral will be handled in speakAIMessage
      },
      error: (err) => {
        this.aiThinking = false;
        this.currentInterviewerState = 'neutral';
        console.error('Error starting interview:', err);
      }
    });
  }

  // Update the speakAIMessage method to use the speech service
  speakAIMessage(message: string): void {
    if (this.interviewEnded) return;
    
    // Cancel any ongoing speech from browser's native API
    this.speechSynth.cancel();
    
    this.currentInterviewerState = 'speaking';
    this.isMuted = true; // Mute user when AI starts speaking
    
    // Use Microsoft Cognitive Services Speech SDK
    this.speechService.speak(message).subscribe({
      next: (state) => {
        if (!state.isSpeaking) {
          setTimeout(() => {
            this.currentInterviewerState = 'neutral';
          }, 500);
        }
      },
      error: () => {
        // On error, fall back to browser's native speech synthesis
        console.warn('Microsoft Speech SDK failed, falling back to browser speech synthesis');
        
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'en-US';
        utterance.rate = 1;
        
        utterance.onstart = () => {
          this.currentInterviewerState = 'speaking';
        };
        
        utterance.onend = () => {
          setTimeout(() => {
            this.currentInterviewerState = 'neutral';
          }, 500);
        };
        
        this.speechSynth.speak(utterance);
      }
    });
  }
  
  // Update the sendMessage method to handle speaking with the speech service
  sendMessage(): void {
    const messageText = this.userMessageControl.value?.trim();
    if (!messageText) return;
  
    const userMessage: Message = { role: 'user', content: messageText };
    this.conversation.push(userMessage);
    this.chatMessages.push({ sender: 'user', text: messageText });
    this.userMessageControl.reset();
  
    // Check if we are at the last AI question
    if (this.questionCount >= this.maxQuestions) {
      this.aiThinking = true;
      this.currentInterviewerState = 'thinking';
      this.isMuted = true; // Mute user when AI starts speaking
      
      this.interviewService.getNextMessage([...this.conversation, { 
        role: 'system', 
        content: "Please answer the candidate's final question and conclude the interview professionally." 
      }])
      .subscribe({
        next: (response) => {
          this.aiThinking = false;
          const aiMessage: Message = { role: 'assistant', content: response.message };
          this.conversation.push(aiMessage);
          this.chatMessages.push({ sender: 'ai', text: response.message });
          
          this.currentInterviewerState = 'speaking';
          
          if (this.interviewMode === 'voice') {
            this.speakAIMessage(response.message);
          }
  
          // End the interview after the AI answers the user's final question
          setTimeout(() => {
            this.endInterview();
          }, 5000);
        },
        error: (err) => {
          this.aiThinking = false;
          this.currentInterviewerState = 'neutral';
          console.error('Error fetching AI response:', err);
        }
      });
      return;
    }
  
    // If it's the 10th question, AI asks the candidate if they have any final questions
    if (this.questionCount === this.maxQuestions - 1) {
      const finalAIQuestion: Message = { 
        role: 'assistant', 
        content: "Now that we are at the end of the interview, do you have any questions for me?" 
      };
      this.conversation.push(finalAIQuestion);
      this.chatMessages.push({ sender: 'ai', text: finalAIQuestion.content });
      
      this.currentInterviewerState = 'speaking';
      
      if (this.interviewMode === 'voice') {
        this.speakAIMessage(finalAIQuestion.content);
      }
      
      setTimeout(() => {
        this.currentInterviewerState = 'neutral';
      }, 2000);
      
      this.questionCount++; // Increment for final question
      return;
    }
  
    // Normal AI response logic
    this.aiThinking = true;
    this.currentInterviewerState = 'thinking';
    this.isMuted = true; // Mute user when AI starts speaking
    
    this.interviewService.getNextMessage(this.conversation).subscribe({
      next: (response) => {
        this.aiThinking = false;
        const aiMessage: Message = { role: 'assistant', content: response.message };
        this.conversation.push(aiMessage);
        this.chatMessages.push({ sender: 'ai', text: response.message });
        
        this.currentInterviewerState = 'speaking';
        
        if (this.interviewMode === 'voice') {
          this.speakAIMessage(response.message);
        } else {
          // If not using voice mode, transition back to neutral after a delay
          setTimeout(() => {
            this.currentInterviewerState = 'neutral';
          }, 2000);
        }
  
        this.questionCount++;
      },
      error: (err) => {
        this.aiThinking = false;
        this.currentInterviewerState = 'neutral';
        console.error('Error fetching AI response:', err);
      }
    });
  }

  scrollToBottom(): void {
    if (this.chatContainer) {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    }
  }

  // speakAIMessage(message: string): void {
  //   if (!this.speechSynth || this.interviewEnded) return;
    
  //   // Cancel any ongoing speech
  //   this.speechSynth.cancel();
    
  //   const utterance = new SpeechSynthesisUtterance(message);
  //   utterance.lang = 'en-US';
  //   utterance.rate = 1;
    
  //   // Set event handlers
  //   utterance.onstart = () => {
  //     this.currentInterviewerState = 'speaking';
  //   };
    
  //   utterance.onend = () => {
  //     setTimeout(() => {
  //       this.currentInterviewerState = 'neutral';
  //     }, 500);
  //   };
    
  //   this.speechSynth.speak(utterance);
  // }

  startVoiceRecognition(): void {
    if (this.interviewEnded) return;
  
    this.micActive = true;
    this.isListening = true;
  
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
  
    this.speechRecognition = new SpeechRecognition();
    this.speechRecognition.continuous = true;
    this.speechRecognition.lang = 'en-US';
    this.speechRecognition.interimResults = false;
    this.speechRecognition.maxAlternatives = 1;
  
    this.speechRecognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      const userMessage: Message = { role: 'user', content: transcript };
      this.conversation.push(userMessage);
      this.chatMessages.push({ sender: 'user', text: transcript });
      this.userMessageControl.reset();
  
      // Send the voice-transcribed message to AI
      this.aiThinking = true;
      this.currentInterviewerState = 'thinking';
      this.isMuted = true; // Mute user when AI starts speaking
  
      this.interviewService.getNextMessage(this.conversation).subscribe({
        next: (response) => {
          this.aiThinking = false;
          const aiMessage: Message = { role: 'assistant', content: response.message };
          this.conversation.push(aiMessage);
          this.chatMessages.push({ sender: 'ai', text: response.message });
  
          this.currentInterviewerState = 'speaking';
  
          if (this.interviewMode === 'voice') {
            this.speakAIMessage(response.message);
          }
  
          this.questionCount++;
        },
        error: (err) => {
          this.aiThinking = false;
          this.currentInterviewerState = 'neutral';
          console.error('Error fetching AI response:', err);
        }
      });
    };
  
    this.speechRecognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      this.micActive = false;
      this.isListening = false;
    };
  
    this.speechRecognition.onend = () => {
      if (this.isListening) {
        // If we're still supposed to be listening, restart
        this.speechRecognition.start();
      } else {
        this.micActive = false;
      }
    };
  
    this.speechRecognition.start();
  }

  stopVoiceRecognition(): void {
    this.micActive = false;
    this.isListening = false;
    
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.stopVoiceRecognition();
    } else {
      this.startVoiceRecognition();
    }
  }

  toggleCamera(): void {
    this.isCameraOff = !this.isCameraOff;
    
    if (this.videoElement && this.videoElement.nativeElement) {
      const stream = this.videoElement.nativeElement.srcObject as MediaStream;
      if (stream) {
        const videoTracks = stream.getVideoTracks();
        videoTracks.forEach(track => {
          track.enabled = !this.isCameraOff;
        });
      }
    }
  }

  toggleFullScreen(): void {
    this.isFullScreen = !this.isFullScreen;
    const elem = document.documentElement;
    
    if (this.isFullScreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
  }

  toggleNotes(): void {
    this.showNotes = !this.showNotes;
  }

  confirmEndInterview(): void {
    this.showEndConfirmation = true;
  }

  cancelEndInterview(): void {
    this.showEndConfirmation = false;
  }

  endInterview(): void {
    this.interviewEnded = true;
    this.userMessageControl.reset();
    this.isListening = false;
    this.showEndConfirmation = false;
    
    // Add final message
    if (!this.chatMessages.some(msg => msg.text.includes("concludes our interview"))) {
      this.chatMessages.push({ 
        sender: 'ai', 
        text: "That concludes our interview. Thank you for your time! I'll be generating your feedback shortly." 
      });
    }
  
    if (this.speechRecognition) this.speechRecognition.stop();
    this.speechSynth.cancel();
    this.speechService.stopSpeaking(); // Stop any ongoing speech from the service
  
    // Stop interview timer
    if (this.interviewTimer) {
      clearInterval(this.interviewTimer);
    }
    
    // Store transcript for feedback
    localStorage.setItem('interviewTranscript', JSON.stringify(this.chatMessages));
  }

  generateFeedback(): void {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id || "guest_user"; // Ensure userId is included
  
    // Check if feedback is already cached
    const cachedFeedback = localStorage.getItem(`interviewFeedback_${userId}`);
    if (cachedFeedback) {
      this.feedback = JSON.parse(cachedFeedback);
      this.navigateToFeedback();
      return;
    }
  
    // Get transcript from localStorage
    const storedTranscript = localStorage.getItem('interviewTranscript');
    if (!storedTranscript) {
      console.warn("No interview transcript found.");
      return;
    }
  
    let parsedTranscript;
    try {
      parsedTranscript = JSON.parse(storedTranscript);
      
      if (!Array.isArray(parsedTranscript)) {
        throw new Error("Invalid transcript format: Expected an array.");
      }
    } catch (error) {
      console.error("Error parsing transcript:", error);
      return;
    }
  
    // Show loading state
    this.chatMessages.push({ 
      sender: 'ai', 
      text: "Generating your feedback based on our interview. This may take a moment..." 
    });
    
    // Send transcript to AI for feedback
    this.interviewService.getInterviewFeedback({
      transcript: parsedTranscript,
      userId,
      force: false
    }).subscribe({
      next: (response) => {
        this.feedback = response;
        localStorage.setItem(`interviewFeedback_${userId}`, JSON.stringify(response));
        this.navigateToFeedback();
      },
      error: (err) => {
        console.error('Error fetching interview feedback:', err);
        this.chatMessages.push({ 
          sender: 'ai', 
          text: "I'm sorry, I wasn't able to generate feedback. Please try again later." 
        });
      }
    });
  }
  
  navigateToFeedback(): void {
    this.router.navigate(['/interview-feedback']);
  }

  getInterviewerImage(): string {
    const state = this.interviewerStates.find(s => s.state === this.currentInterviewerState);
    return state ? state.url : this.interviewerStates[0].url;
  }
}
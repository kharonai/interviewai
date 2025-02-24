import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { InterviewService, Message } from '../../services/interview.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CodeEditorComponent } from 'src/app/components/code-editor/code-editor.component';

@Component({
  selector: 'app-coding-interview',
  templateUrl: './coding-interview.component.html',
  styleUrls: ['./coding-interview.component.css']
})
export class CodingInterviewComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  @ViewChild('codeEditor') private codeEditor!: CodeEditorComponent;

  interviewMode: 'text' | 'voice' = 'text';
  chatMessages: { sender: 'user' | 'ai', text: string }[] = [];
  userMessageControl = new FormControl('');
  
  // Holds the full conversation history (system, user, and AI messages)
  conversation: Message[] = [];
  aiThinking = false;
  interviewEnded = false;

  // For voice mode (optional)
  speechRecognition: any;
  speechSynth: SpeechSynthesis;
  micActive = false;

  codingPrompt = ''; // Holds the coding problem from AI

  maxQuestions = 10; // Limit the interview to 10 questions
  questionCount = 0; // Track the number of AI questions asked

  feedback: any = null; // ✅ Declare feedback property at the class level

  constructor(
    @Inject(AuthService) private authService: AuthService,
    private interviewService: InterviewService,
    private router: Router
  ) {
    this.speechSynth = window.speechSynthesis;
  }

  ngOnInit(): void {
    // Retrieve interview setup data from localStorage (set in InterviewSetupComponent)
    const setupData = JSON.parse(localStorage.getItem('interviewSetup') || '{}');
    const role = setupData.role || 'the role';
    const company = setupData.company || 'the company';
    const resume = setupData.resume || 'no resume provided';
    const difficulty = setupData.difficulty || 'medium';

    // Build a system prompt using the interview setup information
    const systemMessage: Message = {
      role: 'system',
      content: `
    You are a professional technical interviewer at ${company}, conducting a coding interview for a ${role} position at a ${difficulty}-level. Begin by greeting the candidate warmly and introducing yourself in a natural, conversational tone (do not use labels like "Interviewer:" or include quotation marks around your text). Start the interview by asking, "Tell me a little about yourself and your current role."
    
    After this initial introduction, smoothly transition into the coding interview by presenting a coding problem. Clearly explain the problem, its constraints, and any example cases if needed. Wait for the candidate’s response before moving on.
    
    If the candidate submits a solution that is nearly optimal, offer positive feedback and then introduce a new coding challenge that is slightly more difficult than the previous one.
    
    Always maintain a friendly, empathetic, and professional tone, and include the entire conversation history with every message to ensure continuity. Do not include any code, just coding question prompt
    
    Example response:
    PROMPT: Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

    You may assume that each input would have exactly one solution, and you may not use the same element twice.

    You can return the answer in any order. 

    Example 1:
    Input: nums = [2,7,11,15], target = 9
    Output: [0,1]
    Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
    
    Example 2:
    Input: nums = [3,2,4], target = 6
    Output: [1,2]

    Example 3:
    Input: nums = [3,3], target = 6
    Output: [0,1]
    .
      `
    };
    
    
    this.conversation.push(systemMessage);

    // Fetch the first AI response dynamically using the conversation history
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

        const prefix = "PROMPT: ";
        this.codingPrompt = response?.message?.split(prefix)[1]?.trim() ?? '';
  
        if (this.interviewMode === 'voice') {
          this.speakAIMessage(response.message);
        }
  
        this.questionCount++; // Start tracking AI questions
      },
      error: (err) => {
        this.aiThinking = false;
        console.error('Error starting interview:', err);
      }
    });
  }
  

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
      this.interviewService.getNextMessage([...this.conversation, { role: 'system', content: "Please answer the candidate's final question and conclude the interview professionally." }])
        .subscribe({
          next: (response) => {
            this.aiThinking = false;
            const aiMessage: Message = { role: 'assistant', content: response.message };
            this.conversation.push(aiMessage);
            this.chatMessages.push({ sender: 'ai', text: response.message });
  
            // End the interview after the AI answers the user's final question
            this.endInterview();
          },
          error: (err) => {
            this.aiThinking = false;
            console.error('Error fetching AI response:', err);
          }
        });
      return;
    }
  
    // If it's the 10th question, AI asks the candidate if they have any final questions
    if (this.questionCount === this.maxQuestions - 1) {
      const finalAIQuestion: Message = { role: 'assistant', content: "Now that we are at the end of the interview, do you have any questions for me?" };
      this.conversation.push(finalAIQuestion);
      this.chatMessages.push({ sender: 'ai', text: finalAIQuestion.content });
      this.questionCount++; // Increment for final question
      return;
    }
  
    // Normal AI response logic
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
  
        this.questionCount++; // Increment AI question count
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
      // Now send the voice-transcribed message to AI:
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
    this.chatMessages.push({ sender: 'ai', text: "That concludes our interview. Thank you for your time!" });
  
    if (this.speechRecognition) this.speechRecognition.stop();
    this.speechSynth.cancel();
  
    localStorage.setItem('interviewTranscript', JSON.stringify(this.chatMessages));
    // Optionally, you can navigate the user back to the dashboard or show a summary
  }

  generateFeedback(): void {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id || "guest_user"; // Ensure userId is included
  
    // Check if feedback is already cached
    const cachedFeedback = localStorage.getItem(`interviewFeedback_${userId}`);
    if (cachedFeedback) {
      this.feedback = JSON.parse(cachedFeedback);
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
  
    // Send transcript to AI for feedback
    this.interviewService.getInterviewFeedback({
      transcript: parsedTranscript, // ✅ Ensure it's an array
      userId,  // ✅ Send userId
      force: false  // ✅ Only force-fetch if explicitly needed
    }).subscribe({
      next: (response) => {
        this.feedback = response;
        localStorage.setItem(`interviewFeedback_${userId}`, JSON.stringify(response)); // ✅ Cache feedback
      },
      error: (err) => {
        console.error('Error fetching interview feedback:', err);
      }
    });
  }
  
  runCode(): void {
    this.interviewService.getCompiledCode(this.codeEditor.getCurrentCode(), 'javascript').subscribe({
      next: (response) => {
        console.log('Compiled code response:', response);
      },
      error: (err) => {
        console.error('Error running code:', err);
      }
    });
  }
  

  requestHelp(): void {
    const helpMessage = "I'm here to assist you. Please ask your question.";
    this.chatMessages.push({ sender: 'ai', text: helpMessage });
    if (this.interviewMode === 'voice') {
      this.speakAIMessage(helpMessage);
    }
  }
}

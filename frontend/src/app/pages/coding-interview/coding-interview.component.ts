import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { InterviewService, Message } from '../../services/interview.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CodeEditorComponent } from 'src/app/components/code-editor/code-editor.component';
import { SYSTEM_PROMPTS, InterviewPromptParams, DEFAULT_SYSTEM_PROMPT } from 'src/app/config/system-prompts';

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

  // Prompt parameters will be used to dynamically generate system prompts.
  promptParams!: InterviewPromptParams;

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

    // Build the prompt parameters
    this.promptParams = {
      role,
      company,
      resume,
      difficulty
    };

    // Use the 0th prompt from the external system prompts.
    const systemMessage: Message = {
      role: 'system',
      content: SYSTEM_PROMPTS[0](this.promptParams)
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
  
    this.interviewService.getNextMessage(this.conversation, this.questionCount).subscribe({
      next: (response) => {
        this.aiThinking = false;
        const aiMessage: Message = { role: 'assistant', content: response.message };
        this.conversation.push(aiMessage);
        this.chatMessages.push({ sender: 'ai', text: response.message });
  
        if (this.interviewMode === 'voice') {
          this.speakAIMessage(response.message);
        }
  
        this.questionCount++; // Increment question count.
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
  
    // Add the user's message to the conversation and chat.
    const userMessage: Message = { role: 'user', content: messageText };
    this.conversation.push(userMessage);
    this.chatMessages.push({ sender: 'user', text: messageText });
    this.userMessageControl.reset();
  
    // For questions where questionCount < maxQuestions - 2:
    if (this.questionCount < this.maxQuestions - 2) {
      // Get a system prompt based on the current question number.
      const systemPromptFn =
        SYSTEM_PROMPTS[this.questionCount] ||
        ((qNum: number, params: InterviewPromptParams) => DEFAULT_SYSTEM_PROMPT(qNum, params));
      const promptString = systemPromptFn(this.promptParams);
      const dynamicSystemMessage: Message = { role: 'system', content: promptString };
      this.conversation.push(dynamicSystemMessage);

      console.log("calling ai with this prompt: ", promptString);
      console.log("questionCount == ", this.questionCount);
  
      // Now, request the AI response using the updated conversation.
      this.aiThinking = true;
      this.interviewService.getNextMessage(this.conversation, this.questionCount).subscribe({
        next: (response) => {
          this.aiThinking = false;

          if (this.questionCount === 1) {
            const promptMatch = response.message.match(/PROMPT: (.*)/);
            this.codingPrompt = promptMatch ? promptMatch[1] : '';

            const responseMatch = response.message.match(/RESPONSE: (.*)/);
            response.message = responseMatch ? responseMatch[1] : response.message;
          }

          const aiMessage: Message = { role: 'assistant', content: response.message };
          this.conversation.push(aiMessage);
          this.chatMessages.push({ sender: 'ai', text: response.message });
  
          if (this.interviewMode === 'voice') {
            this.speakAIMessage(response.message);
          }
          this.questionCount++; // Increment question count.
        },
        error: (err) => {
          this.aiThinking = false;
          console.error('Error fetching AI response:', err);
        }
      });
      return;
    }
  
    // For the penultimate question: questionCount === maxQuestions - 1
    if (this.questionCount === this.maxQuestions - 1) {
      const finalAIQuestion: Message = { 
        role: 'assistant', 
        content: "Now that we are at the end of the interview, do you have any questions for me?" 
      };
      this.conversation.push(finalAIQuestion);
      this.chatMessages.push({ sender: 'ai', text: finalAIQuestion.content });
      this.questionCount++; // Increment for final question.
      return;
    }
  
    // For the final question: questionCount >= maxQuestions
    if (this.questionCount >= this.maxQuestions) {
      this.aiThinking = true;
      const concludingSystemMessage: Message = {
        role: 'system',
        content: "Please answer the candidate's final question and conclude the interview professionally."
      };
      this.conversation.push(concludingSystemMessage);
      this.interviewService.getNextMessage(this.conversation, this.questionCount).subscribe({
        next: (response) => {
          this.aiThinking = false;
          const aiMessage: Message = { role: 'assistant', content: response.message };
          this.conversation.push(aiMessage);
          this.chatMessages.push({ sender: 'ai', text: response.message });
          this.endInterview();
        },
        error: (err) => {
          this.aiThinking = false;
          console.error('Error fetching final AI response:', err);
        }
      });
      return;
    }
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

import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { InterviewService, Message } from '../../services/interview.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CodeEditorComponent } from 'src/app/components/code-editor/code-editor.component';

@Component({
  selector: 'app-interview',
  templateUrl: './interview.component.html',
  styleUrls: ['./interview.component.css']
})
export class InterviewComponent implements OnInit, AfterViewChecked {
  @ViewChild(CodeEditorComponent) codeEditor!: CodeEditorComponent;
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  interviewMode: 'text' | 'voice' = 'text';
  chatMessages: { sender: 'user' | 'ai', text: string }[] = [];
  userMessageControl = new FormControl('');
  code: string = ''; // Store updated code for Monaco
  
  // Holds the full conversation history (system, user, and AI messages)
  conversation: Message[] = [];
  aiThinking = false;
  interviewEnded = false;

  // For voice mode (optional)
  speechRecognition: any;
  speechSynth: SpeechSynthesis;
  micActive = false;

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
    You are a professional interviewer and hiring manager at ${company}. You are conducting a realistic interview for a candidate applying for the role of ${role} at ${company} for a ${difficulty}-level position. Begin by greeting the candidate warmly and briefly introducing yourself in a natural, conversational tone—do not include any labels like "Interviewer:" or quotation marks around your text. Then, naturally ask the candidate, "Tell me a little about yourself and your current role." 
    
    After this introduction, use the candidate's resume details (${resume}) to ask one or two follow-up questions. Then continue with three to four more detailed questions that explore the candidate's skills, experiences, and fit for the role. Each question should be concise (at most two sentences) and should be asked one at a time, waiting for the candidate's response before proceeding.
    
    Always maintain a friendly, empathetic, and professional tone. If the candidate’s response is vague or off-topic, ask a clarifying question to refocus the conversation. With every new message, include the entire conversation history in your context so that your questions remain relevant and build upon previous answers.

    You are not a chatbot; you are a real person conducting an interview. Do not say "I am an AI" or "I am a chatbot." Instead, act like a real interviewer. Do not simulate an interview. Do not act like a candidate; you are the interviewer. Do not address yourself as "I'm [Your Name]". Do not say "I am here to help you with your interview." Instead, act like a real interviewer.
    
    Your responses should never say "Candidate" or "User".
    `
    };
    
    this.conversation.push(systemMessage);

    // Fetch the first AI response dynamically using the conversation history
    this.startInterview();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  reviewCode(): void {
    const setupData = JSON.parse(localStorage.getItem('interviewSetup') || '{}');
    const role = setupData.role || 'the role';
    const company = setupData.company || 'the company';
    const resume = setupData.resume || 'no resume provided';
    const difficulty = setupData.difficulty || 'medium';
  
    const code = this.codeEditor.getCurrentCode(); // Get current code
    this.aiThinking = true;
  
    this.interviewService.getNextMessage([...this.conversation, { 
      role: 'system', 
      content: `
          You are an AI-powered coding interviewer and hiring manager conducting a technical interview.
  
          **Instructions:**
          - **Do not modify the candidate's code.**
          - **Provide exactly ONE hint** to help them overcome their issue.
          - **Your hint should be in the same language as the code.**
          - **Insert your hint as a comment directly in the code, without altering any logic.**
          - **Your response must contain the entire code, untouched, with only your comment added.**
  
          **Return the response strictly in this format with no extra text:**
          \`\`\`${this.codeEditor.language}\n
          // (Your hint as a concise comment relevant to the error)
          (Original code exactly as given)
          \`\`\`
  
          DO NOT EDIT THE USERS ORIGINAL CODE OR CORRECT IT IN ANYWAY!
          **Candidate's Code:**
          ${code}
        `
    }])
      .subscribe({
        next: (response) => {
          this.aiThinking = false;
          this.questionCount++; // Increment AI question count
  
          // ✅ Remove code block formatting from AI response
          let aiResponse = response.message.replace(/```[\s\S]*?\n/, '').replace(/```$/, '');
  
          // ✅ Extract AI-generated comment (first line is assumed to be the comment)
          const commentMatch = aiResponse.match(/\/\/.*/);
          let aiComment = commentMatch ? commentMatch[0] : '';
  
          // ✅ Ensure AI used the correct comment syntax
          const commentSyntaxMatch = aiComment.match(/^(\S+)\s/); // Extracts the comment prefix (e.g., "//", "#", etc.)
          const commentSyntax = commentSyntaxMatch ? commentSyntaxMatch[1] : "//"; // Default to "//" if not found
  
          // ✅ Wrap comments at 60 characters while preserving words
          aiComment = this.wrapComment(aiComment, 60, commentSyntax);
  
          // ✅ Reinsert the AI-generated comment into the original code
          const updatedCode = `${aiComment}\n${code}`;
  
          // ✅ Update the code editor with cleaned AI feedback
          this.code = updatedCode;
        },
        error: (err) => {
          this.aiThinking = false;
          console.error('Error fetching AI response:', err);
        }
      });
  }
  
  /**
   * ✅ Helper Function to Wrap Comments at 60 Characters
   * - Preserves words when splitting
   * - Maintains the original comment syntax (e.g., //, #, --)
   * - Ensures prefix (`//`) is **only** added at the start of each line.
   */
  wrapComment(comment: string, maxLength: number, prefix: string): string {
    const words = comment.replace(/^(\S+\s)/, '').split(" "); // Remove initial "//" before splitting
    let wrappedComment = prefix; // Start with the comment syntax
    let line = prefix; // Current line with prefix

    for (let word of words) {
      if ((line.length + word.length + 1) > maxLength) { // +1 for space
        wrappedComment += "\n" + prefix + " " + word; // Start new line with prefix
        line = prefix + " " + word; // Reset line
      } else {
        line += " " + word; // Continue line
        wrappedComment += " " + word;
      }
    }

    return wrappedComment;
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

  getCodeFromEditor() {
    if (this.codeEditor) {
      const currentCode = this.codeEditor.getCurrentCode();
      console.log('Current Code from Editor:', currentCode);
    }
  }
  
}

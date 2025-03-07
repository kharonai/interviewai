import { Component, OnInit } from '@angular/core';
import { InterviewService } from '../../services/interview.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-interview-feedback',
  templateUrl: './interview-feedback.component.html',
  styleUrls: ['./interview-feedback.component.css']
})
export class InterviewFeedbackComponent implements OnInit {
  feedback: any = null; // Store AI feedback
  isLoading: boolean = true; // Track loading state
  
  // Add default feedback data as component properties
  performanceScore: string = '85%';
  keyStrengths: string[] = [
    'Strong technical explanations',
    'Clear and structured answers',
    'Confident communication'
  ];
  
  improvementAreas: string[] = [
    'More concise responses',
    'Stronger behavioral examples',
    'More direct problem-solving approach'
  ];
  
  aiSuggestions: string[] = [
    'Use the STAR method for structured answers.',
    'Practice speaking more concisely.',
    'Prepare real-world examples for common questions.'
  ];
  
  mockTranscript: Array<{role: string, text: string}> = [
    { role: 'AI', text: 'Tell me about yourself.' },
    { role: 'You', text: 'I am a software engineer with 4 years of experience...' },
    { role: 'AI', text: 'What are your strengths and weaknesses?' },
    { role: 'You', text: 'My strength is problem-solving, and my weakness...' }
  ];

  constructor(private authService: AuthService , private interviewService: InterviewService) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id || "guest_user";
    const storedFeedback = localStorage.getItem(`interviewFeedback_${userId}`);
  
    if (storedFeedback) {
      this.feedback = JSON.parse(storedFeedback);
      this.isLoading = false;
    } else {
      const storedTranscript = localStorage.getItem('interviewTranscript');
  
      if (storedTranscript) {
        let parsedTranscript: any = JSON.parse(storedTranscript);
        
        if (!Array.isArray(parsedTranscript)) {
          console.error('Invalid transcript format:', parsedTranscript);
          this.isLoading = false;
          return;
        }
  
        this.interviewService.getInterviewFeedback({
          transcript: parsedTranscript,  // ✅ Ensure it's a valid array
          userId,
          force: false
        }).subscribe({
          next: (response) => {
            this.feedback = response;
            localStorage.setItem(`interviewFeedback_${userId}`, JSON.stringify(response));
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error fetching interview feedback:', err);
            this.isLoading = false;
          }
        });
      } else {
        this.isLoading = false;
      }
    }
  }
  
  reattemptInterview(): void {
    // Logic to start a new interview
    console.log('Reattempt interview functionality will be implemented in the future');
  }
  
  downloadFeedback(): void {
    // Future implementation for downloading feedback as PDF
    console.log('Download feedback functionality will be implemented in the future');
  }
}

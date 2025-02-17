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
  
  
}

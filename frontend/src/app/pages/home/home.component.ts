import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  // Job role animation
  jobRoles: string[] = [
    'Software Engineer',
    'Product Manager',
    'Data Scientist',
    'UX Designer',
    'Frontend Developer',
    'Marketing Manager',
    'Sales Representative',
    'DevOps Engineer'
  ];
  
  displayedJobRole: string = '';
  userJobRole: string = '';
  private currentRole: number = 0;
  private currentChar: number = 0;
  private isDeleting: boolean = false;
  private typingSpeed: number = 100;
  private typingInterval: any;
  private pauseBetweenWords: number = 1500;
  private isPaused: boolean = false;

  constructor() { }

  ngOnInit(): void {
    this.startTypingAnimation();
  }

  ngOnDestroy(): void {
    this.stopTypingAnimation();
  }

  private startTypingAnimation(): void {
    this.typingInterval = setInterval(() => {
      if (this.isPaused) return;
      
      const currentWord = this.jobRoles[this.currentRole];
      
      if (!this.isDeleting) {
        // Typing forward
        this.displayedJobRole = currentWord.substring(0, this.currentChar + 1);
        this.currentChar++;
        
        // If we've typed the whole word
        if (this.currentChar === currentWord.length) {
          this.isDeleting = true;
          this.typingSpeed = this.pauseBetweenWords;
        }
      } else {
        // Deleting
        this.displayedJobRole = currentWord.substring(0, this.currentChar - 1);
        this.currentChar--;
        
        // If we've deleted the whole word
        if (this.currentChar === 0) {
          this.isDeleting = false;
          this.currentRole = (this.currentRole + 1) % this.jobRoles.length;
          this.typingSpeed = 100;
        }
      }
    }, this.typingSpeed);
  }

  private stopTypingAnimation(): void {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
    }
  }

  pauseAnimation(): void {
    // Clear the placeholder when user focuses on the input
    this.displayedJobRole = '';
    this.isPaused = true;
  }

  resumeAnimation(): void {
    // Only resume animation if the user hasn't entered anything
    if (!this.userJobRole) {
      this.isPaused = false;
      
      // Reset animation to start with a new word
      this.currentChar = 0;
      this.isDeleting = false;
      this.currentRole = Math.floor(Math.random() * this.jobRoles.length); // Start with a random role
    }
  }
}

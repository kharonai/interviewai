import { Component, OnInit } from '@angular/core';
import { InterviewService } from '../../services/interview.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-coding-interview-feedback',
  templateUrl: './coding-interview-feedback.component.html',
  styleUrls: ['./coding-interview-feedback.component.css']
})
export class CodingInterviewFeedbackComponent implements OnInit {
  feedback: any = null; // Store AI feedback
  isLoading: boolean = true; // Track loading state
  codeSubmission: string = ''; // Store the user's code submission
  
  // Interview details
  interviewRole: string = 'Software Engineer';
  interviewCompany: string = 'Tech Innovations Inc.';
  interviewDate: string = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Track expanded state for rubric items
  expandedRubricItems: { [key: string]: boolean } = {};
  
  // Default code examples moved from HTML template to component
  defaultCodeExample: string = 'function isPalindrome(str) {\n  str = str.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return str === str.split("").reverse().join("");\n}';
  
  alternativeCodeExample: string = 'function isPalindrome(str) {\n  // Remove non-alphanumeric chars and convert to lowercase\n  str = str.toLowerCase().replace(/[^a-z0-9]/g, "");\n  \n  // Two-pointer approach\n  let left = 0;\n  let right = str.length - 1;\n  \n  while (left < right) {\n    if (str[left] !== str[right]) {\n      return false;\n    }\n    left++;\n    right--;\n  }\n  \n  return true;\n}';

  // Enhanced rubric data with detailed feedback
  rubricItems = [
    { 
      name: 'Communication', 
      score: 8,
      description: 'Clear explanation of solution approach',
      detailedFeedback: 'Your explanation of the algorithm was clear and concise. To improve further, practice explaining your thought process step-by-step as you code, and consider using analogies to make complex concepts more understandable. Effective communication in technical interviews demonstrates not just coding ability but also how well you can collaborate with team members.'
    },
    { 
      name: 'Code Correctness', 
      score: 9,
      description: 'Solution produces correct results',
      detailedFeedback: 'Your code correctly identifies palindromes and handles edge cases well. The solution properly handles empty strings and special characters. For full marks, consider adding more robust input validation and error handling to gracefully manage unexpected inputs like null values or non-string types.'
    },
    { 
      name: 'Code Efficiency', 
      score: 7,
      description: 'Time Complexity: O(n), Space Complexity: O(n)',
      detailedFeedback: 'Your current solution has a time complexity of O(n) which is optimal, but the space complexity is O(n) due to creating new strings during the string reversal. Consider using the two-pointer approach shown in the alternative solution to achieve O(1) space complexity. In interviews, demonstrating awareness of optimization techniques even if you start with a simpler approach shows strong problem-solving skills.'
    },
    { 
      name: 'Code Readability', 
      score: 8,
      description: 'Clean formatting and variable naming',
      detailedFeedback: 'Your code has good formatting and consistent indentation. The variable names are descriptive but concise. To improve further, consider adding more meaningful comments explaining the purpose of key operations, especially for the regex pattern used for sanitizing input. In professional environments, code is read much more often than it is written, so clean, self-documenting code is highly valued.'
    },
    { 
      name: 'Edge/Test Cases', 
      score: 6,
      description: 'Could improve handling of special inputs',
      detailedFeedback: 'Your solution handles basic edge cases like empty strings and special characters, but could be improved by explicitly handling more unusual inputs like extremely long strings, non-string inputs, or Unicode characters. Consider discussing how you would test your solution with examples like "A man, a plan, a canal: Panama" or "Race a car" to demonstrate your thoroughness. Many interview candidates miss points by not addressing edge cases without being prompted.'
    }
  ];

  constructor(private authService: AuthService, private interviewService: InterviewService) {}

  // Method to toggle expanded state of a rubric item
  toggleRubricItem(itemName: string): void {
    this.expandedRubricItems[itemName] = !this.expandedRubricItems[itemName];
  }

  // Method to determine text color based on score
  getScoreColorClass(score: number): string {
    if (score >= 9) {
      return 'text-green-600';
    } else if (score >= 6) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id || "guest_user";
    const storedFeedback = localStorage.getItem(`codingInterviewFeedback_${userId}`);
  
    if (storedFeedback) {
      this.feedback = JSON.parse(storedFeedback);
      this.isLoading = false;
    } else {
      const storedTranscript = localStorage.getItem('codingInterviewTranscript');
      const storedCode = localStorage.getItem('codingSubmission');
      
      if (storedCode) {
        this.codeSubmission = storedCode;
      }
  
      if (storedTranscript) {
        let parsedTranscript: any = JSON.parse(storedTranscript);
        
        if (!Array.isArray(parsedTranscript)) {
          console.error('Invalid transcript format:', parsedTranscript);
          this.isLoading = false;
          return;
        }
  
        this.interviewService.getInterviewFeedback({
          transcript: parsedTranscript,
          userId,
          force: false
        }).subscribe({
          next: (response) => {
            this.feedback = response;
            localStorage.setItem(`codingInterviewFeedback_${userId}`, JSON.stringify(response));
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error fetching coding interview feedback:', err);
            this.isLoading = false;
          }
        });
      } else {
        this.isLoading = false;
      }
    }
  }
  
  downloadFeedback(): void {
    // Future implementation for downloading feedback as PDF
    console.log('Download feedback functionality will be implemented in the future');
  }
  
  reattemptInterview(): void {
    // Logic to start a new coding interview
    console.log('Reattempt interview functionality will be implemented in the future');
  }
}
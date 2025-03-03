import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface Interview {
  id: string;
  date: string;
  role: string;
  company: string;
  score: number;
  feedback: string;
}

interface UserMetrics {
  overallScore: number;
  highestScore: number;
  lowestScore: number;
  numberOfInterviews: number;
  strengths: string[];
  weaknesses: string[];
}

@Component({
  selector: 'app-user-home-page',
  templateUrl: './user-home-page.component.html',
  styleUrls: ['./user-home-page.component.css']
})
export class UserHomePageComponent implements OnInit {
  isLoading = true;
  error: string | null = null;
  userName = 'User';
  sidebarCollapsed = false;
  
  // User metrics
  metrics: UserMetrics = {
    overallScore: 0,
    highestScore: 0,
    lowestScore: 0,
    numberOfInterviews: 0,
    strengths: [],
    weaknesses: []
  };
  
  // Past interviews
  pastInterviews: Interview[] = [];
  
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadUserData();
    // Check if user has a preference for sidebar state in local storage
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      this.sidebarCollapsed = savedState === 'true';
    }
  }
  
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    // Save preference to local storage
    localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed.toString());
  }
  
  loadUserData(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.error = 'User not authenticated';
      this.isLoading = false;
      return;
    }
    
    // Set user name if available
    if (currentUser.name) {
      this.userName = currentUser.name;
    }
    
    // For demo purposes, we're setting mock data
    // In production, you would fetch this from your backend API
    setTimeout(() => {
      this.metrics = {
        overallScore: 84,
        highestScore: 95,
        lowestScore: 65,
        numberOfInterviews: 8,
        strengths: ['Communication Skills', 'Technical Knowledge', 'Problem Solving'],
        weaknesses: ['Time Management', 'System Design', 'Behavioral Questions']
      };
      
      this.pastInterviews = [
        { 
          id: '1', 
          date: '2023-11-15', 
          role: 'Frontend Developer',
          company: 'Tech Solutions Inc', 
          score: 87, 
          feedback: 'Strong technical skills, could improve system design explanations' 
        },
        { 
          id: '2', 
          date: '2023-10-22', 
          role: 'Full Stack Engineer',
          company: 'Digital Innovations', 
          score: 92, 
          feedback: 'Excellent communication and problem solving skills' 
        },
        { 
          id: '3', 
          date: '2023-09-08', 
          role: 'Software Engineer',
          company: 'CodeCraft Systems', 
          score: 78, 
          feedback: 'Good technical foundation, needs work on algorithm optimization' 
        },
        { 
          id: '4', 
          date: '2023-08-17', 
          role: 'React Developer',
          company: 'WebApp Solutions', 
          score: 85, 
          feedback: 'Strong on React concepts, could improve state management approach' 
        }
      ];
      
      this.isLoading = false;
    }, 800);
  }
  
  refreshData(): void {
    this.isLoading = true;
    this.error = null;
    this.loadUserData();
  }
  
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  reattemptInterview(interviewId: string): void {
    // Navigate to the interview setup page with the interview ID
    // This is a placeholder implementation - you would replace this with your actual navigation logic
    console.log(`Reattempting interview with ID: ${interviewId}`);
    // Example: this.router.navigate(['/interview-setup'], { queryParams: { reattempt: interviewId } });
  }
  
  getScoreClass(score: number): string {
    if (score >= 90) return 'high';
    if (score >= 75) return 'medium';
    return 'low';
  }
}
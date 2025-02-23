import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: any = { name: 'User Name' };
  interviews = [
    { role: 'Software Engineer', company: 'Google', mode: 'Voice', status: 'Passed' },
    { role: 'Data Scientist', company: 'Facebook', mode: 'Text', status: 'Pending Review' },
    { role: 'Backend Developer', company: 'Amazon', mode: 'Voice', status: 'Failed' }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user = currentUser;
    }
  }
}

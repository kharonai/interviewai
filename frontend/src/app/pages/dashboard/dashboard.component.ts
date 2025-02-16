import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  user = {
    name: 'John Doe'
  };

  interviews = [
    { role: 'Software Engineer', company: 'Google', mode: 'Voice', status: 'Passed' },
    { role: 'Data Scientist', company: 'Facebook', mode: 'Text', status: 'Pending Review' },
    { role: 'Backend Developer', company: 'Amazon', mode: 'Voice', status: 'Failed' }
  ];
}

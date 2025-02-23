import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, style, animate, transition } from '@angular/animations';
import { Router } from '@angular/router';

@Component({
  selector: 'app-interview-setup',
  templateUrl: './interview-setup.component.html',
  styleUrls: ['./interview-setup.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-in-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class InterviewSetupComponent {
  interviewForm: FormGroup;
  step = 1;

  // Step labels
  steps = ['Role & Company', 'Mode', 'Difficulty', 'Review'];

  // Explicitly store selections
  selectedRole: string = '';
  selectedCompany: string = '';
  selectedMode: string = '';
  selectedDifficulty: string = '';

  constructor(private fb: FormBuilder, private router: Router) {
    this.interviewForm = this.fb.group({
      role: ['', Validators.required],
      company: ['', Validators.required],
      mode: [''],
      difficulty: ['']
    });

    // Update values as soon as user types/selects
    this.interviewForm.get('role')?.valueChanges.subscribe(value => this.selectedRole = value);
    this.interviewForm.get('company')?.valueChanges.subscribe(value => this.selectedCompany = value);
    this.interviewForm.get('mode')?.valueChanges.subscribe(value => this.selectedMode = value);
    this.interviewForm.get('difficulty')?.valueChanges.subscribe(value => this.selectedDifficulty = value);
  }

  nextStep() {
    if (this.step < 4) {
      this.step++;
    }
  }

  prevStep() {
    if (this.step > 1) {
      this.step--;
    }
  }

  setInterviewMode(mode: string) {
    this.interviewForm.patchValue({ mode });
  }

  setDifficulty(level: string) {
    this.interviewForm.patchValue({ difficulty: level });
  }

  onSubmit() {
    console.log('Starting Interview with:', {
      role: this.selectedRole,
      company: this.selectedCompany,
      mode: this.selectedMode,
      difficulty: this.selectedDifficulty
    });

    // Save the interview setup data to local storage
    const setupData = {
      role: this.selectedRole,
      company: this.selectedCompany,
      mode: this.selectedMode,
      difficulty: this.selectedDifficulty
    };
    localStorage.setItem('interviewSetup', JSON.stringify(setupData));

    // Navigate to /interview after form submission
    this.router.navigate(['/interview']);
  }
}

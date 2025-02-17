import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  signupForm: FormGroup;
  resumeFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    // Add jobTitle control since your form collects that
    this.signupForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      jobTitle: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onResumeSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.resumeFile = input.files[0];
    }
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      // Build FormData to include text fields and the resume file
      const formData = new FormData();
      formData.append('name', this.signupForm.get('name')?.value);
      formData.append('email', this.signupForm.get('email')?.value);
      formData.append('jobTitle', this.signupForm.get('jobTitle')?.value);
      formData.append('password', this.signupForm.get('password')?.value);
      if (this.resumeFile) {
        formData.append('resume', this.resumeFile, this.resumeFile.name);
      }

      // Post to the backend signup endpoint
      this.http.post('http://localhost:3000/api/signup', formData)
        .subscribe({
          next: (response: any) => {
            console.log('Signup successful!', response);
            // Store user data in localStorage (for demo purposes)
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            // Notify AuthService that user is logged in
            this.authService.setAuthenticated(true);
            this.authService.setCurrentUser(response.user);
            // Redirect to dashboard
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            console.error('Signup error', error);
          }
        });
    }
  }
}

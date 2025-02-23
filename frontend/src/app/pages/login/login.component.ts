import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      console.log('Logging in:', { email, password });
      this.authService.login(email, password).subscribe({
        next: (response: any) => {
          console.log('Login successful', response);
          // Assume the response has a "user" property containing user data
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.authService.setAuthenticated(true);
          this.authService.setCurrentUser(response.user);
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Login failed', error);
          // Optionally show an error message to the user
        }
      });
    }
  }
}

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.getAuthStatus());

  constructor(private router: Router) {}

  // ✅ Authentication Functions
  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  login(): void {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('profileImage', 'https://i.pravatar.cc/300'); // Default profile image
    this.isAuthenticatedSubject.next(true);
  }

  logout(): void {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('profileImage');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/']);  // Redirect to landing page after logout
  }

  getProfileImage(): string {
    return localStorage.getItem('profileImage') || 'https://i.pravatar.cc/300'; // Default profile pic
  }

  private getAuthStatus(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  // ✅ Settings Functions (Added Without Breaking Anything)
  getJobTitle(): string {
    return localStorage.getItem('jobTitle') || 'Not Specified';
  }

  saveJobTitle(title: string): void {
    localStorage.setItem('jobTitle', title);
  }

  getInterestedRoles(): string {
    return localStorage.getItem('interestedRoles') || 'Not Specified';
  }

  saveInterestedRoles(roles: string): void {
    localStorage.setItem('interestedRoles', roles);
  }

  saveResume(file: File): void {
    localStorage.setItem('resumeName', file.name);
  }

  getResumeName(): string {
    return localStorage.getItem('resumeName') || 'No Resume Uploaded';
  }
}

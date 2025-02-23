import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {
    // Load user data from localStorage at startup, if available.
    const user = localStorage.getItem('currentUser');
    if (user) {
      const parsedUser = JSON.parse(user);
      this.isAuthenticatedSubject.next(true);
      this.currentUserSubject.next(parsedUser);
    }
  }

  // --- Login Methods ---
  login(email: string, password: string): Observable<any> {
    return this.http.post('http://localhost:3000/api/login', { email, password });
  }

  setAuthenticated(status: boolean): void {
    this.isAuthenticatedSubject.next(status);
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  setCurrentUser(user: any): void {
    this.currentUserSubject.next(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  // --- Profile Settings Methods ---

  getJobTitle(): string {
    const user = this.getCurrentUser();
    return user && user.jobTitle ? user.jobTitle : '';
  }

  getInterestedRoles(): string {
    const user = this.getCurrentUser();
    return user && user.interestedRoles ? user.interestedRoles : '';
  }

  getResumeName(): string {
    const user = this.getCurrentUser();
    return user && user.resume ? user.resume : '';
  }

  saveJobTitle(jobTitle: string): void {
    const user = this.getCurrentUser() || {};
    user.jobTitle = jobTitle;
    this.setCurrentUser(user);
  }

  saveInterestedRoles(roles: string): void {
    const user = this.getCurrentUser() || {};
    user.interestedRoles = roles;
    this.setCurrentUser(user);
  }

  saveResume(file: File): void {
    // In a real app, you'd upload the file to the server.
    // For now, we simply update the user's resume property with the file name.
    const user = this.getCurrentUser() || {};
    user.resume = file.name;
    this.setCurrentUser(user);
  }

  // --- Profile Image and Logout ---
  getProfileImage(): string {
    // Return a default profile image; in a real app, this might be user-specific.
    return 'assets/default-profile.png';
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }
}

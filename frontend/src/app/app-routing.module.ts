import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { SignupComponent } from './pages/signup/signup.component';
import { LoginComponent } from './pages/login/login.component';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InterviewSetupComponent } from './pages/interview-setup/interview-setup.component';
import { InterviewComponent } from './pages/interview/interview.component';
import { InterviewFeedbackComponent } from './pages/interview-feedback/interview-feedback.component';
import { ProfileSettingsComponent } from './pages/profile-settings/profile-settings.component';
import { HomeComponent } from './pages/home/home.component';
import { AuthGuard } from './guards/auth.guard';
import { CodingInterviewComponent } from './pages/coding-interview/coding-interview.component';
import { CodingInterviewV2Component } from './pages/coding-interview-v2/coding-interview-v2.component';

const routes: Routes = [
  { path: '', component: LandingComponent}, // Home page
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'signup', component: SignupComponent}, // Sign-Up
  { path: 'login', component: LoginComponent}, // Login
  { path: 'dashboard', component: DashboardComponent}, // Dashboard,
  { path: 'start-interview', component: InterviewSetupComponent}, // New Interview
  { path: 'interview', component: InterviewComponent}, // Interview
  { path: 'interview-feedback', component: InterviewFeedbackComponent}, // Interview Feedback
  { path: 'interview-setup', component: InterviewSetupComponent}, // Interview
  { path: 'coding-interview', component: CodingInterviewComponent}, // Coding Interview
  { path: 'coding-interview-v2', component: CodingInterviewV2Component}, // Coding Interview V2
  { path: 'settings', component: ProfileSettingsComponent},
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [
    // BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

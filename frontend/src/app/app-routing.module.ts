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
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { animation } from '@angular/animations';

const routes: Routes = [
  { path: '', component: LandingComponent, data: { animation: 'LandingPage'} }, // Home page
  { path: 'signup', component: SignupComponent, data: { animation: 'SignupPage'} }, // Sign-Up
  { path: 'login', component: LoginComponent, data: { animation: 'LoginPage'} }, // Login
  { path: 'dashboard', component: DashboardComponent, data: { animation: 'DashboardPage'} }, // Dashboard,
  { path: 'start-interview', component: InterviewSetupComponent, data: { animation: 'StartInterviewPage'} }, // New Interview
  { path: 'interview', component: InterviewComponent, data: { animation: 'InterviewPage'} }, // Interview
  { path: 'interview-feedback', component: InterviewFeedbackComponent, data: { animation: 'InterviewFeedbackPage'} }, // Interview
  { path: 'interview-setup', component: InterviewSetupComponent, data: { animation: 'InterviewSetupPage'} }, // Interview
  { path: 'settings', component: ProfileSettingsComponent, data: { animation: 'ProfileSettingsPage'} },
  { path: 'home', component: HomeComponent, data: { animation: 'HomePage'} },
];

@NgModule({
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

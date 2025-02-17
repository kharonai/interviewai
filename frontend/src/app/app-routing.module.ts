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
  { path: '', component: LandingComponent}, // Home page
  { path: 'signup', component: SignupComponent}, // Sign-Up
  { path: 'login', component: LoginComponent}, // Login
  { path: 'dashboard', component: DashboardComponent}, // Dashboard,
  { path: 'start-interview', component: InterviewSetupComponent}, // New Interview
  { path: 'interview', component: InterviewComponent}, // Interview
  { path: 'interview-feedback', component: InterviewFeedbackComponent}, // Interview
  { path: 'interview-setup', component: InterviewSetupComponent}, // Interview
  { path: 'settings', component: ProfileSettingsComponent},
  { path: 'home', component: HomeComponent},
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

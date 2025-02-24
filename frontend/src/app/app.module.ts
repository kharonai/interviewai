import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { SignupComponent } from './pages/signup/signup.component';
import { LoginComponent } from './pages/login/login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, icons } from 'lucide-angular';
import { LandingComponent } from './pages/landing/landing.component';
import { HeaderComponent } from './components/header/header.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InterviewSetupComponent } from './pages/interview-setup/interview-setup.component';
import { InterviewComponent } from './pages/interview/interview.component';
import { InterviewFeedbackComponent } from './pages/interview-feedback/interview-feedback.component';
import { ProfileSettingsComponent } from './pages/profile-settings/profile-settings.component';
import { HomeComponent } from './pages/home/home.component';
import { CodingInterviewComponent } from './pages/coding-interview/coding-interview.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    SignupComponent,
    LandingComponent,
    LoginComponent,
    HeaderComponent,
    DashboardComponent,
    InterviewSetupComponent,
    InterviewComponent,
    InterviewFeedbackComponent,
    ProfileSettingsComponent,
    HomeComponent,
    CodingInterviewComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    LucideAngularModule.pick(icons),
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

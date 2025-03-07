import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { SignupComponent } from './pages/signup/signup.component';
import { LoginComponent } from './pages/login/login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { ChatComponent } from './components/chat/chat.component';
import { MonacoEditorModule, NgxMonacoEditorConfig } from 'ngx-monaco-editor-v2';
import { CodeEditorComponent } from './components/code-editor/code-editor.component';
import { CodingInterviewV2Component } from './pages/coding-interview-v2/coding-interview-v2.component';
import { CodingPromptComponent } from './components/coding-prompt/coding-prompt.component';
import { UserHomePageComponent } from './pages/user-home-page/user-home-page.component';
import { InterviewV2Component } from './pages/interview-v2/interview-v2.component';

const monacoConfig: NgxMonacoEditorConfig = {
  baseUrl: 'app-name/assets', // configure base path for monaco editor. Starting with version 8.0.0 it defaults to './assets'. Previous releases default to '/assets'
  defaultOptions: { scrollBeyondLastLine: false }, // pass default options to be used
  onMonacoLoad: () => { console.log((<any>window).monaco); } // here monaco object will be available as window.monaco use this function to extend monaco editor functionalities.
};

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
    CodingInterviewComponent,
    ChatComponent,
    CodeEditorComponent,
    CodingInterviewV2Component,
    CodingPromptComponent,
    UserHomePageComponent,
    InterviewV2Component
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    LucideAngularModule.pick(icons),
    BrowserAnimationsModule,
    FormsModule,
    MonacoEditorModule.forRoot(monacoConfig)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

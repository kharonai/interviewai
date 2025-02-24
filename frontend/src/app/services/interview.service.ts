import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface InterviewFeedbackRequest {
  transcript: string | any[]; // Allow array or string
  userId: string;
  force: boolean;
}
@Injectable({
  providedIn: 'root'
})
export class InterviewService {
  constructor(private http: HttpClient) {}

  getNextMessage(conversation: Message[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('http://localhost:3000/api/interview', { conversation });
  }

  getFeedback(transcript: string): Observable<any> {
    return this.http.post<any>('http://localhost:3000/api/interview-feedback', { transcript });
  }
  
  getInterviewFeedback(data: InterviewFeedbackRequest): Observable<any> {
    return this.http.post<any>('http://localhost:3000/api/interview-feedback', data);
  }

  getCompiledCode(code: string, language: string): Observable<any> {
    return this.http.post<any>('http://localhost:3000/api/compile', { code, language });
  }
  
}

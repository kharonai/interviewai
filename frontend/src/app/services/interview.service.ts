import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class InterviewService {
  constructor(private http: HttpClient) {}

  getNextMessage(conversation: Message[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('http://localhost:3000/api/interview', { conversation });
  }
}

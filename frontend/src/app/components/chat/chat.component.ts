import { Component } from '@angular/core';

interface ChatMessage {
  sender: 'user' | 'bot';
  content: string;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent {
  messages: ChatMessage[] = [
    { sender: 'user', content: 'JavaScript' },
    { sender: 'bot', content: 'Type Python or JavaScript to see the code.' }
  ];

  newMessage: string = '';

  // Simulate sending a user message
  sendMessage(): void {
    const trimmedMsg = this.newMessage.trim();
    if (!trimmedMsg) return;

    // Add user message
    this.messages.push({
      sender: 'user',
      content: trimmedMsg
    });

    // Clear the input
    this.newMessage = '';

    // Simulate a bot response after a short delay
    setTimeout(() => {
      this.messages.push({
        sender: 'bot',
        content: 'This is a simulated bot response.'
      });
    }, 800);
  }

  // Clear all chat messages
  clearChat(): void {
    this.messages = [];
  }

  // (Optional) "Retry" logic
  retry(): void {
    // Add your retry logic here
    console.log('Retry clicked');
  }

  // (Optional) "Undo" logic
  undo(): void {
    // Add your undo logic here
    console.log('Undo clicked');
  }
}
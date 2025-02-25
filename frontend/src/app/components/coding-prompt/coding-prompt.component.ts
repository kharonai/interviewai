import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-coding-prompt',
  templateUrl: './coding-prompt.component.html',
  styleUrls: ['./coding-prompt.component.css']
})
export class CodingPromptComponent {
  // Input properties so the parent can supply content dynamically
  @Input() description: string = 'Write a function that reverses a string.';
  @Input() example: string = 'For input "hello", the output should be "olleh".';
  @Input() functionDescription: { params: string; returns: string } = {
    params: 'A string to be reversed.',
    returns: 'A new string that is the reverse of the input.'
  };
  @Input() sampleInput: string = '"hello"';
  @Input() sampleOutput: string = '"olleh"';
}

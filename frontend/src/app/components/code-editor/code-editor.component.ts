import { Component, AfterViewInit, ElementRef, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';

declare const monaco: any;

@Component({
  selector: 'app-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.css']
})
export class CodeEditorComponent implements AfterViewInit, OnChanges {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
  @Input() code: string = "class ProblemSolver {\n  constructor() {\n  }\n\n  /**\n   * Solve the given problem.\n   * @param {*} input - The input for the problem.\n   * @returns {*} - The output for the problem.\n   */\n  solve(input) {\n    // TODO: Implement your solution here.\n    // For example, if the problem is to echo the input:\n    return input;\n  }\n}\n\nfunction main() {\n  // Sample input; replace with actual input source if needed.\n  const sampleInput = \"Example input for the problem\";\n\n  // Instantiate the ProblemSolver class.\n  const solver = new ProblemSolver();\n\n  // Call the solve() method with the input.\n  const result = solver.solve(sampleInput);\n\n  // Output the result.\n  console.log(\"Result:\", result);\n}\n\nmain();\n";
  editor: any;
  language: string = 'javascript';

  ngAfterViewInit(): void {
    (window as any).require = { paths: { 'vs': 'assets/monaco/min/vs' } };

    const loaderScript = document.createElement('script');
    loaderScript.src = 'assets/monaco/min/vs/loader.js';
    loaderScript.onload = () => {
      (window as any).require(['vs/editor/editor.main'], () => {
        this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
          value: this.code,
          language: this.language,
          theme: 'vs-light',
          automaticLayout: true
        });

        // Listen for user edits
        this.editor.onDidChangeModelContent(() => {
          this.code = this.editor.getValue();
        });
      });
    };
    document.body.appendChild(loaderScript);
  }

  // ✅ Update Monaco when the `code` Input changes (from AI feedback)
  ngOnChanges(changes: SimpleChanges): void {
    if (this.editor && changes['code'] && !changes['code'].firstChange) {
      this.editor.setValue(changes['code'].currentValue);
    }
  }

  // ✅ Allow parent to get current code
  getCurrentCode(): string {
    return this.editor ? this.editor.getValue() : '';
  }
}
import { Component, AfterViewInit, ElementRef, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';

declare const monaco: any;

@Component({
  selector: 'app-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.css']
})
export class CodeEditorComponent implements AfterViewInit, OnChanges {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
  private _code: string = "class ProblemSolver {\n  constructor() {\n  }\n\n  /**\n   * Solve the given problem.\n   * @param {*} input - The input for the problem.\n   * @returns {*} - The output for the problem.\n   */\n  solve(input) {\n    // TODO: Implement your solution here.\n    // For example, if the problem is to echo the input:\n    return input;\n  }\n}\n\nfunction main() {\n  // Sample input; replace with actual input source if needed.\n  const sampleInput = \"Example input for the problem\";\n\n  // Instantiate the ProblemSolver class.\n  const solver = new ProblemSolver();\n\n  // Call the solve() method with the input.\n  const result = solver.solve(sampleInput);\n\n  // Output the result.\n  console.log(\"Result:\", result);\n}\n\nmain();\n";
  editor: any;
  language: string = 'javascript';

  @Input()
  get code(): string {
    return this._code;
  }

  set code(value: string) {
    if (value === this._code) return; // Prevent redundant updates
    this._code = value;
    if (this.editor && this.editor.getValue() !== value) {
      this.editor.setValue(value);
    }
  }
  

  ngAfterViewInit(): void {
    (window as any).require = { paths: { vs: 'assets/monaco/min/vs' } };
  
    const loaderScript = document.createElement('script');
    loaderScript.src = 'assets/monaco/min/vs/loader.js';
    loaderScript.onload = () => {
      (window as any).require(['vs/editor/editor.main'], () => {
        // 1) Define your custom theme
        monaco.editor.defineTheme('myCustomTheme', {
          base: 'vs',        // 'vs' = light base, 'vs-dark' = dark base
          inherit: false,    // if true, tokens will be merged with the base theme
          rules: [
            // Syntax highlighting for tokens:
            { token: 'comment',  foreground: '137c36', fontStyle: 'italic' },
            { token: 'keyword',  foreground: '0000ff', fontStyle: 'bold' },   // Orange
            { token: 'string',   foreground: '007ACC' },                     // Blue
            { token: 'number',   foreground: '007ACC' },                     // Blue
            { token: 'function', foreground: '1A1A1A', fontStyle: 'bold' },  // Dark grey/black
            // Add more token overrides if desired
          ],
          colors: {
            // Editor background & foreground
            'editor.background': '#FFFFFF',
            'editor.foreground': '#333333',
  
            // Highlight the current line
            'editor.lineHighlightBackground': '#F3F3F3',
  
            // Selection colors
            'editor.selectionBackground': '#CCE3FF',
            'editor.inactiveSelectionBackground': '#E5EBF1',
  
            // Line numbers
            'editorLineNumber.foreground': '#888888',
  
            // Cursor color
            'editorCursor.foreground': '#000000',
          }
        });
  
        // 2) Create the editor with the custom theme & font settings
        this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
          value: this.code,
          language: this.language,
          automaticLayout: true,
          theme: 'myCustomTheme',
  
          // Font settings (pick a modern font you like, e.g. JetBrains Mono or Fira Code)
          // "JetBrains Mono, Fira Code, Consolas, 'Courier New', monospace"
          fontFamily: "SF Mono,Monaco,Menlo,Consolas,Ubuntu Mono,Liberation Mono,DejaVu Sans Mono,Courier New,monospace",
          fontSize: 15,
          // If you want ligatures (Fira Code, JetBrains Mono), set:
          fontLigatures: true,
          letterSpacing: 1.5
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

  runCode(): void {
    // Placeholder for your code execution logic.
    console.log("Running code:", this.getCurrentCode());
  }

  // Update language when the dropdown selection changes
  onLanguageChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newLanguage = selectElement.value;
    this.language = newLanguage;
    if (this.editor) {
      const model = this.editor.getModel();
      monaco.editor.setModelLanguage(model, newLanguage);
    }
  }
}
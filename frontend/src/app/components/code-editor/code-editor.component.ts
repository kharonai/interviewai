import { Component, AfterViewInit, ElementRef, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';

declare const monaco: any;

@Component({
  selector: 'app-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.css']
})
export class CodeEditorComponent implements AfterViewInit, OnChanges {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
  @Input() code: string = ''; // Accept initial code
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

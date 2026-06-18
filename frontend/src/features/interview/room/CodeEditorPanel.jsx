import React, { lazy, Suspense, useCallback, useState } from 'react';

import { EDITOR_FONT_SIZES, EDITOR_LANGUAGES } from '../../../constants/editor.js';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

export function CodeEditorPanel({ isDsaInterview, code, onCodeChange }) {
  const [language, setLanguage] = useState(isDsaInterview ? 'javascript' : 'notes');
  const [fontSize, setFontSize] = useState(16);
  const [editorStatus, setEditorStatus] = useState('');

  const showTemporaryStatus = useCallback((status) => {
    setEditorStatus(status);
    window.setTimeout(() => setEditorStatus(''), 1600);
  }, []);

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      showTemporaryStatus('Copied');
    } catch {
      showTemporaryStatus('Copy failed');
    }
  }, [code, showTemporaryStatus]);

  const handleEditorMount = useCallback((editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
      try {
        await navigator.clipboard.writeText(editor.getValue());
        showTemporaryStatus('Copied');
      } catch {
        showTemporaryStatus('Copy failed');
      }
    });
  }, [showTemporaryStatus]);

  return (
    <section className={`code-panel${isDsaInterview ? ' dsa-code-panel' : ''}`}>
      <div className="code-toolbar">
        <div className="editor-settings">
          <select
            aria-label="Language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          >
            {!isDsaInterview && <option value="notes">Notepad</option>}
            {isDsaInterview && EDITOR_LANGUAGES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>

          {isDsaInterview && (
            <label className="font-size-control">
              <span>Font</span>
              <select
                aria-label="Editor font size"
                value={fontSize}
                onChange={(event) => setFontSize(Number(event.target.value))}
              >
                {EDITOR_FONT_SIZES.map((size) => (
                  <option key={size} value={size}>{size}px</option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="code-actions">
          {isDsaInterview && (
            <span
              className="shortcut-hint"
              title="Find: Ctrl+F · Replace: Ctrl+H · Command palette: F1 · Comment: Ctrl+/ · Format: Shift+Alt+F · Copy/save: Ctrl+S"
            >
              {editorStatus || 'Shortcuts: F1'}
            </span>
          )}
          <button type="button" className="run-button">Run</button>
          <button type="button" className="submit-button" onClick={copyCode}>Send notes</button>
        </div>
      </div>

      {isDsaInterview ? (
        <div className="monaco-editor-shell">
          <Suspense fallback={<div className="editor-loading">Loading code editor...</div>}>
            <MonacoEditor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => onCodeChange(value ?? '')}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                automaticLayout: true,
                bracketPairColorization: { enabled: true },
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                fontFamily: '"Cascadia Code", Consolas, "Courier New", monospace',
                fontLigatures: true,
                fontSize,
                formatOnPaste: true,
                formatOnType: true,
                lineNumbersMinChars: 3,
                minimap: { enabled: false },
                padding: { top: 18 },
                quickSuggestions: true,
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                tabSize: 2,
                wordWrap: language === 'plaintext' ? 'on' : 'off',
              }}
            />
          </Suspense>
        </div>
      ) : (
        <textarea
          aria-label="Coding notepad"
          spellCheck="false"
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
        />
      )}
    </section>
  );
}

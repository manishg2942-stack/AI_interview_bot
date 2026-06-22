import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { EDITOR_FONT_SIZES, EDITOR_LANGUAGES, STARTER_TEMPLATES } from '../../../constants/editor.js';
import '../../../styles/codeEditor.css';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

// LocalStorage keys
const LS_KEYS = {
  CODE: 'codingace-editor-code',
  LANGUAGE: 'codingace-editor-language',
  THEME: 'codingace-editor-theme',
  FONT_SIZE: 'codingace-editor-font-size',
};

export function CodeEditorPanel({ isDsaInterview, code, onCodeChange, showTranscript, onToggleTranscript }) {
  const containerRef = useRef(null);
  const [language, setLanguage] = useState(() => (isDsaInterview ? 'javascript' : 'plaintext'));
  const [fontSize, setFontSize] = useState(() => 16);
  const [theme, setTheme] = useState(() => 'vs-dark');
  const [status, setStatus] = useState('');
  const [output, setOutput] = useState('Run your code to see output...');
  const statusTimerRef = useRef(null);
  const runTimerRef = useRef(null);

  // Restore persisted preferences and code on mount when parent hasn't provided code
  useEffect(() => {
    try {
      const lsLang = localStorage.getItem(LS_KEYS.LANGUAGE);
      const lsTheme = localStorage.getItem(LS_KEYS.THEME);
      const lsFont = localStorage.getItem(LS_KEYS.FONT_SIZE);
      const lsCode = localStorage.getItem(LS_KEYS.CODE);

      if (lsLang) setLanguage(lsLang);
      if (lsTheme) setTheme(lsTheme);
      if (lsFont) setFontSize(Number(lsFont));

      // If parent hasn't supplied code, hydrate from localStorage or starter template
      if (!code) {
        if (lsCode) {
          onCodeChange(lsCode);
          showTemporaryStatus('Restored');
        } else if (lsLang || isDsaInterview) {
          const tmpl = STARTER_TEMPLATES[(lsLang || language)];
          if (tmpl) {
            onCodeChange(tmpl);
            showTemporaryStatus('Template loaded');
          }
        }
      }
    } catch (e) {
      // ignore localStorage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist preferences when they change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.LANGUAGE, language);
      localStorage.setItem(LS_KEYS.THEME, theme);
      localStorage.setItem(LS_KEYS.FONT_SIZE, String(fontSize));
    } catch (e) {
      // ignore
    }
  }, [language, theme, fontSize]);

  // Status helper
  const showTemporaryStatus = useCallback((text) => {
    setStatus(text);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = window.setTimeout(() => setStatus(''), 1800);
  }, []);

  // Save code to localStorage
  const saveToLocal = useCallback((payload) => {
    try {
      localStorage.setItem(LS_KEYS.CODE, payload ?? code ?? '');
      showTemporaryStatus('Saved');
    } catch (e) {
      showTemporaryStatus('Save failed');
    }
  }, [code, showTemporaryStatus]);

  // Copy code to clipboard
  const copyCode = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text ?? code ?? '');
      showTemporaryStatus('Copied');
    } catch (e) {
      showTemporaryStatus('Copy failed');
    }
  }, [code, showTemporaryStatus]);

  // Reset editor (clears localStorage and notifies parent)
  const resetEditor = useCallback(() => {
    try {
      localStorage.removeItem(LS_KEYS.CODE);
    } catch (e) {}
    onCodeChange('');
    showTemporaryStatus('Reset');
    setOutput('Run your code to see output...');
  }, [onCodeChange, showTemporaryStatus]);

  // Fake run handler
  const handleRun = useCallback(() => {
    setOutput('Running...');
    showTemporaryStatus('Running');
    if (runTimerRef.current) clearTimeout(runTimerRef.current);
    runTimerRef.current = window.setTimeout(() => {
      setOutput('Sample testcase passed ✅');
      showTemporaryStatus('Run completed');
    }, 1000);
  }, [showTemporaryStatus]);

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    function onChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // Keyboard shortcuts for textarea mode
  useEffect(() => {
    function onKey(e) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key === 's') {
        e.preventDefault();
        saveToLocal(code);
      }
      if (mod && e.key === 'Enter' && e.shiftKey === false && e.ctrlKey) {
        // redundant; handled in monaco
      }
      if (mod && e.key.toLowerCase() === 'c' && e.shiftKey) {
        e.preventDefault();
        copyCode();
      }
      if (mod && e.key === 'Enter' && !e.shiftKey) {
        // Ctrl+Enter emulate run
        e.preventDefault();
        handleRun();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [code, copyCode, handleRun, saveToLocal]);

  // Monaco options memoized
  const monacoOptions = useMemo(() => ({
    automaticLayout: true,
    bracketPairColorization: { enabled: true },
    smoothScrolling: true,
    fontLigatures: true,
    formatOnPaste: true,
    formatOnType: true,
    minimap: { enabled: false },
    folding: true,
    inlineSuggest: { enabled: true },
    stickyScroll: { enabled: true },
    lineNumbers: 'on',
    scrollbar: { verticalScrollbarSize: 12, horizontalScrollbarSize: 12 },
    tabSize: 2,
  }), []);

  // Monaco mount handler: add shortcuts
  const handleEditorMount = useCallback((editor, monaco) => {
    // Ctrl/Cmd+S => save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      try {
        const v = editor.getValue() ?? '';
        localStorage.setItem(LS_KEYS.CODE, v);
        showTemporaryStatus('Saved');
      } catch (e) {
        showTemporaryStatus('Save failed');
      }
    });

    // Ctrl/Cmd+Shift+C => copy
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC, () => {
      try {
        navigator.clipboard.writeText(editor.getValue() ?? '');
        showTemporaryStatus('Copied');
      } catch (e) {
        showTemporaryStatus('Copy failed');
      }
    });

    // Ctrl/Cmd+Enter => run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun();
    });
  }, [handleRun, showTemporaryStatus]);

  // Clean timers on unmount
  useEffect(() => () => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    if (runTimerRef.current) clearTimeout(runTimerRef.current);
  }, []);

  // const onLanguageChange = useCallback((next) => {
  //   console.log('Language changed to', next);
  //   setLanguage(next);
  //   // If code empty, inject starter template
  //   if (!code) {
  //     const tmpl = STARTER_TEMPLATES[next];
  //     if (tmpl) onCodeChange(tmpl);
  //   }
  // }, [code, onCodeChange]);

  const onLanguageChange = useCallback((next) => {
    setLanguage(next);

    const tmpl = STARTER_TEMPLATES[next];

    if (tmpl) {
      onCodeChange(tmpl);
    }
  }, [onCodeChange]);

  return (
    <section className={`code-editor-panel${isDsaInterview ? ' dsa' : ''}`} ref={containerRef}>
      <div className="editor-toolbar" role="toolbar" aria-label="Editor toolbar">
        <div className="toolbar-left">
          <label className="visually-hidden" htmlFor="language-select">Language</label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            aria-label="Select language"
          >
            {EDITOR_LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>

          <label className="visually-hidden" htmlFor="font-select">Font size</label>
          <select id="font-select" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} aria-label="Select editor font size">
            {EDITOR_FONT_SIZES.map((s) => <option key={s} value={s}>{s}px</option>)}
          </select>

          <button type="button" className="btn" onClick={() => setTheme((t) => (t === 'vs-dark' ? 'light' : 'vs-dark'))} aria-pressed={theme === 'vs-dark'}>
            {theme === 'vs-dark' ? 'Dark' : 'Light'}
          </button>
        </div>

        <div className="toolbar-right">
          <button type="button" className="btn" onClick={resetEditor}>Reset</button>
          <button type="button" className="btn" onClick={onToggleTranscript} title="Toggle transcript">📝 {showTranscript ? 'Hide' : 'Show'}</button>
          <button type="button" className="btn primary" onClick={handleRun}>Run</button>
          <button type="button" className="btn" onClick={toggleFullscreen}>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</button>
        </div>
      </div>

      <div className="editor-body">
        {isDsaInterview ? (
          <div className="monaco-shell">
            <Suspense fallback={<div className="editor-loading">Loading code editor...</div>}>
              <MonacoEditor
                height="360px"
                language={language}
                value={code}
                onChange={(v) => onCodeChange(v ?? '')}
                onMount={handleEditorMount}
                theme={theme}
                options={{
                  ...monacoOptions,
                  fontSize,
                }}
              />
            </Suspense>
          </div>
        ) : (
          <textarea
            aria-label="Notepad"
            className="simple-notepad"
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            style={{ fontSize }}
          />
        )}
      </div>

      <div className="editor-statusbar" aria-hidden>
        <span>{(EDITOR_LANGUAGES.find((l) => l.value === language)?.label) || 'Plaintext'}</span>
        <span>{theme === 'vs-dark' ? 'Dark' : 'Light'}</span>
        <span>{fontSize}px</span>
        <span className="status-message">{status}</span>
      </div>
    </section>
  );
}

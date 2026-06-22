export const INTERVIEW_DURATION_SECONDS = 5 * 60;
export const TRANSCRIPT_TOPIC = 'aisha.transcript';

export const EDITOR_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'csharp', label: 'C#' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'scala', label: 'Scala' },
  { value: 'dart', label: 'Dart' },
  { value: 'r', label: 'R' },
  { value: 'shell', label: 'Shell' },
  { value: 'sql', label: 'SQL' },
  { value: 'plaintext', label: 'Plain text' },
];

export const EDITOR_FONT_SIZES = [12, 14, 16, 18, 20, 22, 24];

export const STARTER_TEMPLATES = {
  javascript: `function solve() {\n\n}\n`,
  typescript: `function solve(): void {\n\n}\n`,
  python: `def solve():\n    pass\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n\n    }\n}\n`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n\n    return 0;\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n\n    return 0;\n}\n`,
  go: `package main\n\nfunc main() {\n\n}\n`,
  csharp: `using System;\n\nclass Program {\n    static void Main() {\n\n    }\n}\n`,
  kotlin: `fun main() {\n\n}\n`,
  rust: `fn main() {\n\n}\n`,
  swift: `import Foundation\n\nprint("Hello")\n`,
  ruby: `def solve\n  # your code\nend\n`,
  php: `<?php\n// your code\n?>\n`,
  scala: `object Main extends App {\n\n}\n`,
  dart: `void main() {\n\n}\n`,
  r: `# R script\n`,
  shell: `#!/bin/sh\n\n# your commands\n`,
  sql: `-- SQL query\n`,
  plaintext: `// Take notes here\n`
};

export function buildStarterCode(question, interview) {
  if (interview.designQuestion && (interview.type === 'lld' || interview.type === 'hld')) {
    return [
      `// ${interview.designQuestion}`,
      '// Use this space for requirements, APIs, data model, components, and tradeoffs.',
      '',
    ].join('\n');
  }

  if (!question) {
    return '// Write your notes or code here.\n';
  }

  return [
    `// ${question.title}`,
    '// Talk through your approach with Aisha, then write your solution here.',
    '',
    'function solve() {',
    '  ',
    '}',
    '',
  ].join('\n');
}

export function getQuestionContent(interview, question) {
  if (question) {
    return { title: question.title, statement: question.question };
  }

  const isDesignInterview = interview.type === 'lld' || interview.type === 'hld';
  if (isDesignInterview && interview.designQuestion) {
    return {
      title: interview.designQuestion,
      statement: `Design problem selected for this session: ${interview.designQuestion}. Aisha will use this exact problem for the interview.`,
    };
  }

  if (interview.type === 'behavioral') {
    return {
      title: 'Behavioral interview',
      statement: 'Behavioral interview session. Aisha will use your selected company, level, and resume context if provided.',
    };
  }

  return {
    title: 'Live interview',
    statement: 'Aisha is ready. Use the notepad for rough work during the interview.',
  };
}

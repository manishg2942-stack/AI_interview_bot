import { useEffect, useState } from 'react';

import { listDsaQuestions } from '../../../services/interviewService.js';

export function useDsaQuestionPreview({ enabled, accessToken, setup }) {
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [questionStatus, setQuestionStatus] = useState('idle');

  useEffect(() => {
    if (!enabled || setup.type !== 'dsa') {
      setQuestionStatus('idle');
      setPreviewQuestion(null);
      return undefined;
    }

    const controller = new AbortController();
    setQuestionStatus('checking');

    listDsaQuestions({
      accessToken,
      company: setup.company,
      difficulty: setup.difficulty,
      level: setup.level,
      limit: 1,
      signal: controller.signal,
    })
      .then((questions) => {
        if (!controller.signal.aborted) {
          setPreviewQuestion(questions[0] || null);
          setQuestionStatus(questions.length ? 'ready' : 'empty');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPreviewQuestion(null);
          setQuestionStatus('unknown');
        }
      });

    return () => controller.abort();
  }, [
    accessToken,
    enabled,
    setup.company,
    setup.difficulty,
    setup.level,
    setup.type,
  ]);

  return { previewQuestion, questionStatus };
}

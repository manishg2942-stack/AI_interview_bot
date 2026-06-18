import { useDataChannel } from '@livekit/components-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { TRANSCRIPT_TOPIC } from '../../../constants/editor.js';

export function useTranscript() {
  const [messages, setMessages] = useState([]);
  const [liveUserTranscript, setLiveUserTranscript] = useState('');
  const transcriptEndRef = useRef(null);
  const typewriterTimersRef = useRef(new Set());

  const addAssistantMessage = useCallback((text) => {
    const id = `${Date.now()}-${Math.random()}`;
    const chunkSize = 4;
    let cursor = 0;

    setMessages((current) => [...current, { id, role: 'assistant', text: '' }]);

    const timer = window.setInterval(() => {
      cursor += chunkSize;
      setMessages((current) => current.map((message) => (
        message.id === id ? { ...message, text: text.slice(0, cursor) } : message
      )));

      if (cursor >= text.length) {
        window.clearInterval(timer);
        typewriterTimersRef.current.delete(timer);
      }
    }, 24);

    typewriterTimersRef.current.add(timer);
  }, []);

  const handleMessage = useCallback((message) => {
    try {
      const rawText = new TextDecoder().decode(message.payload);
      const payload = JSON.parse(rawText);

      if (payload.type !== 'transcript' || !payload.text) {
        return;
      }

      if (payload.role === 'user') {
        if (!payload.is_final) {
          setLiveUserTranscript(payload.text);
          return;
        }

        setLiveUserTranscript('');
        setMessages((current) => [
          ...current,
          {
            id: `${payload.ts || Date.now()}-user`,
            role: 'user',
            text: payload.text,
          },
        ]);
        return;
      }

      if (payload.role === 'assistant' && payload.is_final) {
        addAssistantMessage(payload.text);
      }
    } catch {
      // Ignore non-transcript LiveKit data messages.
    }
  }, [addAssistantMessage]);

  useDataChannel(TRANSCRIPT_TOPIC, handleMessage);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, liveUserTranscript]);

  useEffect(() => () => {
    typewriterTimersRef.current.forEach((timer) => window.clearInterval(timer));
    typewriterTimersRef.current.clear();
  }, []);

  return { messages, liveUserTranscript, transcriptEndRef };
}

import { useEffect, useState } from 'react';

export function useInterviewTimer(durationSeconds) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setElapsedSeconds(Math.min(elapsed, durationSeconds));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [durationSeconds]);

  return elapsedSeconds;
}

export function formatDuration(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

import React, { useMemo, useState } from 'react';
import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';

const tokenEndpoint = import.meta.env.VITE_TOKEN_ENDPOINT || 'http://localhost:8000/api/livekit/token';

function MeetingRoom() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.Microphone, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <main className="room-shell">
      <section className="stage" aria-label="LiveKit meeting room">
        <GridLayout tracks={tracks}>
          <ParticipantTile />
        </GridLayout>
      </section>
      <RoomAudioRenderer />
      <div className="controls">
        <ControlBar variation="minimal" />
      </div>
    </main>
  );
}

export default function App() {
  const [form, setForm] = useState({
    name: '',
    room: 'demo-room',
  });
  const [joinData, setJoinData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canJoin = useMemo(
    () => form.name.trim() && form.room.trim(),
    [form.name, form.room],
  );

  async function joinMeeting(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity: form.name.trim().toLowerCase().replace(/\s+/g, '-'),
          name: form.name.trim(),
          room: form.room.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Could not create LiveKit token');
      }

      const data = await response.json();
      setJoinData(data);
    } catch (err) {
      setError(err.message || 'Unable to join right now');
    } finally {
      setLoading(false);
    }
  }

  if (joinData) {
    return (
      <LiveKitRoom
        token={joinData.token}
        serverUrl={joinData.url}
        connect
        video
        audio
        data-lk-theme="default"
      >
        <MeetingRoom />
      </LiveKitRoom>
    );
  }

  return (
    <main className="join-shell">
      <section className="join-visual" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80"
          alt=""
        />
      </section>

      <form className="join-form" onSubmit={joinMeeting}>
        <h1>Join Meeting</h1>
        <label>
          Name
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Your name"
          />
        </label>
        <label>
          Room
          <input
            value={form.room}
            onChange={(event) => setForm({ ...form, room: event.target.value })}
            placeholder="demo-room"
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={!canJoin || loading}>
          {loading ? 'Joining...' : 'Join room'}
        </button>
      </form>
    </main>
  );
}

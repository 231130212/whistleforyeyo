import { useEffect, useState } from 'react';
import { api } from '../api.js';
import SongCard from './SongCard.jsx';

export default function SongPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [state, setState] = useState({ status: 'idle', songs: [], error: '' });

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setState({ status: 'idle', songs: [], error: '' });
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState((s) => ({ ...s, status: 'loading', error: '' }));
      try {
        const { songs } = await api.searchSongs(q, controller.signal);
        setState({ status: 'done', songs, error: '' });
      } catch (err) {
        if (err.name !== 'AbortError') setState({ status: 'error', songs: [], error: err.message });
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  if (value) {
    return (
      <SongCard
        song={value}
        action={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(null)}>
            Ganti
          </button>
        }
      />
    );
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-dashed" onClick={() => setOpen(true)}>
        ♪ Selipkan lagu <span className="muted">(opsional)</span>
      </button>
    );
  }

  return (
    <div className="picker">
      <div className="picker-bar">
        <input
          type="search"
          autoFocus
          placeholder="Cari judul lagu atau penyanyi…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Cari lagu"
        />
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setOpen(false);
            setQuery('');
          }}
        >
          Batal
        </button>
      </div>

      <div className="picker-results" aria-live="polite">
        {state.status === 'loading' && <p className="muted small">Mencari…</p>}
        {state.status === 'error' && <p className="error small">{state.error}</p>}
        {state.status === 'done' && state.songs.length === 0 && (
          <p className="muted small">Tidak ketemu. Coba kata kunci lain.</p>
        )}
        {state.songs.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            action={
              <button type="button" className="btn btn-sm" onClick={() => onChange(song)}>
                Pilih
              </button>
            }
          />
        ))}
      </div>
    </div>
  );
}

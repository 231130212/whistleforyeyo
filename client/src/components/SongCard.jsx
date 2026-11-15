import { useEffect, useRef, useState } from 'react';

// Hanya satu preview yang boleh berbunyi dalam satu waktu.
let nowPlaying = null;

export default function SongCard({ song, action }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => audioRef.current?.pause(), []);

  function toggle() {
    if (!audioRef.current) {
      const audio = new Audio(song.previewUrl);
      audio.onplay = () => setPlaying(true);
      audio.onpause = () => setPlaying(false);
      audio.onended = () => setPlaying(false);
      audioRef.current = audio;
    }
    const audio = audioRef.current;
    if (audio.paused) {
      if (nowPlaying && nowPlaying !== audio) nowPlaying.pause();
      nowPlaying = audio;
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }

  return (
    <div className="song">
      <div className="song-art">
        {song.artwork ? <img src={song.artwork} alt="" loading="lazy" /> : <span aria-hidden>♪</span>}
        {song.previewUrl && (
          <button
            type="button"
            className={`song-play ${playing ? 'is-playing' : ''}`}
            onClick={toggle}
            aria-label={playing ? `Jeda ${song.title}` : `Putar cuplikan ${song.title}`}
          >
            {playing ? '❚❚' : '▶'}
          </button>
        )}
      </div>
      <div className="song-meta">
        <strong title={song.title}>{song.title}</strong>
        <span title={song.artist}>{song.artist}</span>
      </div>
      {action ??
        (song.url && (
          <a className="song-link" href={song.url} target="_blank" rel="noreferrer noopener">
            Dengar
          </a>
        ))}
    </div>
  );
}

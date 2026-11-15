import { useState } from 'react';
import { api } from '../api.js';
import { LIMITS, OWNER_NAME } from '../config.js';
import SongPicker from './SongPicker.jsx';

const EMPTY = { name: '', body: '', song: null, website: '' };

export default function WhisperForm() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const [error, setError] = useState('');

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const remaining = LIMITS.body - form.body.length;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.body.trim()) {
      setError('Tulis dulu bisikanmu ya.');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      await api.sendWhisper({
        name: form.name.trim() || null,
        body: form.body,
        songId: form.song?.id ?? null,
        website: form.website,
      });
      setStatus('sent');
      setForm(EMPTY);
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  }

  if (status === 'sent') {
    return (
      <div className="card sent" role="status">
        <div className="sent-ear" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <h2>Bisikanmu sudah sampai.</h2>
        <p className="muted">
          {OWNER_NAME} akan membacanya. Kalau dibalas, bisikanmu bisa muncul di papan di bawah.
        </p>
        <button type="button" className="btn" onClick={() => setStatus('idle')}>
          Bisikkan lagi
        </button>
      </div>
    );
  }

  return (
    <form className="card whisper-form" onSubmit={handleSubmit} noValidate>
      <label className="field">
        <span className="label">Bisikanmu</span>
        <textarea
          rows={5}
          maxLength={LIMITS.body}
          placeholder={`Psst… ${OWNER_NAME}, sebenarnya aku…`}
          value={form.body}
          onChange={(e) => set('body')(e.target.value)}
          required
        />
        <span className={`counter ${remaining < 50 ? 'is-low' : ''}`}>{remaining}</span>
      </label>

      <label className="field">
        <span className="label">
          Nama <span className="muted">(boleh dikosongkan)</span>
        </span>
        <input
          type="text"
          maxLength={LIMITS.name}
          placeholder="Anonim"
          value={form.name}
          onChange={(e) => set('name')(e.target.value)}
          autoComplete="off"
        />
      </label>

      {/* Honeypot anti-bot: manusia tidak melihat field ini */}
      <input
        className="hp"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={form.website}
        onChange={(e) => set('website')(e.target.value)}
      />

      <div className="field">
        <span className="label">Lagu</span>
        <SongPicker value={form.song} onChange={set('song')} />
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-primary btn-block" disabled={status === 'sending'}>
        {status === 'sending' ? 'Membisikkan…' : `Bisikkan ke ${OWNER_NAME}`}
      </button>
    </form>
  );
}

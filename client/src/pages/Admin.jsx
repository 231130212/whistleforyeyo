import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../api.js';
import WhisperCard from '../components/WhisperCard.jsx';
import { LIMITS, OWNER_NAME } from '../config.js';

const TABS = [
  { key: 'all', label: 'Semua', stat: 'total' },
  { key: 'unread', label: 'Belum dibaca', stat: 'unread' },
  { key: 'public', label: 'Di papan', stat: 'public' },
];

function ReplyEditor({ initial, onSave, onCancel }) {
  const [text, setText] = useState(initial ?? '');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await onSave(text);
    setBusy(false);
  }

  return (
    <div className="reply-editor">
      <textarea
        rows={3}
        autoFocus
        maxLength={LIMITS.reply}
        placeholder="Tulis balasanmu…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="row">
        <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
          {busy ? 'Menyimpan…' : 'Simpan balasan'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          Batal
        </button>
      </div>
    </div>
  );
}

function ShareLink() {
  const [copied, setCopied] = useState(false);
  const url = window.location.origin;

  async function share() {
    // Di HP: buka menu share bawaan (WhatsApp, IG, dll).
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({
          title: 'whistleforyeyo',
          text: `Psst… bisikkan sesuatu ke ${OWNER_NAME}, tanpa nama 🤫`,
          url,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // pengguna menutup menu share
      }
    }
    // Di laptop: salin ke clipboard.
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Salin link ini:', url);
    }
  }

  return (
    <div className="card share">
      <div className="share-text">
        <strong>Link bisikanmu</strong>
        <code>{url}</code>
      </div>
      <button type="button" className="btn btn-primary btn-sm" onClick={share}>
        {copied ? 'Tersalin ✓' : 'Bagikan link'}
      </button>
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [data, setData] = useState({ status: 'loading', messages: [], stats: null });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { messages, stats } = await api.listMessages(filter);
      setData({ status: 'ready', messages, stats });
    } catch (err) {
      if (err.status === 401) navigate('/admin/login', { replace: true });
      else setData((d) => ({ ...d, status: 'error' }));
    }
  }, [filter, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action) {
    setError('');
    try {
      await action();
      await load();
    } catch (err) {
      if (err.status === 401) navigate('/admin/login', { replace: true });
      else setError(err.message);
    }
  }

  const update = (id, patch) => run(() => api.updateMessage(id, patch));

  const remove = (m) => {
    const preview = m.body.length > 60 ? `${m.body.slice(0, 60)}…` : m.body;
    if (window.confirm(`Hapus bisikan ini untuk selamanya?\n\n“${preview}”`)) {
      run(() => api.deleteMessage(m.id));
    }
  };

  async function logout() {
    await api.logout().catch(() => {});
    navigate('/', { replace: true });
  }

  async function logoutAll() {
    if (!window.confirm('Keluarkan SEMUA perangkat yang sedang login, termasuk yang ini?')) return;
    await api.logoutAll().catch(() => {});
    navigate('/admin/login', { replace: true });
  }

  return (
    <section>
      <div className="admin-head">
        <div>
          <p className="eyebrow">telinga {OWNER_NAME.toLowerCase()}</p>
          <h1>Kotak bisikan</h1>
        </div>
        <div className="row">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={logoutAll}
            title="Pakai ini kalau curiga ada orang lain yang login"
          >
            Keluar dari semua perangkat
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            Keluar
          </button>
        </div>
      </div>

      <ShareLink />

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={filter === t.key}
            className={`tab ${filter === t.key ? 'is-active' : ''}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
            {data.stats && <span className="badge">{data.stats[t.stat]}</span>}
          </button>
        ))}
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {data.status === 'loading' && <p className="muted">Memuat…</p>}
      {data.status === 'error' && <p className="error">Gagal memuat bisikan.</p>}
      {data.status === 'ready' && data.messages.length === 0 && (
        <div className="empty">
          <p>Sepi di sini.</p>
          <p className="muted">Bagikan link-mu supaya orang mulai berbisik.</p>
        </div>
      )}

      <div className="stack">
        {data.messages.map((m) => (
          <WhisperCard key={m.id} message={m} highlight={!m.readAt}>
            {editing === m.id ? (
              <ReplyEditor
                initial={m.reply}
                onCancel={() => setEditing(null)}
                onSave={async (reply) => {
                  await update(m.id, { reply });
                  setEditing(null);
                }}
              />
            ) : (
              <div className="actions">
                {m.isPublic && <span className="pill">Tampil di papan</span>}
                <div className="row">
                  {!m.readAt && (
                    <button className="btn btn-ghost btn-sm" onClick={() => update(m.id, { read: true })}>
                      Tandai dibaca
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(m.id)}>
                    {m.reply ? 'Ubah balasan' : 'Balas'}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => update(m.id, { isPublic: !m.isPublic })}
                  >
                    {m.isPublic ? 'Sembunyikan' : 'Tampilkan di papan'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(m)}>
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </WhisperCard>
        ))}
      </div>
    </section>
  );
}

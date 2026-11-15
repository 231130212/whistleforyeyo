import { useEffect, useState } from 'react';
import { api } from '../api.js';
import WhisperCard from '../components/WhisperCard.jsx';
import WhisperForm from '../components/WhisperForm.jsx';
import { OWNER_NAME } from '../config.js';

export default function Home() {
  const [board, setBoard] = useState({ status: 'loading', messages: [] });

  useEffect(() => {
    api
      .board()
      .then(({ messages }) => setBoard({ status: 'ready', messages }))
      .catch(() => setBoard({ status: 'error', messages: [] }));
  }, []);

  return (
    <>
      <section className="hero">
        <p className="eyebrow">psst…</p>
        <h1>
          Ada rahasia yang mau kamu bisikkan ke <em>{OWNER_NAME}</em>?
        </h1>
        <p className="lede">
          Pengakuan, pertanyaan, kritik, atau sekadar sapaan. Namamu tidak perlu ikut. Kalau mau,
          selipkan satu lagu yang mewakili isi hatimu.
        </p>
      </section>

      <WhisperForm />

      <section className="board" aria-labelledby="board-title">
        <div className="section-head">
          <h2 id="board-title">Bisikan yang sudah dijawab</h2>
          <p className="muted">Dipilih dan dibalas langsung oleh {OWNER_NAME}.</p>
        </div>

        {board.status === 'loading' && <p className="muted">Memuat…</p>}
        {board.status === 'error' && <p className="error">Papan bisikan gagal dimuat.</p>}
        {board.status === 'ready' && board.messages.length === 0 && (
          <div className="empty">
            <p>Belum ada bisikan yang dijawab.</p>
            <p className="muted">Jadilah yang pertama berbisik.</p>
          </div>
        )}

        <div className="stack">
          {board.messages.map((m) => (
            <WhisperCard key={m.id} message={m} />
          ))}
        </div>
      </section>
    </>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../api.js';
import { OWNER_NAME } from '../config.js';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.login(password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <section className="narrow">
      <div className="hero">
        <p className="eyebrow">khusus pemilik telinga</p>
        <h1>Halo, {OWNER_NAME}.</h1>
        <p className="lede">Masukkan password untuk membaca bisikan yang masuk.</p>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <label className="field">
          <span className="label">Password</span>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy || !password}>
          {busy ? 'Memeriksa…' : 'Masuk'}
        </button>
      </form>
    </section>
  );
}

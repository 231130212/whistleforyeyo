import { Link, Outlet, Route, Routes } from 'react-router';
import Backdrop from './components/Backdrop.jsx';
import Admin from './pages/Admin.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import Home from './pages/Home.jsx';

function Layout() {
  return (
    <div className="shell">
      <Backdrop />
      <header className="topbar">
        <Link to="/" className="brand">
          <img src="/favicon-burung.svg" alt="" width="28" height="28" />
          <span>
            whistle<em>for</em>yeyo
          </span>
        </Link>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        <p>Dibuat dengan rasa penasaran. Semua bisikan bersifat anonim.</p>
      </footer>
    </div>
  );
}

function NotFound() {
  return (
    <section className="hero">
      <p className="eyebrow">404</p>
      <h1>Bisikan ini nyasar.</h1>
      <p className="lede">
        Halaman yang kamu cari tidak ada. <Link to="/">Kembali ke beranda</Link>.
      </p>
    </section>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="admin" element={<Admin />} />
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

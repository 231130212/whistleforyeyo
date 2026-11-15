async function request(path, { method = 'GET', body, signal } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error('Tidak bisa terhubung ke server. Cek koneksimu ya.');
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(data?.error || 'Terjadi kesalahan. Coba lagi ya.');
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  sendWhisper: (payload) => request('/messages', { method: 'POST', body: payload }),
  board: () => request('/board'),
  searchSongs: (q, signal) => request(`/songs/search?q=${encodeURIComponent(q)}`, { signal }),

  me: () => request('/auth/me'),
  login: (password) => request('/auth/login', { method: 'POST', body: { password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  logoutAll: () => request('/auth/logout-all', { method: 'POST' }),

  listMessages: (filter) => request(`/admin/messages?filter=${filter}`),
  updateMessage: (id, patch) => request(`/admin/messages/${id}`, { method: 'PATCH', body: patch }),
  deleteMessage: (id) => request(`/admin/messages/${id}`, { method: 'DELETE' }),
};

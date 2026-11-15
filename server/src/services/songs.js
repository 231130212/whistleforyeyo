// Pencarian lagu memakai iTunes Search API (gratis, tanpa API key).
// https://performance-partners.apple.com/search-api

const ITUNES = 'https://itunes.apple.com';
const COUNTRY = 'ID';
const TIMEOUT_MS = 8000;

const httpsOrNull = (value) =>
  typeof value === 'string' && value.startsWith('https://') ? value : null;

function toSong(track) {
  return {
    id: String(track.trackId),
    title: track.trackName,
    artist: track.artistName,
    album: track.collectionName ?? null,
    artwork: httpsOrNull(track.artworkUrl100?.replace('100x100bb', '300x300bb')),
    previewUrl: httpsOrNull(track.previewUrl),
    url: httpsOrNull(track.trackViewUrl),
  };
}

async function itunes(endpoint, params) {
  const url = new URL(endpoint, ITUNES);
  url.search = new URLSearchParams({ country: COUNTRY, ...params });

  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`iTunes API ${res.status}`);

  const data = await res.json();
  return (data.results ?? []).filter((t) => t.kind === 'song' && t.trackId);
}

export async function searchSongs(term) {
  const tracks = await itunes('/search', { term, media: 'music', entity: 'song', limit: '8' });
  return tracks.map(toSong);
}

/**
 * Ambil ulang data lagu dari iTunes berdasarkan ID.
 * Data lagu tidak pernah diambil mentah dari browser pengirim,
 * jadi isi kartu lagu selalu valid dan aman.
 */
export async function getSong(id) {
  const [track] = await itunes('/lookup', { id });
  return track ? toSong(track) : null;
}

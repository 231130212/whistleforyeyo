const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });
const full = new Intl.DateTimeFormat('id', { dateStyle: 'medium', timeStyle: 'short' });

const STEPS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

export function timeAgo(iso) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const [unit, size] of STEPS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'baru saja';
}

export const fullDate = (iso) => full.format(new Date(iso));

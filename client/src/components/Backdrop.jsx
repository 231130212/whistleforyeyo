// Latar retro: gradien senja, matahari bergaris, awan gaya ukiyo-e, dan grid.

function JapaneseCloud() {
  return (
    <svg viewBox="0 0 240 72" xmlns="http://www.w3.org/2000/svg">
      {/* badan awan: dasar rata, puncak bergelombang */}
      <path
        className="cloud-body"
        d="M22 62 C8 62 4 46 16 41 C18 29 34 25 43 33 C47 17 70 13 79 28 C87 10 118 8 127 26
           C135 14 160 14 165 30 C173 22 191 24 193 38 C207 34 223 44 217 56 C215 61 211 62 206 62 Z"
      />
      {/* gulungan spiral di kedua ujung */}
      <path className="cloud-line" d="M33 54 c-9 0 -11 -11 -2 -13 c6 -1 8 6 3 7" />
      <path className="cloud-line" d="M203 54 c9 0 11 -11 2 -13 c-6 -1 -8 6 -3 7" />
      {/* garis lapisan di dalam awan */}
      <path className="cloud-line" d="M58 46 q11 -9 23 -2" />
      <path className="cloud-line" d="M106 42 q13 -11 27 -2" />
      <path className="cloud-line" d="M156 46 q11 -9 21 -1" />
      <path className="cloud-line" d="M70 56 h96" />
    </svg>
  );
}

// top/left dalam %, width dalam vw (dibatasi min/max di CSS), dur = detik satu ayunan.
const CLOUDS = [
  { top: 7, left: 4, width: 30, dur: 38, range: 6, opacity: 0.95 },
  { top: 3, left: 66, width: 20, dur: 46, range: 8, opacity: 0.8, flip: true },
  { top: 37, left: -6, width: 18, dur: 32, range: 5, opacity: 0.7, desktopOnly: true },
  { top: 61, left: 40, width: 36, dur: 54, range: 7, opacity: 0.9, flip: true }, // melintasi matahari
];

export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop-sun" />
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className={`cloud${c.flip ? ' is-flipped' : ''}${c.desktopOnly ? ' desktop-only' : ''}`}
          style={{
            '--top': `${c.top}%`,
            '--left': `${c.left}%`,
            '--w': `${c.width}vw`,
            '--dur': `${c.dur}s`,
            '--range': `${c.range}vw`,
            '--delay': `${-c.dur * (i / CLOUDS.length)}s`,
            opacity: c.opacity,
          }}
        >
          <JapaneseCloud />
        </div>
      ))}
      <div className="backdrop-grid" />
    </div>
  );
}

// Latar "blue hour": gradien langit, bulan bergaris, awan kasumi (霞), dan grid.

// ── Awan kasumi ──────────────────────────────────────────────
// Motif kabut tradisional Jepang: batang horizontal berujung bulat yang
// bertumpuk, disambung "leher" dengan lekukan setengah lingkaran.
const H = 10; // tebal batang
const G = 10; // jarak antar batang
const R = G / 2; // jari-jari lekukan

// bars: [xAwal, xAkhir] dari atas ke bawah
// stems: [xAwal, xAkhir] leher antara batang ke-i dan ke-(i+1)
const SHAPES = {
  tiga: { bars: [[30, 130], [0, 170], [40, 150]], stems: [[65, 90], [100, 125]] },
  dua: { bars: [[0, 95], [0, 185]], stems: [[30, 50]] },
  kecil: { bars: [[45, 135], [0, 110]], stems: [[65, 85]] },
  tangga: { bars: [[70, 175], [25, 135], [0, 95]], stems: [[85, 110], [45, 70]] },
};

function stemPath([s1, s2], top) {
  const bottom = top + G;
  // Sedikit overlap (0.5) supaya tidak ada garis tipis di sambungan.
  return [
    `M${s1 - R} ${top - 0.5}`,
    `H${s2 + R} V${top}`,
    `A${R} ${R} 0 0 0 ${s2 + R} ${bottom}`,
    `V${bottom + 0.5} H${s1 - R} V${bottom}`,
    `A${R} ${R} 0 0 0 ${s1 - R} ${top}`,
    'Z',
  ].join(' ');
}

function Kasumi({ shape }) {
  const { bars, stems } = SHAPES[shape];
  const width = Math.max(...bars.map(([, x2]) => x2));
  const height = bars.length * H + (bars.length - 1) * G;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      {bars.map(([x1, x2], i) => (
        <rect key={`b${i}`} x={x1} y={i * (H + G)} width={x2 - x1} height={H} rx={H / 2} />
      ))}
      {stems.map((stem, i) => (
        <path key={`s${i}`} d={stemPath(stem, i * (H + G) + H)} />
      ))}
    </svg>
  );
}

// top/left dalam %, width dalam vw (dibatasi min/max di CSS), dur = detik satu ayunan.
const CLOUDS = [
  { shape: 'tiga', top: 7, left: 3, width: 26, dur: 40, range: 5 },
  { shape: 'kecil', top: 4, left: 70, width: 15, dur: 48, range: 7, flip: true },
  { shape: 'dua', top: 36, left: -4, width: 20, dur: 34, range: 4, desktopOnly: true },
  { shape: 'tangga', top: 58, left: 44, width: 28, dur: 56, range: 6, flip: true }, // melintasi bulan
  { shape: 'kecil', top: 30, left: 82, width: 13, dur: 44, range: 5, desktopOnly: true },
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
          }}
        >
          <Kasumi shape={c.shape} />
        </div>
      ))}
      <div className="backdrop-grid" />
    </div>
  );
}

import { useState } from "react";

// Study-themed kanji paired with a simple line-art figure and an EN/BG
// translation caption, composed as a single watermark. A random subset is
// placed at random positions once per mount (i.e. once per page load/refresh).
const MOTIFS = [
  { kanji: "集中", figure: "mountain", en: "Focus", bg: "Фокус" },
  { kanji: "努力", figure: "wave", en: "Effort", bg: "Усилие" },
  { kanji: "頑張れ", figure: "sun", en: "Do your best", bg: "Дай всичко от себе си" },
  { kanji: "継続", figure: "blossom", en: "Perseverance", bg: "Постоянство" },
  { kanji: "静寂", figure: "moon", en: "Stillness", bg: "Спокойствие" },
  { kanji: "夢", figure: "tree", en: "Dream", bg: "Мечта" },
];

const POSITIONS = [
  "-top-10 -left-8 sm:-top-16 sm:-left-12",
  "-top-10 -right-8 sm:-top-16 sm:-right-12",
  "-bottom-10 -left-8 sm:-bottom-16 sm:-left-12",
  "-bottom-10 -right-8 sm:-bottom-16 sm:-right-12",
  "top-1/3 -left-10 sm:-left-16",
  "top-1/3 -right-10 sm:-right-16",
];

const MOTIF_COUNT = 4;

const shuffle = (items) => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const pickPlacements = () => {
  const motifs = shuffle(MOTIFS).slice(0, MOTIF_COUNT);
  const positions = shuffle(POSITIONS).slice(0, MOTIF_COUNT);
  return motifs.map((motif, index) => ({ motif, positionClass: positions[index] }));
};

const FIGURES = {
  mountain: <path d="M0 160 L50 90 L80 130 L120 60 L200 160 Z" fill="none" stroke="currentColor" strokeWidth="2" />,
  wave: <path d="M0 130 Q 25 100 50 130 T 100 130 T 150 130 T 200 130" fill="none" stroke="currentColor" strokeWidth="2" />,
  sun: (
    <>
      <circle cx="140" cy="70" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="0" y1="150" x2="200" y2="150" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  blossom: (
    <>
      <path d="M10 170 Q 60 130 120 60" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="120" cy="60" r="7" fill="currentColor" />
      <circle cx="95" cy="90" r="5" fill="currentColor" />
      <circle cx="70" cy="120" r="4" fill="currentColor" />
    </>
  ),
  moon: (
    <>
      <path d="M130 40 a40 40 0 1 0 0 80 a32 32 0 1 1 0 -80 Z" fill="currentColor" />
      <circle cx="55" cy="55" r="2.5" fill="currentColor" />
      <circle cx="75" cy="80" r="2" fill="currentColor" />
    </>
  ),
  tree: (
    <>
      <line x1="100" y1="180" x2="100" y2="120" stroke="currentColor" strokeWidth="2" />
      <path d="M60 120 L100 60 L140 120 Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M70 145 L100 90 L130 145 Z" fill="none" stroke="currentColor" strokeWidth="2" />
    </>
  ),
};

function BackgroundMotif() {
  const [placements] = useState(pickPlacements);

  return (
    <>
      {placements.map(({ motif, positionClass }) => (
        <div
          key={motif.kanji}
          aria-hidden="true"
          className={`fixed z-0 pointer-events-none select-none flex flex-col items-center text-on-surface-variant ${positionClass}`}
        >
          <svg width="320" height="320" viewBox="0 0 200 200" className="w-56 h-56 sm:w-72 sm:h-72 opacity-[0.1]">
            {FIGURES[motif.figure]}
            <text x="30" y="55" fontSize="46" fontFamily="serif" fill="currentColor">
              {motif.kanji}
            </text>
          </svg>
          <div className="-mt-4 text-center opacity-30">
            <p className="text-[0.65rem] sm:text-xs font-medium tracking-wide">{motif.en}</p>
            <p className="text-[0.6rem] sm:text-[0.7rem] tracking-wide">{motif.bg}</p>
          </div>
        </div>
      ))}
    </>
  );
}

export default BackgroundMotif;

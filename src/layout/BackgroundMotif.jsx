import { useState } from "react";
import backgroundMotifs from "./backgroundMotifs";

// Positions the watermark cards can be placed at, inset from the viewport
// edges so the text never gets clipped. Edit backgroundMotifs.js to
// add/change the messages shown.
//
// On mobile the single-column layout leaves no side/corner whitespace, so
// only the top/bottom-center positions are shown there (fewer motifs, less
// text per motif). The corner and mid-side positions only appear at sm+,
// where the centered desktop layout gives them room to breathe.
const CENTER_POSITIONS = [
  "top-6 left-1/2 -translate-x-1/2 sm:top-10",
  "bottom-6 left-1/2 -translate-x-1/2 sm:bottom-10",
];

const EDGE_POSITIONS = [
  "top-4 left-4 sm:top-8 sm:left-8",
  "top-4 right-4 sm:top-8 sm:right-8",
  "bottom-4 left-4 sm:bottom-8 sm:left-8",
  "bottom-4 right-4 sm:bottom-8 sm:right-8",
  "top-1/2 left-2 -translate-y-1/2 sm:left-6",
  "top-1/2 right-2 -translate-y-1/2 sm:right-6",
];

const MOBILE_MOTIF_COUNT = 2;
const DESKTOP_EXTRA_COUNT = 2;

const shuffle = (items) => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const pickPlacements = () => {
  const motifs = shuffle(backgroundMotifs);
  const centerPositions = shuffle(CENTER_POSITIONS);
  const edgePositions = shuffle(EDGE_POSITIONS).slice(0, DESKTOP_EXTRA_COUNT);

  const centerPlacements = motifs.slice(0, MOBILE_MOTIF_COUNT).map((motif, index) => ({
    motif,
    positionClass: centerPositions[index],
    mobileVisible: true,
  }));
  const edgePlacements = motifs
    .slice(MOBILE_MOTIF_COUNT, MOBILE_MOTIF_COUNT + DESKTOP_EXTRA_COUNT)
    .map((motif, index) => ({ motif, positionClass: edgePositions[index], mobileVisible: false }));

  return [...centerPlacements, ...edgePlacements];
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
  bamboo: (
    <>
      <line x1="60" y1="180" x2="60" y2="40" stroke="currentColor" strokeWidth="3" />
      <line x1="60" y1="70" x2="75" y2="70" stroke="currentColor" strokeWidth="2" />
      <line x1="60" y1="110" x2="75" y2="110" stroke="currentColor" strokeWidth="2" />
      <line x1="100" y1="180" x2="100" y2="60" stroke="currentColor" strokeWidth="3" />
      <line x1="100" y1="90" x2="115" y2="90" stroke="currentColor" strokeWidth="2" />
      <line x1="100" y1="130" x2="115" y2="130" stroke="currentColor" strokeWidth="2" />
      <line x1="140" y1="180" x2="140" y2="80" stroke="currentColor" strokeWidth="3" />
      <line x1="140" y1="110" x2="155" y2="110" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  bird: (
    <>
      <path d="M30 110 Q 70 70 100 100 Q 130 70 170 110" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="100" y1="100" x2="100" y2="140" stroke="currentColor" strokeWidth="2" />
      <path d="M100 100 Q 85 80 70 85" fill="none" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  rain: (
    <>
      <path d="M50 50 a25 20 0 1 1 90 10" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="60" y1="90" x2="45" y2="130" stroke="currentColor" strokeWidth="2" />
      <line x1="90" y1="90" x2="75" y2="140" stroke="currentColor" strokeWidth="2" />
      <line x1="120" y1="90" x2="105" y2="130" stroke="currentColor" strokeWidth="2" />
      <line x1="150" y1="90" x2="135" y2="140" stroke="currentColor" strokeWidth="2" />
    </>
  ),
};

function BackgroundMotif() {
  const [placements] = useState(pickPlacements);

  return (
    <>
      {placements.map(({ motif, positionClass, mobileVisible }) => (
        <div
          key={motif.kanji}
          aria-hidden="true"
          className={`fixed z-0 pointer-events-none select-none flex-col items-center text-center max-w-[13rem] sm:max-w-[15rem] text-on-surface-variant ${positionClass} ${mobileVisible ? "flex" : "hidden sm:flex"}`}
        >
          <svg width="96" height="96" viewBox="0 0 200 200" className="w-16 h-16 sm:w-20 sm:h-20 opacity-[0.12]">
            {FIGURES[motif.figure]}
          </svg>
          <p className="mt-1 font-headline text-base sm:text-lg tracking-wide opacity-[0.16]">{motif.kanji}</p>
          <p className={`italic text-[0.65rem] sm:text-xs opacity-[0.22] ${mobileVisible ? "hidden sm:block" : ""}`}>
            ({motif.romaji})
          </p>
          <p className="mt-1 text-xs sm:text-sm font-medium opacity-30">{motif.en}</p>
          <p className={`text-[0.65rem] sm:text-xs opacity-25 ${mobileVisible ? "hidden sm:block" : ""}`}>
            {motif.reminder}
          </p>
          <p className={`text-[0.6rem] sm:text-[0.7rem] opacity-25 ${mobileVisible ? "hidden sm:block" : ""}`}>
            {motif.bg}
          </p>
        </div>
      ))}
    </>
  );
}

export default BackgroundMotif;

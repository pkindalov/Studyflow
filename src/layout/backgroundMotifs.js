// Background watermark messages shown faintly behind the app.
// Add, edit, or remove entries freely — a random few are picked and placed
// automatically on every page load, no other code needs to change.
//
// Fields:
//   kanji    - the Japanese text (a proverb, phrase, or single word)
//   romaji   - how it's pronounced, spelled out in Latin letters
//   en       - English translation of the kanji
//   reminder - a short motivational line shown under the translation
//   bg       - Bulgarian translation of the kanji
//   figure   - decorative icon key: "mountain" | "wave" | "sun" | "blossom" | "moon" | "tree"
//              | "bamboo" | "bird" | "rain"

const backgroundMotifs = [
  {
    kanji: "笑う門には福来る",
    romaji: "Warau kado ni wa fuku kitaru",
    en: "Good fortune comes to those who smile.",
    reminder: "A positive spirit attracts good things.",
    bg: "Доброто настроение привлича късмет.",
    figure: "sun",
  },
  {
    kanji: "塵も積もれば山となる",
    romaji: "Chiri mo tsumoreba yama to naru",
    en: "Even dust, when piled up, becomes a mountain.",
    reminder: "A little effort every day leads to success.",
    bg: "Дори прахът, натрупан достатъчно, става планина.",
    figure: "mountain",
  },
  {
    kanji: "学問に王道なし",
    romaji: "Gakumon ni ōdō nashi",
    en: "There is no shortcut to learning.",
    reminder: "The slow path often teaches the most.",
    bg: "Няма кратък път към знанието.",
    figure: "blossom",
  },
  {
    kanji: "初心忘るべからず",
    romaji: "Shoshin wasuru bekarazu",
    en: "Never forget your beginner's spirit.",
    reminder: "Stay humble — there is always something new to learn.",
    bg: "Никога не забравяй духа на начинаещия.",
    figure: "tree",
  },
  {
    kanji: "改善",
    romaji: "Kaizen",
    en: "Continuous improvement.",
    reminder: "Small, consistent actions build lasting momentum.",
    bg: "Постоянно усъвършенстване.",
    figure: "moon",
  },
  {
    kanji: "継続は力なり",
    romaji: "Keizoku wa chikara nari",
    en: "Continuity is power.",
    reminder: "Consistency turns small steps into real progress.",
    bg: "Постоянството е сила.",
    figure: "wave",
  },
  {
    kanji: "七転び八起き",
    romaji: "Nanakorobi yaoki",
    en: "Fall down seven times, stand up eight.",
    reminder: "Persistence outlasts failure.",
    bg: "Падни седем пъти, стани осем.",
    figure: "bamboo",
  },
  {
    kanji: "一期一会",
    romaji: "Ichigo ichie",
    en: "One time, one meeting.",
    reminder: "Treasure this moment — it will not come again.",
    bg: "Един път, една среща.",
    figure: "bird",
  },
  {
    kanji: "雨降って地固まる",
    romaji: "Ame futte ji katamaru",
    en: "After rain, the ground hardens.",
    reminder: "Hard times build a stronger foundation.",
    bg: "След дъжда земята се втвърдява.",
    figure: "rain",
  },
];

export default backgroundMotifs;

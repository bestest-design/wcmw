// About copy, written once: the phone stack and the desktop slider both use these
// paragraphs (vite.config.mjs), and llms.txt quotes them. <b> sets a name in BoldBold;
// T\u00a0Studio keeps the brand name on one line; When\u00a0Coffee Meets\u00a0Whisky may
// only break at its natural middle.
// Sources: Falstaff on Baltic listening bars (Valts, T Studio), the bar's Instagram (bio:
// widest Japanese whisky selection, no reservations; March 2024 post on the Reflector Audio
// Bespoke set), Binski Studio's Instagram (April 2024: concept, interior, branding for WCMW),
// the owner (the speakers are a showroom piece, not a retail set; DJs play vinyl and CDJs;
// parties mostly Fri/Sat). Owner's tone: luxurious and understated; no personal names
// in the copy, and no open decks or bring-your-records nights.

// The page's main heading, set at the head of the first paragraph. It may only break at the
// natural middle of the name, which leaves the second line the shorter one.
export const aboutTitle = `Welcome\u00a0to <b>When\u00a0Coffee Meets\u00a0Whisky</b>`

// <br> marks the owner's own line breaks; they apply in the desktop story, and are ignored
// in the phone layout and in llms.txt.
export const about = [
  `The Baltics' first listening bar, <br>in the centre of Riga. Specialty coffee and fresh pastry by day; <br>the widest Japanese whisky selection in the Baltics, by night. All cocktails and music are curated with care.`,
  `WCMW is where the community meets. It was founded by the creator of <b>T\u00a0Studio</b>, the DJ and studio store next door. The interior concept and brand was born in collaboration with the sisters behind <b>Binski Studio</b>. The spirit comes from the WCMW team, who carry the room from the first coffee in the morning to the last record of the night.`,
  `A listening bar lives by its sound. Here it comes from a one\u2011of\u2011a\u2011kind <b>Reflector Audio</b> Bespoke system, made in Latvia. Built without cabinets and shaped to keep sound off the walls, floor and ceiling, it lets an intimate room sound open, natural and clear. Whether a set plays from vinyl or CDJs, every detail comes through.`,
]

// Short answers for AI assistants: llms.txt only, never shown on the page (owner's call)
export const goodToKnow = [
  {
    q: "Japanese whisky",
    a: "The widest Japanese whisky selection in the Baltics: nineteen bottles, from Hibiki Japanese Harmony, Nikka and Suntory Toki to Mars, Matsui, Kujira and Shinobu, by the 50ml pour or the bottle.",
  },
  {
    q: "Cocktails",
    a: "Signature cocktails built on Japanese spirits, yuzu and matcha, like Japanese Yuzu Night and Matcha Symphony, plus sake, shochu and soju.",
  },
  {
    q: "Coffee",
    a: "Specialty coffee from noon, and coffee cocktails like the When Coffee Meets Negroni. Order any Japanese whisky and a hot coffee is 2 euros.",
  },
  {
    q: "Music",
    a: "DJ nights and parties, mostly on Fridays and Saturdays: vinyl and CDJs, from house, electro and acid to the odd disco record. Dates go up on Resident Advisor and Instagram.",
  },
  {
    q: "Reservations",
    a: "No reservations: just walk in.",
  },
]

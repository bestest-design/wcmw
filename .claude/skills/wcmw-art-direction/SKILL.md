---
name: wcmw-art-direction
description: Art-direction rules for wcmw.bar (WCMW listening bar, Riga). Use before designing or changing any section, transition, type treatment or motion on this site, and to grade the result before showing it to the owner.
---

# WCMW art direction

Distilled for this project from two MIT-licensed skill sets (MengTo/Skills `web-design`,
wondelai/skills `top-design`), read on 2026-11-23, and from the owner's feedback in the
redesign sessions. Written in our own words; only what applies to this site is kept.
What was left out on purpose: font shopping (the brand faces are fixed), palette advice
(sulfur yellow and ink are fixed), a smooth-scroll library for the whole page, WebGL and
generated imagery (nothing here needs them).

## The brand, fixed

- Sulfur `#ffff3e`, ink `#181716`. BoldBold for display, SequelSans light for text.
- Stretched words ("Driiiiinnnksss") are branding: never respell them.
- Black spring rules, pills and capsules with black borders, the dancer, the burst fellow,
  the record carrier: use these before inventing a new ornament.
- Tone: luxurious, understated, a little playful. Loud type, quiet everything else.

## Rules that decide a design here

1. **Type is the design.** Aim for a wide gap between display and reading sizes (about
   10 to 1). Mid-sized text in a box is the failure case: it is neither a headline nor a
   caption. A paragraph gets one lead line set large, then its body at reading size
   (18 to 22px, 45 to 75 characters a line, line-height about 1.5).
2. **Photos and text each get their own ground.** Never lay reading text over a photo, and
   never cover the room with boxes. Let photos bleed off an edge; give text bare yellow.
3. **Asymmetry over centring.** Offset the composition, let one side run off screen,
   alternate dense and empty stretches. Empty yellow is a tool only when it frames something.
4. **One signature moment per section**, designed first: the frame someone would screenshot.
5. **Every movement has a reason** (hierarchy, story, feedback, change of state). If the
   reason cannot be said in a sentence, cut it.
6. **Parallax only on pictures, never on reading text.** Text may reveal; it does not drift.
7. **No stock easing.** Use custom curves: expo out `cubic-bezier(0.16, 1, 0.3, 1)`, expo
   in-out `cubic-bezier(0.87, 0, 0.13, 1)`; in GSAP `expo`, `power3`/`power4` in-out.
   Sequence and stagger; never animate everything at once.
8. **Pinned beats, not hijacking.** Pin with CSS sticky, scrub with GSAP ScrollTrigger and
   a little smoothing. The visitor must always be able to scroll on at their own pace.
9. **Scrubbed word reveal** is the right tool for a statement: split text into word spans
   without flattening markup (links and `<b>` stay), keep line wraps free, final state is
   normal typography, readable in full with no script and with reduced motion.
10. **Complete without script and with reduced motion**: render the final state, do not
    just shorten animations.
11. **Line breaks are designed.** One sentence per line where it helps; a sentence that
    must wrap splits near its middle, second line never the longer. Brand names never break
    in the wrong place.

## Owner's standing preferences (learned the hard way)

- Does not want text in boxes over photos, cramped stacks, dead empty screens, half-empty
  rows, soft generic fades, or anything that reads as "amateur".
- Likes: the diagonal travel of the photos, hard clean cuts behind a spring rule, capsules
  growing out of the dock, curtains with a black leading edge.
- Wants transitions calm enough to enjoy each section, never so long the page feels stuck.

## Before showing work

Film it: step the scroll in small increments at desktop and phone sizes, tile the frames,
and look at them as a stranger would. Grade 0 to 10 on: does the type stop you, is there a
frame worth a screenshot, does it read with eyes half shut, is anything cramped or stranded,
does each motion explain itself. Say the grade and the weak spots plainly. Below 8, keep
working or say why not.

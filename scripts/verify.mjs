// Post-build checks for the static site in _site/ (run after `npm run build`).
// Guards the menu content, the RA events embed, branded headings, the iOS
// horizontal-overflow fix, the live open/closed logic and local asset links.
import fs from "fs"
import path from "path"
import menu from "../src/menu.data.mjs"
import { countMenuItems } from "../src/menu.render.mjs"
import { computeStatus } from "../src/status.mjs"

const siteDir = "_site"
const html = fs.readFileSync(path.join(siteDir, "index.html"), "utf8")
const cssPath = path.join(siteDir, "assets", "styles.css")

const failures = []
const check = (ok, message) => {
  if (!ok) failures.push(message)
}
const count = (pattern) => (html.match(pattern) || []).length
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")

// Section order and navigation targets.
const at = (id) => html.indexOf(`id="${id}"`)
for (const id of ["top", "about", "drinks", "instagram", "events", "contacts"]) {
  check(at(id) !== -1, `missing section id="${id}"`)
  check(count(new RegExp(`id="${id}"`, "g")) === 1, `id="${id}" must appear exactly once`)
}
check(at("instagram") < at("events") && at("events") < at("contacts"), "sections must be ordered instagram → events → contacts")
for (const target of ["#drinks", "#events", "#contacts"]) {
  check(html.includes(`href="${target}"`), `dock/nav link ${target} missing`)
}

// Branded stretched headings: intentional spellings, never "corrected".
// (the drawn word only: plain names for screen readers sit in .sr-only spans)
const headingTexts = [...html.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/g)].map((m) =>
  m[1].replace(/<span class="sr-only">[\s\S]*?<\/span>/g, "").replace(/<[^>]+>/g, "").trim()
)
for (const word of ["Driiiiinnnksss", "Instagrrrraaaaam", "Eeeeeeeeevents", "Signature Cocktailssssssssssssss", "Red wineeeeeeeeeeeeeeeeeeeeeeeeeeeeee"]) {
  check(headingTexts.includes(word), `branded heading "${word}" missing or respelled`)
}

// Menu: every item from src/menu.data.mjs is rendered, with its price.
const rendered = count(/<li class="mi[ "]/g)
const expected = countMenuItems(menu)
check(rendered === expected, `menu renders ${rendered} items, data has ${expected}`)
const text = decode(html)
for (const cat of menu.categories) {
  check(html.includes(`href="#menu-${cat.id}"`), `menu rail link for ${cat.id} missing`)
  for (const sec of cat.sections) {
    for (const it of sec.items) check(text.includes(it.name), `menu item missing: ${it.name}`)
  }
}
check(text.includes("Hibiki Japanese Harmony") && /<span>15<\/span><span>130<\/span>/.test(html), "two-column spirit prices not rendered (Hibiki 15/130)")
check(text.includes(menu.deal.name), "When Coffee Meets Whisky Deal card missing")

// Events: imported from RA (promoter 187972) at build time, or RA's own widget as the fallback.
const eventsHtml = html.slice(at("events"), at("contacts"))
check(eventsHtml.includes('href="https://ra.co/promoters/187972"'), "Follow on RA link missing")
if (eventsHtml.includes('data-source="ra"')) {
  check(/class="ev-list|class="ev-empty"/.test(eventsHtml), "imported RA events render no list and no empty note")
} else {
  const iframeSrc = decode((eventsHtml.match(/<iframe[^>]*\ssrc="([^"]+)"/) || [])[1] || "")
  check(iframeSrc.startsWith("https://ra.co/promoters/187972/widget/events"), "RA widget must use promoter 187972")
  check(iframeSrc.includes("transparentBackground=true"), "RA widget must have a transparent background")
  check(iframeSrc.includes("theme=light"), "RA widget must use the light theme (dark text on yellow)")
}

// Instagram widget script is lazy-loaded by src/main.js, never parser-blocking.
check(html.includes('data-widget-src="https://wdg.fouita.com/widgets/0x3602c4.js"'), "Instagram widget source missing")
check(!/<script src="https:\/\/wdg\.fouita\.com/.test(html), "Instagram widget must not be a blocking <script>")

// Accessibility basics.
check(!/user-scalable=no|maximum-scale=1/.test(html), "viewport must allow pinch zoom")
check(html.includes('class="skip"'), "skip link missing")
const imgsWithoutAlt = (html.match(/<img(?![^>]*\balt=)[^>]*>/g) || []).length
check(imgsWithoutAlt === 0, `${imgsWithoutAlt} <img> without alt`)

// Local assets referenced by the page exist in the build.
const refs = [...html.matchAll(/(?:src|href|data-full)="\.\/([^"#?]+)"/g)].map((m) => m[1])
const srcsets = [...html.matchAll(/srcset="([^"]+)"/g)].flatMap((m) => m[1].split(",").map((s) => s.trim().split(" ")[0].replace(/^\.\//, "")))
for (const ref of [...refs, ...srcsets]) {
  if (/^(https?:|mailto:|tel:)/.test(ref)) continue
  check(fs.existsSync(path.join(siteDir, ref)), `missing asset in build: ${ref}`)
}

// iOS horizontal-scroll fix lives in CSS: body clips overflow-x.
check(fs.existsSync(cssPath), "_site/assets/styles.css missing (scripts/css.mjs did not run)")
if (fs.existsSync(cssPath)) {
  const css = fs.readFileSync(cssPath, "utf8")
  check(/body\{[^}]*overflow-x:clip/.test(css), "body must keep overflow-x: clip (iOS horizontal scroll fix)")
  check(/prefers-reduced-motion/.test(css), "reduced-motion styles missing")
}

// Opening hours logic (Riga time). Day 1 = Monday.
const hours = { 3: { open: 720, close: 1320 }, 4: { open: 720, close: 1380 }, 5: { open: 720, close: 1560 }, 6: { open: 720, close: 1560 } }
const cases = [
  [{ day: 3, minutes: 11 * 60 }, false, "closed now. opens today at 12:00."],
  [{ day: 3, minutes: 13 * 60 }, true, "open now, until 22:00."],
  [{ day: 6, minutes: 60 }, true, "open now, until 02:00."], // Friday night after midnight
  [{ day: 7, minutes: 90 }, true, "open now, until 02:00."], // Saturday night after midnight
  [{ day: 7, minutes: 3 * 60 }, false, "closed now. opens wednesday at 12:00."],
  [{ day: 2, minutes: 20 * 60 }, false, "closed now. opens tomorrow at 12:00."],
  [{ day: 5, minutes: 23 * 60 + 30 }, true, "open now, until 02:00."],
  [{ day: 4, minutes: 23 * 60 + 30 }, false, "closed now. opens tomorrow at 12:00."],
]
for (const [now, open, text] of cases) {
  const s = computeStatus(hours, now)
  check(s.open === open && s.text === text, `status day ${now.day} ${now.minutes}min: got "${s.text}", want "${text}"`)
}
const listed = [...html.matchAll(/data-day="(\d)" data-open="([\d:]+)" data-close="([\d:]+)"/g)].map((m) => m.slice(1).join(" "))
check(listed.join("|") === "3 12:00 22:00|4 12:00 23:00|5 12:00 02:00|6 12:00 02:00", `hours list changed: ${listed.join("|")}`)

// Structured data (search engines, maps) must agree with the visible hours list.
const ldRaw = (html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1]
let ld = null
try {
  ld = JSON.parse(ldRaw)
} catch {
  check(false, "JSON-LD missing or invalid")
}
if (ld) {
  const dayNo = { Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }
  const ldHours = (ld.openingHoursSpecification || []).map((o) => `${dayNo[o.dayOfWeek]} ${o.opens} ${o.closes}`).join("|")
  check(ld["@type"] === "BarOrPub", "JSON-LD must describe a BarOrPub")
  check(ldHours === listed.join("|"), `JSON-LD hours (${ldHours}) differ from the hours list`)
  check(ld.telephone === "+37123009200" && html.includes('href="tel:+37123009200"'), "phone number mismatch between JSON-LD and page")
}
check(html.includes('content="https://wcmw.bar/og.jpg"') && fs.existsSync(path.join(siteDir, "og.jpg")), "own OG image missing")

if (failures.length) {
  console.error(`verify: ${failures.length} check(s) failed:`)
  for (const f of failures) console.error(`  ✗ ${f}`)
  process.exit(1)
}
console.log(`verify: all checks passed (${expected} menu items, ${cases.length} status cases)`)

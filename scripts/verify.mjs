// Post-build checks for the static site in _site/.
// Guards the RA events embed and the mobile horizontal-overflow fix.
// Run after `npm run build`:  node scripts/verify.mjs
import fs from "fs"
import path from "path"

const siteDir = "_site"
const html = fs.readFileSync(path.join(siteDir, "index.html"), "utf8")
const cssPath = path.join(siteDir, "assets", "styles.css")

const failures = []
const check = (ok, message) => {
  if (!ok) failures.push(message)
}

const count = (pattern) => (html.match(pattern) || []).length

// Section order: Instagram, then Events, then Contacts.
const instagramAt = html.indexOf('id="instagram"')
const eventsAt = html.indexOf('id="events"')
const contactsAt = html.indexOf('id="contacts"')
check(instagramAt !== -1, 'missing section id="instagram"')
check(eventsAt !== -1, 'missing section id="events"')
check(count(/id="events"/g) === 1, 'id="events" must appear exactly once')
check(instagramAt < eventsAt && eventsAt < contactsAt, "sections must be ordered instagram → events → contacts")
check(html.includes('href="#events"'), 'nav link href="#events" missing')

// Events section content: branded heading (intentional spelling) + RA widget.
const eventsHtml = html.slice(eventsAt, contactsAt)
check(eventsHtml.includes(">Eeeeeeeeevents</h2>"), 'events heading must read "Eeeeeeeeevents"')
const iframeSrc = (eventsHtml.match(/<iframe[^>]*\ssrc="([^"]+)"/) || [])[1] || ""
check(iframeSrc.startsWith("https://ra.co/promoters/187972/widget/events"), "RA widget must use promoter 187972")
check(iframeSrc.includes("transparentBackground=true"), "RA widget must have a transparent background")
check(iframeSrc.includes("theme=light"), "RA widget must use the light theme (dark text on yellow)")

// Mobile overflow fix: iOS Safari ignores overflow-x on <html>, so <body> clips.
const bodyClass = (html.match(/<body[^>]*class="([^"]*)"/) || [])[1] || ""
check(bodyClass.split(/\s+/).includes("overflow-x-clip"), "<body> must keep overflow-x-clip (iOS horizontal scroll fix)")
const logoClass = (html.match(/<img[^>]*alt="WCMW Logo"[^>]*class="([^"]*)"/) || [])[1] || ""
check(logoClass.split(/\s+/).includes("max-w-full"), "logo must keep max-w-full so it fits narrow phones")

// Build pipeline: scripts/css.mjs must have produced the stable stylesheet.
check(fs.existsSync(cssPath), "_site/assets/styles.css missing (scripts/css.mjs did not run)")
if (fs.existsSync(cssPath)) {
  const css = fs.readFileSync(cssPath, "utf8")
  check(/\.overflow-x-clip\{overflow-x:clip\}/.test(css), "compiled CSS lacks .overflow-x-clip")
}

if (failures.length) {
  console.error(`verify: ${failures.length} check(s) failed:`)
  for (const f of failures) console.error(`  ✗ ${f}`)
  process.exit(1)
}
console.log("verify: all checks passed")

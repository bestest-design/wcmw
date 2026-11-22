// Renders src/menu.data.mjs into static HTML at build time (see vite.config.mjs).
// Output is plain markup, so the menu works without JavaScript and stays indexable.

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

const columnsFor = (unit) => (unit && unit.includes("/") ? unit.split("/") : null)

// "8/60" -> ["8","60"], "-/65" -> [null,"65"], "11-23" -> ["11–23"]
const splitPrice = (price, cols) => {
  if (!price) return []
  if (cols && price.includes("/")) return price.split("/").map((p) => (p === "-" ? null : p))
  return [price.replace(/(\d)-(\d)/, "$1–$2")]
}

const priceCell = (price, cols) => {
  const parts = splitPrice(price, cols)
  if (!parts.length) return ""
  if (parts.length === 1) {
    return `<span class="mi-price">${esc(parts[0])}</span>`
  }
  const label = parts
    .map((p, i) => `${cols[i]} ${p === null ? "not available" : `${p} euros`}`)
    .join(", ")
  const cells = parts
    .map((p) => (p === null ? `<span class="mi-na" aria-hidden="true">–</span>` : `<span>${esc(p)}</span>`))
    .join("")
  return `<span class="mi-price mi-price--2" role="text" aria-label="${esc(label)}">${cells}</span>`
}

const item = (it, cols) => {
  const extra = [
    it.sub && `<span class="mi-sub">${esc(it.sub)}</span>`,
    it.desc && `<span class="mi-desc">${esc(it.desc)}</span>`,
    it.note && `<span class="mi-note">${esc(it.note)}</span>`,
  ]
    .filter(Boolean)
    .join("")
  const named = it.desc ? " mi--named" : ""
  const gap = it.gapBefore ? " mi--gap" : ""
  return `<li class="mi${named}${gap}"><span class="mi-name">${esc(it.name)}</span>${priceCell(it.price, cols)}${extra}</li>`
}

const section = (sec) => {
  const cols = columnsFor(sec.unit)
  const len = sec.title ? [...sec.title].length : 0
  const title = sec.title
    ? `<h3 class="menu-sec-title" style="--len:${len}">${esc(sec.title)}</h3>`
    : ""
  let unit = ""
  if (cols) {
    unit = `<p class="menu-cols" aria-hidden="true"><span>${esc(cols[0])}</span><span>${esc(cols[1])}</span></p>`
  } else if (sec.unit) {
    unit = `<p class="menu-unit">${esc(sec.unit)}</p>`
  }
  const cls = cols ? "menu-sec menu-sec--2col" : "menu-sec"
  return `<div class="${cls}">${title}${unit}<ul class="menu-items">${sec.items.map((it) => item(it, cols)).join("")}</ul></div>`
}

const dealCard = (deal) => `
<aside class="menu-deal" aria-label="${esc(deal.name)}">
  <svg class="menu-deal-blob" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
    <path d="M38 52C70 14 150 8 214 12c66 4 140 10 164 52 22 38-4 86-44 108-46 24-126 22-190 18C86 186 22 172 10 128 2 98 16 76 38 52Z" />
  </svg>
  <h3 class="menu-deal-title">${esc(deal.name)}</h3>
  <p class="menu-deal-text">${esc(deal.desc)}</p>
</aside>`

export function renderMenu(data) {
  const rail = data.categories
    .map((c) => `<li><a href="#menu-${c.id}" data-cat="${c.id}">${esc(c.label)}</a></li>`)
    .join("")
  const cats = data.categories
    .map((c) => {
      const body = c.sections.map(section).join("")
      const deal = c.id === "specials" ? dealCard(data.deal) : ""
      return `<section class="menu-cat" id="menu-${c.id}" data-cat="${c.id}" aria-label="${esc(c.label)}">${body}${deal}</section>`
    })
    .join("\n")
  return `<nav class="menu-rail" aria-label="Menu categories"><ul>${rail}</ul></nav>
<div class="menu-body">
${cats}
</div>`
}

export function countMenuItems(data) {
  return data.categories.reduce((n, c) => n + c.sections.reduce((m, s) => m + s.items.length, 0), 0)
}

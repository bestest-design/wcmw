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
  <span class="menu-deal-art" aria-hidden="true"><!-- SVG:icon-bottle.svg --></span>
  <div class="menu-deal-copy">
    <h3 class="menu-deal-title">${esc(deal.name)}</h3>
    <p class="menu-deal-text">${esc(deal.desc)}</p>
  </div>
</aside>`

// Photo shown beside the menu on wide screens while a category is in view
const VISUALS = {
  coffee: ["drink_5", "Coffee poured over a dessert"],
  whisky: ["inside_5", "A whisky and a coffee cocktail at a bar table"],
  specials: ["drink_2", "An espresso martini"],
  cocktails: ["drink_6", "A sour on a cobalt blue table"],
  spirits: ["drink_4", "A highball with olives"],
  wine: ["drink_7", "Red wine on a steel table"],
  beer: ["slide_3", "The bar counter and the drinks fridge", "88% 45%"],
  "no-alcohol": ["drink_1", "A homemade lemonade in yellow light"],
  snacks: ["film_1", "The printed WCMW menu"],
}

export function renderMenuRail(data) {
  const links = data.categories
    .map((c) => `<li><a href="#menu-${c.id}" data-cat="${c.id}">${esc(c.label)}</a></li>`)
    .join("")
  return `<nav class="menu-rail" aria-label="Menu categories"><ul>${links}</ul></nav>`
}

export function renderMenuVisual(data) {
  const imgs = data.categories
    .map((c, i) => {
      const [file, alt, pos] = VISUALS[c.id] || VISUALS.cocktails
      const style = pos ? ` style="object-position:${pos}"` : ""
      return `<img src="./pics/opt/${file}-1280.webp" alt="${esc(alt)}" data-cat="${c.id}" loading="lazy" decoding="async"${style}${i === 0 ? ' class="is-active"' : ""}>`
    })
    .join("")
  return `<figure class="menu-visual" aria-hidden="true">${imgs}</figure>`
}

export function renderMenuBody(data) {
  const cats = data.categories
    .map((c) => {
      const body = c.sections.map(section).join("")
      const deal = c.id === "specials" ? dealCard(data.deal) : ""
      const [file, , pos] = VISUALS[c.id] || VISUALS.cocktails
      const style = pos ? ` style="object-position:${pos}"` : ""
      const sticker = `<img class="menu-sticker" src="./pics/opt/${file}-640.webp" alt="" aria-hidden="true" loading="lazy" decoding="async"${style}>`
      // a category label only where it groups several titled lists (Spirits, Wine, No alcohol)
      const titled = c.sections.filter((s) => s.title).length
      const label = titled > 1 ? `<p class="menu-cat-label" aria-hidden="true">${esc(c.label)}</p>` : ""
      const cls = titled > 1 ? "menu-cat" : "menu-cat menu-cat--single"
      return `<section class="${cls}" id="menu-${c.id}" data-cat="${c.id}" aria-label="${esc(c.label)}">${label}${sticker}${body}${deal}</section>`
    })
    .join("\n")
  return `<div class="menu-body">
${cats}
<div class="menu-empty" hidden><span class="menu-empty-guy" aria-hidden="true"><!-- SVG:icon-burstguy.svg --></span><p class="menu-empty-text" role="status"></p><button type="button" class="pill" data-search-clear>Show the whole menu</button></div>
</div>`
}

export function renderMenu(data) {
  return renderMenuRail(data) + renderMenuBody(data)
}

export function countMenuItems(data) {
  return data.categories.reduce((n, c) => n + c.sections.reduce((m, s) => m + s.items.length, 0), 0)
}

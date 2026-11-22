// WCMW site behaviour: live open/closed status, pullable hero spring with
// optional sound, menu search + rail scroll-spy, thumb dock, BOOM sticker,
// photo lightbox and the lazily loaded Instagram widget.
// Without JavaScript the page is still complete: static menu, links, hours.

import { computeStatus, readHours, rigaNow } from "./status.mjs"
import { initHero } from "./hero.mjs"
import { setSound, storedSound, scratch, needleDrop, glug, tick } from "./sound.mjs"

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* ------------------------------------------------------------------ */
/* Open / closed status, computed in Riga time from the hours list     */
/* ------------------------------------------------------------------ */
function renderStatus() {
  const now = rigaNow()
  const status = computeStatus(readHours(), now)
  document.querySelectorAll("[data-status]").forEach((el) => {
    el.dataset.open = String(status.open)
    const text = el.querySelector("[data-status-text]")
    if (text) text.textContent = status.text
  })
  const dock = document.querySelector(".dock")
  if (dock) dock.dataset.open = String(status.open)
  document.querySelectorAll("[data-hours] li").forEach((li) => {
    li.classList.toggle("is-today", Number(li.dataset.day) === now.day)
  })
}

/* ------------------------------------------------------------------ */
/* Sound toggle (off by default, remembered on this device)            */
/* ------------------------------------------------------------------ */
function initSound() {
  const btn = document.querySelector("[data-sound]")
  const prompt = document.querySelector("[data-sound-prompt]")
  const hero = document.querySelector(".hero")
  if (!btn) return
  const label = btn.querySelector("[data-sound-label]")
  let on = false
  const show = () => {
    btn.setAttribute("aria-pressed", String(on))
    if (label) label.textContent = on ? "sound on" : "sound off"
  }
  const set = (value) => {
    on = value
    setSound(on)
    show()
    if (prompt) prompt.hidden = true
  }
  show()
  btn.addEventListener("click", () => set(!on))

  // After the first pull, offer the sound once, right where the visitor is playing
  let offered = false
  hero?.addEventListener("wcmw:pulled", () => {
    if (on || offered || !prompt) return
    offered = true
    prompt.hidden = false
    btn.classList.add("is-calling")
    setTimeout(() => {
      prompt.hidden = true
      btn.classList.remove("is-calling")
    }, 7000)
  })
  prompt?.addEventListener("click", () => set(true))
  if (storedSound()) btn.classList.add("was-on")
}

/* ------------------------------------------------------------------ */
/* Menu: search, rail scroll-spy, photo beside the menu on desktop     */
/* ------------------------------------------------------------------ */
const normalise = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")

function initMenu() {
  const rail = document.querySelector(".menu-rail")
  if (!rail) return
  const list = rail.querySelector("ul")
  const links = [...rail.querySelectorAll("a[data-cat]")]
  const cats = [...document.querySelectorAll(".menu-cat")]
  const visual = [...document.querySelectorAll(".menu-visual img")]
  const dock = document.querySelector(".dock")
  const menu = document.getElementById("drinks")

  const setActive = (id) => {
    links.forEach((a) => {
      if (a.dataset.cat === id) {
        a.setAttribute("aria-current", "true")
        const left = a.offsetLeft - (list.clientWidth - a.offsetWidth) / 2
        list.scrollTo({ left, behavior: reduceMotion ? "auto" : "smooth" })
      } else {
        a.removeAttribute("aria-current")
      }
    })
    visual.forEach((img) => img.classList.toggle("is-active", img.dataset.cat === id))
  }

  let ticking = false
  const update = () => {
    ticking = false
    const railBox = rail.getBoundingClientRect()
    const line = railBox.bottom + 24
    let current = null
    for (const cat of cats) {
      if (cat.hidden) continue
      if (!current) current = cat
      if (cat.getBoundingClientRect().top <= line) current = cat
    }
    if (current && current.dataset.cat !== rail.dataset.active) {
      rail.dataset.active = current.dataset.cat
      setActive(current.dataset.cat)
    }
    const stuck = railBox.top <= 0.5 && menu.getBoundingClientRect().bottom > railBox.bottom + 80
    rail.classList.toggle("is-stuck", stuck)
    // The rail takes over navigation inside the menu, so the dock steps aside
    if (dock) dock.classList.toggle("is-tucked", stuck)
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    },
    { passive: true }
  )
  update()

  // Search: filters items as you type; empty sections and categories hide
  const input = document.querySelector("[data-menu-search]")
  const countEl = document.querySelector("[data-menu-count]")
  const empty = document.querySelector(".menu-empty")
  const emptyText = empty?.querySelector(".menu-empty-text")
  const items = [...document.querySelectorAll(".menu-body .mi")].map((li) => ({
    li,
    text: normalise(`${li.textContent} ${li.closest(".menu-sec")?.querySelector(".menu-sec-title")?.textContent ?? ""} ${li.closest(".menu-cat")?.getAttribute("aria-label") ?? ""}`),
  }))
  const deal = document.querySelector(".menu-deal")
  const filter = () => {
    const q = normalise(input.value.trim())
    let shown = 0
    items.forEach(({ li, text }) => {
      const hit = !q || q.split(/\s+/).every((w) => text.includes(w))
      li.hidden = !hit
      if (hit) shown++
    })
    document.querySelectorAll(".menu-sec").forEach((sec) => {
      sec.hidden = !sec.querySelector(".mi:not([hidden])")
    })
    if (deal) deal.hidden = Boolean(q) && !normalise(deal.textContent).includes(q)
    cats.forEach((cat) => {
      cat.hidden = !cat.querySelector(".mi:not([hidden])") && !(deal && cat.contains(deal) && !deal.hidden)
      const chip = links.find((a) => a.dataset.cat === cat.dataset.cat)
      chip?.parentElement.toggleAttribute("hidden", cat.hidden)
    })
    if (countEl) countEl.textContent = q && shown ? `${shown} ${shown === 1 ? "drink matches" : "drinks match"}` : ""
    if (empty) {
      empty.hidden = shown > 0 || !q
      if (emptyText) emptyText.textContent = shown || !q ? "" : `Nothing on the menu matches "${input.value.trim()}". Try whisky, yuzu or matcha.`
    }
    rail.dataset.active = ""
    update()
  }
  input?.addEventListener("input", filter)
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") input.blur()
  })
  document.querySelector("[data-search-clear]")?.addEventListener("click", () => {
    input.value = ""
    filter()
    input.focus()
  })
}

/* ------------------------------------------------------------------ */
/* Dock: Menu / Events / Visit within thumb reach, marks where you are */
/* ------------------------------------------------------------------ */
function initDock() {
  const dock = document.querySelector(".dock")
  if (!dock) return
  requestAnimationFrame(() => dock.classList.add("is-visible"))
  // the fade under the dock only matters once content scrolls beneath it
  const hero = document.querySelector(".hero")
  if (hero)
    new IntersectionObserver(([e]) => document.body.classList.toggle("past-hero", !e.isIntersecting), {
      rootMargin: "0px 0px -40% 0px",
    }).observe(hero)
  const links = [...dock.querySelectorAll("a[data-dock]")]
  const sections = links.map((a) => document.getElementById(a.dataset.dock)).filter(Boolean)
  const seen = new Map()
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => seen.set(e.target.id, e.isIntersecting))
      const active = sections.find((s) => seen.get(s.id))
      links.forEach((a) =>
        active && a.dataset.dock === active.id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")
      )
    },
    { rootMargin: "-45% 0px -45% 0px" }
  )
  sections.forEach((s) => spy.observe(s))
}

/* ------------------------------------------------------------------ */
/* BOOM sticker: tap to backspin (with a scratch if sound is on)        */
/* ------------------------------------------------------------------ */
function initBoom() {
  const boom = document.getElementById("boom")
  if (!boom) return
  boom.addEventListener("click", () => {
    if (boom.classList.contains("is-spinning")) return
    boom.classList.add("is-spinning")
    scratch()
    if (navigator.vibrate) navigator.vibrate(120)
    setTimeout(() => boom.classList.remove("is-spinning"), reduceMotion ? 50 : 3100)
  })
}

/* ------------------------------------------------------------------ */
/* Lightbox: swipe or arrow keys between photos, focus stays inside     */
/* ------------------------------------------------------------------ */
function initLightbox() {
  const box = document.getElementById("lightboxOverlay")
  const img = document.getElementById("lightboxImage")
  if (!box || !img) return
  const close = box.querySelector(".lightbox-close")
  const prev = box.querySelector("[data-lightbox-prev]")
  const next = box.querySelector("[data-lightbox-next]")
  const count = box.querySelector("[data-lightbox-count]")
  const photos = [...document.querySelectorAll("img[data-lightbox]")]
  const page = document.querySelector("main")
  let index = 0
  let opener = null

  const show = (i) => {
    index = (i + photos.length) % photos.length
    const el = photos[index]
    img.src = el.dataset.full || el.currentSrc || el.src
    img.alt = el.alt
    if (count) count.textContent = `${index + 1} / ${photos.length}`
  }
  const open = (i, from) => {
    opener = from
    show(i)
    box.setAttribute("aria-hidden", "false")
    box.classList.add("is-open")
    page?.setAttribute("inert", "")
    document.documentElement.style.overflow = "hidden"
    close.focus()
  }
  const shut = () => {
    if (!box.classList.contains("is-open")) return
    box.classList.remove("is-open")
    box.setAttribute("aria-hidden", "true")
    page?.removeAttribute("inert")
    document.documentElement.style.overflow = ""
    opener?.focus()
  }

  photos.forEach((el, i) => {
    el.tabIndex = 0
    el.setAttribute("role", "button")
    el.addEventListener("click", () => open(i, el))
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        open(i, el)
      }
    })
  })
  close.addEventListener("click", shut)
  prev?.addEventListener("click", () => show(index - 1))
  next?.addEventListener("click", () => show(index + 1))
  box.addEventListener("click", (e) => {
    if (e.target === box) shut()
  })
  window.addEventListener("keydown", (e) => {
    if (!box.classList.contains("is-open")) return
    if (e.key === "Escape") shut()
    if (e.key === "ArrowLeft") show(index - 1)
    if (e.key === "ArrowRight") show(index + 1)
    if (e.key === "Tab") {
      // keep focus on the lightbox controls
      const controls = [...box.querySelectorAll("button")]
      const at = controls.indexOf(document.activeElement)
      e.preventDefault()
      controls[(at + (e.shiftKey ? -1 : 1) + controls.length) % controls.length].focus()
    }
  })
  let x0 = null
  box.addEventListener("pointerdown", (e) => (x0 = e.clientX))
  box.addEventListener("pointerup", (e) => {
    if (x0 === null) return
    const dx = e.clientX - x0
    x0 = null
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1))
  })
}

/* ------------------------------------------------------------------ */
/* Instagram widget: load the third-party script only when it's needed  */
/* ------------------------------------------------------------------ */
function initLazyWidget() {
  const host = document.querySelector("[data-widget-src]")
  if (!host) return
  const shell = host.closest(".feed-shell")
  const load = () => {
    const s = document.createElement("script")
    s.src = host.dataset.widgetSrc
    s.async = true
    document.body.appendChild(s)
    // keep our own photos in place until the feed paints real posts (it uses background images)
    const done = () => shell?.classList.add("is-loaded")
    const painted = () =>
      [...host.querySelectorAll("div, a, span")].some((el) => getComputedStyle(el).backgroundImage.includes("url("))
    let pending = 0
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(pending)
      pending = requestAnimationFrame(() => {
        if (painted()) {
          mo.disconnect()
          done()
        }
      })
    })
    mo.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] })
    setTimeout(done, 12000)
  }
  if (!("IntersectionObserver" in window)) return load()
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect()
        load()
      }
    },
    { rootMargin: "800px 0px" }
  )
  io.observe(host)
}

/* ------------------------------------------------------------------ */
/* The Deal puddle: tap the bottle and it tips, the puddle wobbles      */
/* ------------------------------------------------------------------ */
function initDeal() {
  const deal = document.querySelector(".menu-deal")
  if (!deal) return
  deal.tabIndex = 0
  deal.setAttribute("role", "button")
  const pour = () => {
    if (deal.classList.contains("is-pouring")) return
    deal.classList.add("is-pouring")
    glug()
    setTimeout(() => deal.classList.remove("is-pouring"), reduceMotion ? 50 : 1400)
  }
  deal.addEventListener("click", pour)
  deal.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      pour()
    }
  })
}

/* ------------------------------------------------------------------ */
/* With sound on, each section's coil rule ticks like a needle drop     */
/* ------------------------------------------------------------------ */
function initRuleTicks() {
  const rules = document.querySelectorAll(".coil-rule")
  if (!rules.length || !("IntersectionObserver" in window)) return
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && (tick(), io.unobserve(e.target))),
    { rootMargin: "0px 0px -35% 0px" }
  )
  rules.forEach((r) => io.observe(r))
}

/* ------------------------------------------------------------------ */
renderStatus()
setInterval(renderStatus, 60 * 1000)
initSound()
initMenu()
initDock()
initBoom()
initLightbox()
initLazyWidget()
initDeal()
initRuleTicks()

const hero = document.querySelector(".hero")
if (hero) {
  initHero(hero, { reduceMotion })
  // The entrance plays once, after fonts load so the spring lands on real glyphs
  if (!reduceMotion) (document.fonts?.ready ?? Promise.resolve()).then(() => hero.classList.add("is-ready"))
  hero.querySelector("[data-pull]")?.addEventListener("pointerdown", () => needleDrop(), { once: true })
}

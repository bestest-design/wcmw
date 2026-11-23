// WCMW site behaviour: live open/closed status, menu search + rail scroll-spy,
// thumb dock, BOOM sticker, photo strip with dots, lightbox and the lazily
// loaded Instagram widget.
// Without JavaScript the page is still complete: static menu, links, hours.

import { computeStatus, readHours, rigaNow } from "./status.mjs"

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
  document.querySelectorAll("[data-hours] li").forEach((li) => {
    li.classList.toggle("is-today", Number(li.dataset.day) === now.day)
  })
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
  const menu = document.getElementById("drinks")
  const layout = document.querySelector(".menu-layout")
  // phones and tablets: the rail sticks to the bottom of the screen, within thumb reach
  const atBottom = window.matchMedia("(max-width: 1023px)")

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
    const bottom = atBottom.matches
    const line = bottom ? 120 : railBox.bottom + 24
    let current = null
    for (const cat of cats) {
      if (cat.hidden) continue
      if (!current) current = cat
      if (cat.getBoundingClientRect().top <= line) current = cat
    }
    // once the end of the list is on screen, the last category is the one being read
    if (layout.getBoundingClientRect().bottom <= window.innerHeight + 2) current = cats.filter((c) => !c.hidden).at(-1) || current
    if (current && current.dataset.cat !== rail.dataset.active) {
      rail.dataset.active = current.dataset.cat
      setActive(current.dataset.cat)
    }
    // stuck = floating over the list (its resting place is above the list on desktop, after it on phones)
    const stuck = bottom
      ? railBox.top < window.innerHeight && layout.getBoundingClientRect().bottom > railBox.top + 1
      : railBox.top <= 0.5 && menu.getBoundingClientRect().bottom > railBox.bottom + 80
    rail.classList.toggle("is-stuck", stuck)
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
/* Dock: phones and tablets, within thumb reach; marks where you are  */
/* ------------------------------------------------------------------ */
function initDock() {
  const dock = document.querySelector(".dock")
  if (!dock) return
  // On the first screen the hero links do this job; the dock takes over once they scroll away
  const nav = document.querySelector(".hero-nav")
  const show = (on) => {
    dock.classList.toggle("is-visible", on)
    dock.inert = !on
    document.body.classList.toggle("past-hero", on)
  }
  if (nav && "IntersectionObserver" in window) {
    show(false)
    new IntersectionObserver(([e]) => show(!e.isIntersecting && e.boundingClientRect.top < 0)).observe(nav)
  } else {
    show(true)
  }
  // short screens: it hides while you scroll down and comes back when you scroll up
  const short = window.matchMedia("(max-height: 480px)")
  let lastY = window.scrollY
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY
      if (short.matches) dock.classList.toggle("is-away", y > lastY + 4 && y > 200)
      if (y < lastY - 4 || !short.matches) dock.classList.remove("is-away")
      lastY = y
    },
    { passive: true }
  )
  const links = [...dock.querySelectorAll("a[data-dock]")]
  // a section without a link of its own lights up the one it belongs to (data-dock-part)
  const sections = [
    ...links.map((a) => document.getElementById(a.dataset.dock)),
    ...document.querySelectorAll("[data-dock-part]"),
  ].filter(Boolean)
  // one yellow marker slides between the links (phones and tablets); it follows the lit
  // link through every change of the dock's shape
  const row = dock.querySelector(".dock-row")
  const marker = document.createElement("span")
  marker.className = "dock-marker"
  marker.setAttribute("aria-hidden", "true")
  row.prepend(marker)
  const place = () => {
    const a = row.querySelector('a[aria-current="true"]')
    marker.style.opacity = a ? "1" : "0"
    if (!a) return
    marker.style.width = `${a.offsetWidth}px`
    marker.style.transform = `translateX(${a.offsetLeft}px)`
  }
  const light = (id) => {
    links.forEach((a) => (a.dataset.dock === id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")))
    place()
  }
  new ResizeObserver(place).observe(row)
  links.forEach((a) => new ResizeObserver(place).observe(a))
  // a tapped link: the marker slides straight to it, over whatever lies between, and the
  // dock takes the target's shape at once (the drum for Drinks, plain words otherwise)
  // instead of reacting to each section the page scrolls past on the way
  let arriving = 0
  const arrive = () => {
    delete dock.dataset.travel
    dock.dispatchEvent(new Event("dock:travel"))
    queueSpy()
  }
  dock.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-dock]")
    if (!a || e.defaultPrevented) return // the drinks window opening its card is not a journey
    dock.dataset.travel = a.dataset.dock
    light(a.dataset.dock)
    dock.dispatchEvent(new Event("dock:travel"))
    clearTimeout(arriving)
    arriving = setTimeout(arrive, 1500) // in case the page was already there and never scrolls
  })
  window.addEventListener(
    "scroll",
    () => {
      if (!dock.dataset.travel) return
      clearTimeout(arriving)
      arriving = setTimeout(arrive, 550) // at rest for good: the page may pause once to correct its landing
    },
    { passive: true }
  )
  ;["wheel", "touchstart"].forEach((t) =>
    window.addEventListener(t, () => dock.dataset.travel && (clearTimeout(arriving), arrive()), { passive: true })
  )
  // lit = the section sitting at the centre of the screen, measured as drawn, so a panel
  // that is still off to the side during a curtain does not count yet
  let spying = false
  const spy = () => {
    spying = false
    // hit-testing sees what is really drawn there: it skips the part of a panel a curtain has wiped
    let active = null
    for (const el of document.elementsFromPoint(window.innerWidth / 2, window.innerHeight / 2)) {
      active = sections.find((sec) => sec.contains(el))
      if (active) break
    }
    if (!active) return // between sections: keep the last one lit
    if (dock.dataset.travel) return // on the way to a tapped link: the marker already went there
    light(active.dataset.dockPart || active.id)
  }
  const queueSpy = () => {
    if (!spying) {
      spying = true
      requestAnimationFrame(spy)
    }
  }
  window.addEventListener("scroll", queueSpy, { passive: true })
  window.addEventListener("resize", queueSpy)
  setInterval(queueSpy, 400) // curtains keep gliding briefly after the scroll stops
  spy()
  initDockDrinks(dock)
}

/* In the drinks the dock changes shape: Drinks becomes a window on the
   category you are reading, a drum of every name that turns with the scroll
   (bottom to top, resting on each category while you read it); on phones
   About, Events and Where? fold into symbols to make room. Tapping the
   window opens every category as a card grown out of the dock. */
function initDockDrinks(dock) {
  const drinks = dock.querySelector(".dock-drinks")
  const dial = dock.querySelector(".dock-dial")
  const card = dock.querySelector(".dock-card")
  const cardIn = dock.querySelector(".dock-card-in")
  const layout = document.querySelector(".menu-layout")
  const cats = [...document.querySelectorAll(".menu-rail a[data-cat]")]
    .map((a) => ({ id: a.dataset.cat, name: a.textContent.trim(), el: document.getElementById(`menu-${a.dataset.cat}`) }))
    .filter((c) => c.el)
  if (!drinks || !dial || !card || !layout || !cats.length) return
  document.documentElement.classList.add("has-dial")
  const small = window.matchMedia("(max-width: 1023px)")

  cats.forEach((c, i) => {
    const a = document.createElement("a")
    a.href = `#menu-${c.id}`
    a.textContent = c.name
    a.style.setProperty("--i", i)
    cardIn.append(a)
    c.chip = a
  })
  const tape = document.createElement("span")
  tape.className = "dock-tape"
  cats.forEach((c) => {
    c.label = document.createElement("span")
    c.label.textContent = c.name
    tape.append(c.label)
  })
  dial.append(tape)

  let inDrinks = false
  let open = false
  let openY = 0
  const setOpen = (on) => {
    open = on
    dock.classList.toggle("is-open", on)
    card.inert = !on
    if (inDrinks) drinks.setAttribute("aria-expanded", String(on))
  }
  const setDrinks = (on) => {
    if (on === inDrinks) return
    inDrinks = on
    dock.classList.toggle("is-drinks", on)
    if (on) {
      drinks.setAttribute("role", "button")
      drinks.setAttribute("aria-controls", "dock-card")
      drinks.setAttribute("aria-expanded", "false")
    } else {
      setOpen(false)
      ;["role", "aria-controls", "aria-expanded", "aria-label"].forEach((n) => drinks.removeAttribute(n))
    }
  }
  drinks.addEventListener("click", (e) => {
    if (!inDrinks) return
    e.preventDefault()
    openY = window.scrollY
    setOpen(!open)
  })
  cardIn.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false)
  })
  document.addEventListener("click", (e) => {
    if (open && !dock.contains(e.target)) setOpen(false)
  })
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open) {
      setOpen(false)
      drinks.focus()
    }
  })

  const LINE = 120 // where a category counts as being read, as for the rail
  let ticking = false
  const update = () => {
    ticking = false
    if (!small.matches) return setDrinks(false)
    const h = window.innerHeight
    const lb = layout.getBoundingClientRect()
    // on the way to a tapped link the dock already wears the target's shape
    const travel = dock.dataset.travel
    setDrinks(travel ? travel === "drinks" : lb.top < h * 0.55 && lb.bottom > h * 0.45)
    if (open && Math.abs(window.scrollY - openY) > 80) setOpen(false)
    const vis = cats.filter((c) => !c.el.hidden)
    if (!inDrinks || !vis.length) return
    const atEnd = lb.bottom <= h + 2
    let i = 0
    vis.forEach((c, k) => {
      if (c.el.getBoundingClientRect().top <= LINE) i = k
    })
    if (atEnd) i = vis.length - 1
    const next = atEnd ? null : vis[i + 1]
    let f = 0
    if (next) {
      const t0 = vis[i].el.getBoundingClientRect().top
      const t1 = next.el.getBoundingClientRect().top
      const raw = Math.min(1, Math.max(0, (LINE - t0) / (t1 - t0)))
      // a detent: the strip rests on a category while you read it and moves on in its last stretch
      const k = Math.min(1, Math.max(0, (raw - 0.72) / 0.28))
      f = reduceMotion ? Math.round(k) : k * k * (3 - 2 * k)
    }
    const cat = f > 0.5 ? next : vis[i]
    cats.forEach((c) => (c === cat ? c.chip.setAttribute("aria-current", "true") : c.chip.removeAttribute("aria-current")))
    drinks.setAttribute("aria-label", `Drinks: ${cat.name}. Show all categories`)
    cats.forEach((c) => {
      c.label.hidden = c.el.hidden
      c.label.classList.toggle("is-on", c === cat)
    })
    const mid = (c) => c.label.offsetTop + c.label.offsetHeight / 2
    const a = mid(vis[i])
    const b = next ? mid(next) : a
    tape.style.transform = `translateY(${(dial.clientHeight / 2 - (a + (b - a) * f)).toFixed(2)}px)`
  }
  const queue = () => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(update)
    }
  }
  window.addEventListener("scroll", queue, { passive: true })
  window.addEventListener("resize", queue)
  dock.addEventListener("transitionend", queue) // re-centre once the window has opened
  dock.addEventListener("dock:travel", update)
  document.querySelector("[data-menu-search]")?.addEventListener("input", queue)
  update()
}

/* ------------------------------------------------------------------ */
/* BOOM sticker: backspins on hover, press, tap or keyboard (as on the  */
/* first site); a touch also buzzes the phone                           */
/* ------------------------------------------------------------------ */
function initBoom() {
  const boom = document.getElementById("boom")
  if (!boom) return
  const spin = () => {
    if (boom.classList.contains("is-spinning")) return
    boom.classList.add("is-spinning")
    setTimeout(() => boom.classList.remove("is-spinning"), reduceMotion ? 50 : 3100)
  }
  boom.addEventListener("pointerenter", (e) => e.pointerType !== "touch" && spin())
  boom.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch" && navigator.vibrate) navigator.vibrate(200)
    spin()
  })
  boom.addEventListener("click", spin) // Enter / Space
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
    // desktop shows full rows only: a ragged last row is dropped
    const trim = () => {
      const cards = [...host.querySelectorAll(".splide__slide:not(.splide__slide--clone) .ft-card")]
      // three full rows: five across when there are 15 posts, four across with 12 (Instagram
      // only hands the latest 12 to a username feed), otherwise whole rows of five
      const cols = cards.length >= 15 ? 5 : cards.length >= 12 ? 4 : 5
      const keep = Math.min(cols * 3, Math.floor(cards.length / cols) * cols) || cards.length
      shell?.style.setProperty("--feed-cols", cols)
      cards.forEach((c, i) => c.classList.toggle("is-extra", i >= keep))
    }
    const done = () => {
      shell?.classList.add("is-loaded")
      trim()
      setTimeout(trim, 1500)
    }
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
/* Photo strip: drifts sideways while the page scrolls past (a hint     */
/* that it scrolls), with one dot per stop underneath                   */
/* ------------------------------------------------------------------ */
function initGallery() {
  const track = document.querySelector(".gallery-track")
  if (!track) return
  const items = [...track.children]
  const dots = document.createElement("div")
  dots.className = "gallery-dots"
  dots.setAttribute("aria-hidden", "true") // keyboard users tab through the photos themselves
  track.after(dots)

  let stops = []
  let current = -1
  let userTook = false
  const max = () => track.scrollWidth - track.clientWidth
  const build = () => {
    const m = max()
    const at = items.map((li) => Math.min(m, li.offsetLeft - items[0].offsetLeft))
    stops = at.filter((x, i) => i === 0 || x - at[i - 1] > 4)
    dots.replaceChildren(
      ...stops.map((x, i) => {
        const b = document.createElement("button")
        b.type = "button"
        b.tabIndex = -1
        b.addEventListener("click", () => {
          take()
          track.scrollTo({ left: x, behavior: reduceMotion ? "auto" : "smooth" })
        })
        return b
      })
    )
    current = -1
    mark()
  }
  const mark = () => {
    const x = track.scrollLeft
    let best = 0
    stops.forEach((s, i) => Math.abs(s - x) < Math.abs(stops[best] - x) && (best = i))
    if (best === current) return
    current = best
    ;[...dots.children].forEach((d, i) => d.classList.toggle("is-on", i === best))
  }
  track.addEventListener("scroll", () => requestAnimationFrame(mark), { passive: true })
  window.addEventListener("resize", build, { passive: true })
  build()

  // Drift: the page's vertical scroll pans the strip by up to about two photos,
  // until the visitor swipes or taps it; then it is all theirs.
  const take = () => {
    if (userTook) return
    userTook = true
    track.classList.remove("is-drifting")
  }
  ;["pointerdown", "touchstart", "wheel", "keydown"].forEach((t) => track.addEventListener(t, take, { passive: true }))
  if (reduceMotion || !("IntersectionObserver" in window)) return
  let near = false
  let ticking = false
  const drift = () => {
    ticking = false
    if (userTook || !near) return
    const r = track.getBoundingClientRect()
    const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)))
    const reach = Math.min(max(), (stops[2] ?? stops.at(-1)) || 0)
    track.scrollLeft = p * reach
  }
  new IntersectionObserver(([e]) => {
    near = e.isIntersecting
    track.classList.toggle("is-drifting", near && !userTook)
    drift()
  }).observe(track)
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking && near && !userTook) {
        ticking = true
        requestAnimationFrame(drift)
      }
    },
    { passive: true }
  )
}

/* ------------------------------------------------------------------ */
/* Walkers: cross the screen from the left edge while the page scrolls  */
/* to its end, so they arrive on the marquee floor at the last scroll   */
/* ------------------------------------------------------------------ */
function initWalkers() {
  const walkers = document.querySelector(".visit-walkers")
  if (!walkers || reduceMotion) return
  const docTop = (el) => {
    let y = 0
    for (let e = el; e; e = e.offsetParent) y += e.offsetTop
    return y
  }
  // the page's end view (the section and the footer) holds still while they cross
  // (see .visit-hold in the stylesheet); from there on the scroll walks them
  const hold = walkers.closest(".visit-hold")
  const pinned = walkers.closest(".visit-pin")
  let stick = 0
  const pin = () => {
    if (!hold) return
    document.documentElement.classList.add("has-walk")
    stick = Math.min(0, window.innerHeight - pinned.offsetHeight)
    hold.style.setProperty("--visit-stick", `${stick}px`)
  }
  pin()
  if (hold) new ResizeObserver(pin).observe(pinned)
  let ticking = false
  const update = () => {
    ticking = false
    const vh = window.innerHeight
    // with the hold: from the moment the end view locks in place; without: from first sight
    const top = hold ? docTop(hold) - stick + vh : docTop(walkers)
    const end = document.documentElement.scrollHeight - vh
    const span = end + vh - top
    const p = span > 0 ? Math.min(1, Math.max(0, (window.scrollY + vh - top) / span)) : 1
    walkers.style.setProperty("--walk", p.toFixed(4))
  }
  const queue = () => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(update)
    }
  }
  window.addEventListener("scroll", queue, { passive: true })
  window.addEventListener("resize", queue, { passive: true })
  update()
}

/* ------------------------------------------------------------------ */
/* Desktop curtains: feed -> drinks from the left, photo strip ->      */
/* events from the right. Sticky holds both panels still (CSS); GSAP   */
/* moves them sideways, smoothed so a mouse wheel glides instead of    */
/* stepping. The outgoing panel drifts a quarter of the way and is     */
/* wiped at the seam; the incoming one slides over it.                 */
/* ------------------------------------------------------------------ */
async function initCurtains() {
  const pairs = [...document.querySelectorAll(".swap-out")]
    .map((wrap) => ({ wrap, out: wrap.querySelector("section"), into: wrap.nextElementSibling?.querySelector("section") }))
    .filter((p) => p.out && p.into && p.wrap.nextElementSibling.classList.contains("swap-in"))
  const query = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)"
  if (!pairs.length || !window.matchMedia(query).matches) {
    // phones never load the animation library; a later resize to desktop does
    if (pairs.length) window.matchMedia(query).addEventListener("change", () => initCurtains(), { once: true })
    return
  }
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
  gsap.registerPlugin(ScrollTrigger)
  const root = document.documentElement
  const docTop = (el) => {
    let y = 0
    for (let n = el; n; n = n.offsetParent) y += n.offsetTop
    return y
  }
  // where each outgoing panel holds (tall ones by their foot, short ones centred or by
  // their top) and how far the incoming one is pulled up to be in place when it starts
  // one curtain, in screens of scroll: the outgoing panel rests, the next one slides over, then it rests
  const REST = 0.3
  const SLIDE = 1
  const SETTLE = 0.2 // REST + SLIDE + SETTLE = --swap-len in the stylesheet (150vh)
  const LEN = REST + SLIDE + SETTLE
  const measure = () => {
    const h = window.innerHeight
    pairs.forEach((p) => {
      const oh = p.out.offsetHeight
      p.stick = oh >= h ? h - oh : p.wrap.dataset.align === "center" ? (h - oh) / 2 : 0
      p.wrap.style.setProperty("--stick", `${p.stick}px`)
      p.wrap.nextElementSibling.style.setProperty("--pull", `${-(p.stick + oh + LEN * h)}px`)
    })
  }
  gsap.matchMedia().add(query, () => {
    root.classList.add("has-swap")
    measure()
    pairs.forEach((p) => {
      const dir = p.wrap.dataset.from === "right" ? -1 : 1 // +1: the next panel comes from the left
      const w = () => root.clientWidth
      p.trigger = gsap
        .timeline({
          defaults: { ease: "power1.inOut", duration: SLIDE },
          scrollTrigger: {
            trigger: p.wrap,
            start: () => docTop(p.wrap) - p.stick,
            end: () => `+=${LEN * window.innerHeight}`,
            scrub: 0.7,
            invalidateOnRefresh: true,
          },
        })
        .fromTo(p.into, { x: () => -dir * (w() + 6) }, { x: 0 }, REST) // 6px further out: its leading edge waits off screen
        .fromTo(
          p.out,
          { x: 0, clipPath: "inset(0px 0px 0px 0px)" },
          { x: () => dir * 0.25 * w(), clipPath: () => (dir > 0 ? `inset(0px 0px 0px ${0.75 * w()}px)` : `inset(0px ${0.75 * w()}px 0px 0px)`) },
          REST
        )
        .to({}, { duration: SETTLE }).scrollTrigger
    })
    // the feed grows when Instagram loads, the strip when its photos do
    let pending = 0
    let landing = null // the panel a link is taking the visitor to, until they scroll themselves
    const release = () => (landing = null)
    window.addEventListener("wheel", release, { passive: true })
    window.addEventListener("touchstart", release, { passive: true })
    window.addEventListener("keydown", release)
    const ro = new ResizeObserver(() => {
      clearTimeout(pending)
      pending = setTimeout(() => {
        measure()
        ScrollTrigger.refresh()
        // a link jump that the resize knocked off target goes on to where it meant to land
        if (landing) window.scrollTo({ top: landing.trigger.end, behavior: "smooth" })
      }, 150)
    })
    pairs.forEach((p) => ro.observe(p.out))
    // links to an incoming panel land where its curtain has closed, not where it opens
    const jump = (e) => {
      const a = e.target.closest('a[href^="#"]')
      const p = a && pairs.find((q) => `#${q.into.id}` === a.getAttribute("href"))
      if (!p || e.defaultPrevented) return
      e.preventDefault()
      history.pushState(null, "", a.getAttribute("href"))
      // the page can change height on the way (the feed loads): the resize handler re-aims
      landing = p
      window.scrollTo({ top: p.trigger.end, behavior: "smooth" })
    }
    document.addEventListener("click", jump, true) // capture: before the in-page settle sees the click
    return () => {
      ro.disconnect()
      document.removeEventListener("click", jump, true)
      ;["wheel", "touchstart", "keydown"].forEach((t) => window.removeEventListener(t, release))
      root.classList.remove("has-swap")
      pairs.forEach((p) => gsap.set([p.out, p.into], { clearProps: "transform,clipPath" }))
    }
  })
}

/* ------------------------------------------------------------------ */
/* About story (desktop): pinned by CSS sticky; the scroll, smoothed,  */
/* inks in each paragraph word by word, hands over to the next one,    */
/* and carries the photos along a curved diagonal in their frame.      */
/* ------------------------------------------------------------------ */
async function initAboutStory() {
  const stage = document.querySelector(".about-slider-stage")
  const query = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)"
  if (!stage) return
  if (!window.matchMedia(query).matches) {
    window.matchMedia(query).addEventListener("change", () => initAboutStory(), { once: true })
    return
  }
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
  gsap.registerPlugin(ScrollTrigger)
  const root = document.documentElement
  const slider = stage.parentElement
  const track = stage.querySelector(".story-track")
  const chapters = [...stage.querySelectorAll(".chapter")]

  // split the copy into words once, leaving the markup (bold names, sentence lines) as it is
  chapters.forEach((ch) => {
    const walker = document.createTreeWalker(ch, NodeFilter.SHOW_TEXT)
    const texts = []
    while (walker.nextNode()) if (!walker.currentNode.parentElement.closest("svg")) texts.push(walker.currentNode)
    texts.forEach((node) => {
      const frag = document.createDocumentFragment()
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return
        if (/^\s+$/.test(part)) return frag.append(part)
        const w = document.createElement("span")
        w.className = "w"
        w.textContent = part
        frag.append(w)
      })
      node.replaceWith(frag)
    })
  })

  gsap.matchMedia().add(query, () => {
    root.classList.add("has-story")
    const n = chapters.length
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: slider, start: "top top", end: "bottom bottom", scrub: 0.8, invalidateOnRefresh: true },
    })
    chapters.forEach((ch, k) => {
      const words = ch.querySelectorAll(".w")
      const guy = ch.querySelector(".slide-guy")
      // arrive (the first is already there), ink in, rest, leave (the last one stays)
      if (k > 0) tl.fromTo(ch, { autoAlpha: 0, y: 48 }, { autoAlpha: 1, y: 0, duration: 0.16, ease: "expo.out" }, k - 0.02)
      // every word is set pale up front (a staggered from-state only reaches the first word
      // before the scroll arrives), then inked in one after another
      gsap.set(words, { opacity: 0.14 })
      tl.to(words, { opacity: 1, duration: 0.08, stagger: { each: 0.5 / words.length } }, k + 0.06)
      // a figure above the copy drops in ahead of the lead line; one below rises once the copy has inked in
      if (guy) {
        const above = getComputedStyle(guy).order === "-1"
        tl.fromTo(
          guy,
          { autoAlpha: 0, y: above ? -90 : 90, rotate: above ? -28 : 22, scale: 0.7 },
          { autoAlpha: 1, y: 0, rotate: 0, scale: 1, duration: 0.24, ease: "back.out(1.7)" },
          above ? k + 0.02 : k + 0.5
        )
      }
      if (k < n - 1) {
        tl.to(ch, { autoAlpha: 0, y: -48, duration: 0.14, ease: "power2.in" }, k + 0.84)
      }
    })
    tl.to({}, { duration: 0.12 }) // a short rest on the last paragraph before the page moves on
    // The photos are a stack of cards. One rests in place; the next waits at the upper right
    // with its foot showing. Before a paragraph changes, the next card slides down the
    // diagonal and lands almost on top of the pile; once the new heading has inked in, the
    // old card slides out from underneath, down and to the left, and the pile settles.
    const vw = () => root.clientWidth / 100
    const vh = () => window.innerHeight / 100
    const photos = [...stage.querySelectorAll(".story-track .slide-photo")]
    const wait = { x: () => 17 * vw(), y: () => -66 * vh(), rotate: 2.5 } // foot showing, top right
    const far = { x: () => 36 * vw(), y: () => -140 * vh(), rotate: 5 } // further up the diagonal, out of sight
    const top = { x: () => 1.6 * vw(), y: () => -2.2 * vh(), rotate: 0.8 } // landed, a little off the pile
    const gone = { x: () => -24 * vw(), y: () => 104 * vh(), rotate: -5 } // out by the bottom left
    photos.forEach((ph, i) => gsap.set(ph, i === 0 ? { x: 0, y: 0, rotate: 0 } : i === 1 ? wait : far))
    for (let k = 0; k < n - 1; k++) {
      tl.to(photos[k + 1], { ...top, duration: 0.42, ease: "power3.out" }, k + 0.6) // deal the next card
      if (photos[k + 2]) tl.to(photos[k + 2], { ...wait, duration: 0.5, ease: "power2.out" }, k + 0.95) // the one after steps up to wait
      tl.to(photos[k], { ...gone, duration: 0.5, ease: "power2.in" }, k + 1.12) // the old one leaves from underneath
      tl.to(photos[k + 1], { x: 0, y: 0, rotate: 0, duration: 0.4, ease: "power2.inOut" }, k + 1.2) // the pile settles
    }
    // inside each frame the picture drifts slowly the whole time, so a resting card is never dead still
    photos.forEach((ph) => {
      tl.fromTo(ph.querySelector("img"), { scale: 1.16, yPercent: -5, xPercent: 3 }, { scale: 1.16, yPercent: 5, xPercent: -3, duration: tl.duration(), ease: "none" }, 0)
    })

    // photos lean away from the pointer and the text towards it, eased so they float instead of tracking
    gsap.set(stage, { "--mx": 0, "--my": 0 })
    const mx = gsap.quickTo(stage, "--mx", { duration: 0.9, ease: "power3.out" })
    const my = gsap.quickTo(stage, "--my", { duration: 0.9, ease: "power3.out" })
    const lean = (e) => {
      mx((e.clientX / window.innerWidth) * 2 - 1)
      my((e.clientY / window.innerHeight) * 2 - 1)
    }
    const level = () => {
      mx(0)
      my(0)
    }
    stage.addEventListener("pointermove", lean)
    stage.addEventListener("pointerleave", level)
    requestAnimationFrame(() => ScrollTrigger.refresh()) // the page just changed height: everything below re-measures
    return () => {
      stage.removeEventListener("pointermove", lean)
      stage.removeEventListener("pointerleave", level)
      root.classList.remove("has-story")
      gsap.set([...chapters, track, ...stage.querySelectorAll(".w, .slide-guy, .slide-photo, .slide-photo img")], { clearProps: "all" })
    }
  })
}

/* ------------------------------------------------------------------ */
/* In-page links: if lazy content shifted the page mid-scroll, settle   */
/* on the target once the scroll ends                                   */
/* ------------------------------------------------------------------ */
function initAnchorSettle() {
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented) return // handled elsewhere, e.g. the dock opening its card
    const a = e.target.closest('a[href^="#"]')
    const target = a && document.getElementById(a.getAttribute("href").slice(1))
    if (!target) return
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
    let tries = 0
    const settle = () => {
      const off = target.getBoundingClientRect().top - pad
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (Math.abs(off) > 8 && !atBottom && tries++ < 2) {
        window.scrollBy({ top: off, behavior: reduceMotion ? "auto" : "smooth" })
        wait()
      }
    }
    const wait = () => {
      if ("onscrollend" in window) window.addEventListener("scrollend", settle, { once: true })
      else setTimeout(settle, 900)
    }
    wait()
  })
}

/* ------------------------------------------------------------------ */
renderStatus()
setInterval(renderStatus, 60 * 1000)
initDock()
initBoom()
initWalkers()
initAnchorSettle()
initAboutStory()
initCurtains()
// Everything below the first screen waits for an idle moment so the poster paints first
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200))
idle(() => {
  initMenu()
  initLightbox()
  initLazyWidget()
  initDeal()
  initGallery()
}, { timeout: 1200 })

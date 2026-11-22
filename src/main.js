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
  // On the first screen the big hero links do this job; the dock takes over once they scroll away
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
/* BOOM sticker: tap to backspin                                        */
/* ------------------------------------------------------------------ */
function initBoom() {
  const boom = document.getElementById("boom")
  if (!boom) return
  boom.addEventListener("click", () => {
    if (boom.classList.contains("is-spinning")) return
    boom.classList.add("is-spinning")
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
  let ticking = false
  const update = () => {
    ticking = false
    const top = docTop(walkers) // layout position, unaffected by the walk itself
    const vh = window.innerHeight
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
/* In-page links: if lazy content shifted the page mid-scroll, settle   */
/* on the target once the scroll ends                                   */
/* ------------------------------------------------------------------ */
function initAnchorSettle() {
  document.addEventListener("click", (e) => {
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
// Everything below the first screen waits for an idle moment so the poster paints first
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200))
idle(() => {
  initMenu()
  initLightbox()
  initLazyWidget()
  initDeal()
  initGallery()
}, { timeout: 1200 })

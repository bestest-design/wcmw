// WCMW site behaviour: live open/closed status, menu rail scroll-spy,
// thumb dock, BOOM sticker and photo lightbox. Everything degrades to plain
// links and static text without JavaScript.

import { computeStatus, readHours, rigaNow } from "./status.mjs"

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* ------------------------------------------------------------------ */
/* Open / closed status, computed in Riga time from the hours list     */
/* ------------------------------------------------------------------ */
function renderStatus() {
  const hours = readHours()
  const now = rigaNow()
  const status = computeStatus(hours, now)
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
/* Menu rail: highlight the category in view, keep its chip visible    */
/* ------------------------------------------------------------------ */
function initMenuRail() {
  const rail = document.querySelector(".menu-rail")
  if (!rail) return
  const list = rail.querySelector("ul")
  const links = [...rail.querySelectorAll("a[data-cat]")]
  const cats = [...document.querySelectorAll(".menu-cat")]

  const setActive = (id) => {
    links.forEach((a) => {
      const on = a.dataset.cat === id
      if (on) {
        a.setAttribute("aria-current", "true")
        const left = a.offsetLeft - (list.clientWidth - a.offsetWidth) / 2
        list.scrollTo({ left, behavior: reduceMotion ? "auto" : "smooth" })
      } else {
        a.removeAttribute("aria-current")
      }
    })
  }

  // The category whose top has most recently passed under the rail is "current"
  let ticking = false
  const update = () => {
    ticking = false
    const line = rail.getBoundingClientRect().bottom + 24
    let current = cats[0]
    for (const cat of cats) {
      if (cat.getBoundingClientRect().top <= line) current = cat
    }
    if (current && current.dataset.cat !== rail.dataset.active) {
      rail.dataset.active = current.dataset.cat
      setActive(current.dataset.cat)
    }
    rail.classList.toggle("is-stuck", rail.getBoundingClientRect().top <= 0.5)
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
}

/* ------------------------------------------------------------------ */
/* Dock: appears after the hero, marks the section you are in          */
/* ------------------------------------------------------------------ */
function initDock() {
  const dock = document.querySelector(".dock")
  const hero = document.querySelector(".hero")
  if (!dock || !hero) return

  new IntersectionObserver(
    ([entry]) => dock.classList.toggle("is-visible", !entry.isIntersecting),
    { threshold: 0.35 }
  ).observe(hero)

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
/* BOOM sticker: tap to backspin (and buzz, where phones allow it)     */
/* ------------------------------------------------------------------ */
function initBoom() {
  const boom = document.getElementById("boom")
  if (!boom) return
  boom.addEventListener("click", () => {
    if (boom.classList.contains("is-spinning")) return
    boom.classList.add("is-spinning")
    if (navigator.vibrate) navigator.vibrate(200)
    setTimeout(() => boom.classList.remove("is-spinning"), reduceMotion ? 50 : 3100)
  })
}

/* ------------------------------------------------------------------ */
/* Lightbox for the photo strip                                         */
/* ------------------------------------------------------------------ */
function initLightbox() {
  const box = document.getElementById("lightboxOverlay")
  const img = document.getElementById("lightboxImage")
  const close = box?.querySelector(".lightbox-close")
  if (!box || !img || !close) return
  let opener = null

  const open = (src, alt, from) => {
    opener = from
    img.src = src
    img.alt = alt
    box.setAttribute("aria-hidden", "false")
    box.classList.add("is-open")
    document.documentElement.style.overflow = "hidden"
    close.focus()
  }
  const shut = () => {
    if (!box.classList.contains("is-open")) return
    box.classList.remove("is-open")
    box.setAttribute("aria-hidden", "true")
    document.documentElement.style.overflow = ""
    opener?.focus()
  }

  document.querySelectorAll("img[data-lightbox]").forEach((el) => {
    el.tabIndex = 0
    el.setAttribute("role", "button")
    const go = () => open(el.dataset.full || el.currentSrc || el.src, el.alt, el)
    el.addEventListener("click", go)
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        go()
      }
    })
  })
  close.addEventListener("click", shut)
  box.addEventListener("click", (e) => {
    if (e.target === box) shut()
  })
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") shut()
  })
}

/* ------------------------------------------------------------------ */
renderStatus()
setInterval(renderStatus, 60 * 1000)
initMenuRail()
initDock()
initBoom()
initLightbox()

// Hero entrance plays once, after fonts are in so the spring lands on real glyphs
const hero = document.querySelector(".hero")
if (hero && !reduceMotion) {
  ;(document.fonts?.ready ?? Promise.resolve()).then(() => hero.classList.add("is-ready"))
}

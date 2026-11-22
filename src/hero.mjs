// Hero spring: scrolling stretches it, and the record can be pulled sideways;
// on release it snaps back with a damped spring (and a boing, if sound is on).
// Everything is expressed as --reveal (in hero --u units) on the .hero element.
import { boing } from "./sound.mjs"

const MAX_SCROLL = 38 // u revealed by scrolling through the hero
const MAX_PULL = 46 // u the record can be dragged

export function initHero(hero, { reduceMotion }) {
  const listener = hero.querySelector("[data-pull]")
  const probe = hero.querySelector(".hero-probe")
  if (!listener || !probe) return

  let u = 4
  const measure = () => (u = probe.getBoundingClientRect().width / 100 || 4)
  measure()
  window.addEventListener("resize", measure, { passive: true })

  let scrollPart = 0
  let pull = 0 // u
  let velocity = 0
  let dragging = false
  let raf = 0

  const paint = () => hero.style.setProperty("--reveal", (scrollPart + pull).toFixed(2))

  // Scroll: 0 at the top, MAX_SCROLL once the hero is 75% scrolled away
  if (!reduceMotion) {
    let ticking = false
    const onScroll = () => {
      ticking = false
      const progress = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * 0.75)))
      scrollPart = progress * MAX_SCROLL
      paint()
    }
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true
          requestAnimationFrame(onScroll)
        }
      },
      { passive: true }
    )
    onScroll()
  }

  // Damped spring back to rest after a pull
  const springBack = () => {
    cancelAnimationFrame(raf)
    if (reduceMotion) {
      pull = 0
      paint()
      return
    }
    let last = performance.now()
    const step = (now) => {
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      const k = 210 // stiffness
      const c = 9 // damping
      velocity += (-k * pull - c * velocity) * dt
      pull += velocity * dt
      paint()
      if (Math.abs(pull) > 0.05 || Math.abs(velocity) > 0.5) raf = requestAnimationFrame(step)
      else {
        pull = 0
        velocity = 0
        paint()
      }
    }
    raf = requestAnimationFrame(step)
  }

  let startX = 0
  let startPull = 0
  listener.addEventListener("pointerdown", (e) => {
    dragging = true
    cancelAnimationFrame(raf)
    startX = e.clientX
    startPull = pull
    velocity = 0
    listener.setPointerCapture(e.pointerId)
  })
  listener.addEventListener("pointermove", (e) => {
    if (!dragging) return
    const dx = (e.clientX - startX) / u
    // rubber band: easy at first, stiffer towards the end
    const raw = Math.max(-6, startPull + dx)
    pull = raw > 0 ? MAX_PULL * (1 - Math.exp(-raw / MAX_PULL)) : raw
    paint()
  })
  const release = () => {
    if (!dragging) return
    dragging = false
    if (Math.abs(pull) > 2) {
      hero.classList.add("has-pulled")
      boing(Math.min(1, Math.abs(pull) / MAX_PULL))
      hero.dispatchEvent(new CustomEvent("wcmw:pulled"))
    }
    springBack()
  }
  listener.addEventListener("pointerup", release)
  listener.addEventListener("pointercancel", release)
}

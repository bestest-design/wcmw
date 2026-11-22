// Tiny Web Audio kit for the listening bar: everything is synthesised, no audio files.
// Sound is off until the visitor turns it on (choice remembered on this device).

let ctx = null
let enabled = false
const KEY = "wcmw-sound"

const audio = () => {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === "suspended") ctx.resume()
  return ctx
}

export const soundOn = () => enabled

export function setSound(on) {
  enabled = on
  try {
    localStorage.setItem(KEY, on ? "1" : "0")
  } catch {}
  if (on) needleDrop()
}

export function storedSound() {
  try {
    return localStorage.getItem(KEY) === "1"
  } catch {
    return false
  }
}

const noiseBuffer = (c, seconds, fill) => {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = fill(i, data.length)
  return buf
}

/** Vinyl needle drop: a soft thump, then a second of crackle. */
export function needleDrop() {
  if (!enabled) return
  const c = audio()
  if (!c) return
  const t = c.currentTime
  const thump = c.createOscillator()
  const tg = c.createGain()
  thump.frequency.setValueAtTime(90, t)
  thump.frequency.exponentialRampToValueAtTime(40, t + 0.12)
  tg.gain.setValueAtTime(0.35, t)
  tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
  thump.connect(tg).connect(c.destination)
  thump.start(t)
  thump.stop(t + 0.2)

  const crackle = c.createBufferSource()
  crackle.buffer = noiseBuffer(c, 1.4, () => (Math.random() < 0.0016 ? (Math.random() * 2 - 1) * 0.9 : (Math.random() * 2 - 1) * 0.02))
  const hp = c.createBiquadFilter()
  hp.type = "highpass"
  hp.frequency.value = 900
  const cg = c.createGain()
  cg.gain.setValueAtTime(0.5, t + 0.05)
  cg.gain.linearRampToValueAtTime(0, t + 1.4)
  crackle.connect(hp).connect(cg).connect(c.destination)
  crackle.start(t + 0.05)
}

/** Spring release: a wobbling boing, louder the further it was pulled (0..1). */
export function boing(strength = 1) {
  if (!enabled) return
  const c = audio()
  if (!c) return
  const t = c.currentTime
  const o = c.createOscillator()
  const g = c.createGain()
  const lfo = c.createOscillator()
  const lg = c.createGain()
  o.type = "triangle"
  o.frequency.setValueAtTime(260 + 140 * strength, t)
  o.frequency.exponentialRampToValueAtTime(70, t + 0.55)
  lfo.frequency.value = 16
  lg.gain.value = 30 * strength
  lfo.connect(lg).connect(o.frequency)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.28 * Math.max(0.3, strength), t + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
  o.connect(g).connect(c.destination)
  o.start(t)
  lfo.start(t)
  o.stop(t + 0.75)
  lfo.stop(t + 0.75)
}

/** Record scratch for the BOOM sticker's backspin. */
export function scratch() {
  if (!enabled) return
  const c = audio()
  if (!c) return
  const t = c.currentTime
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, 0.7, () => Math.random() * 2 - 1)
  const bp = c.createBiquadFilter()
  bp.type = "bandpass"
  bp.Q.value = 6
  bp.frequency.setValueAtTime(400, t)
  bp.frequency.exponentialRampToValueAtTime(2400, t + 0.16)
  bp.frequency.exponentialRampToValueAtTime(300, t + 0.34)
  bp.frequency.exponentialRampToValueAtTime(1800, t + 0.5)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.4, t + 0.03)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65)
  src.connect(bp).connect(g).connect(c.destination)
  src.start(t)
}

/** Bottle glug for the Deal puddle: three falling bubbles. */
export function glug() {
  if (!enabled) return
  const c = audio()
  if (!c) return
  const t = c.currentTime
  ;[0, 0.16, 0.3].forEach((d, i) => {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = "sine"
    o.frequency.setValueAtTime(520 - i * 90, t + d)
    o.frequency.exponentialRampToValueAtTime(180 - i * 30, t + d + 0.12)
    g.gain.setValueAtTime(0.0001, t + d)
    g.gain.exponentialRampToValueAtTime(0.22, t + d + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.14)
    o.connect(g).connect(c.destination)
    o.start(t + d)
    o.stop(t + d + 0.16)
  })
}

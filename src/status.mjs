// Open/closed status for the hours list, in Riga time. Pure functions so
// scripts/verify.mjs can test them without a browser.

const DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

export function readHours(root = document) {
  // day 1..7 -> { open, close } in minutes; close past midnight becomes > 1440
  const hours = {}
  root.querySelectorAll("[data-hours] li[data-open]").forEach((li) => {
    const open = toMinutes(li.dataset.open)
    let close = toMinutes(li.dataset.close)
    if (close <= open) close += 24 * 60
    hours[Number(li.dataset.day)] = { open, close }
  })
  return hours
}

export function rigaNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Riga",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const get = (type) => parts.find((p) => p.type === type).value
  const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday")) + 1
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) }
}

const clock = (minutes) => {
  const m = minutes % (24 * 60)
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
}

export function computeStatus(hours, { day, minutes }) {
  const today = hours[day]
  const yesterday = hours[day === 1 ? 7 : day - 1]

  if (yesterday && yesterday.close > 24 * 60 && minutes < yesterday.close - 24 * 60) {
    return { open: true, text: `open now, until ${clock(yesterday.close)}.` }
  }
  if (today && minutes >= today.open && minutes < today.close) {
    return { open: true, text: `open now, until ${clock(today.close)}.` }
  }
  if (today && minutes < today.open) {
    return { open: false, text: `closed now. opens today at ${clock(today.open)}.` }
  }
  for (let i = 1; i <= 7; i++) {
    const d = ((day - 1 + i) % 7) + 1
    if (hours[d]) {
      const when = i === 1 ? "tomorrow" : DAY_NAMES[d - 1]
      return { open: false, text: `closed now. opens ${when} at ${clock(hours[d].open)}.` }
    }
  }
  return { open: false, text: "closed now." }
}


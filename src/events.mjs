// Build-time import of WCMW's events from Resident Advisor (promoter 187972).
// The bar posts its nights on RA only; this pulls them into the page as plain HTML
// (crawlable, styled like the site) plus schema.org Event data. If RA can't be
// reached, the page falls back to RA's own widget, so a build never breaks.
// Used by vite.config.mjs; the deploy workflow also rebuilds on a schedule so new
// RA events appear without anyone touching the site.

const PROMOTER = "187972"
const RA = "https://ra.co"
const QUERY = `query WCMW_EVENTS($filters:[FilterInput],$pageSize:Int,$sortOrder:FilterSortOrderType){
  listing(indices:[EVENT],filters:$filters,pageSize:$pageSize,page:1,sortField:DATE,sortOrder:$sortOrder,aggregations:[]){
    data{...on Event{id title date startTime endTime contentUrl isTicketed genres{name} artists{name} images{filename type}}}
  }
}`

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

async function listing(range, sortOrder, pageSize) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(`${RA}/graphql`, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        Referer: `${RA}/promoters/${PROMOTER}`,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
      },
      body: JSON.stringify({
        query: QUERY,
        variables: {
          filters: [
            { type: "PROMOTER", value: PROMOTER },
            { type: "DATERANGE", value: JSON.stringify(range) },
          ],
          pageSize,
          sortOrder,
        },
      }),
    })
    if (!res.ok) throw new Error(`RA ${res.status}`)
    const json = await res.json()
    if (json.errors?.length) throw new Error(`RA: ${json.errors[0].message}`)
    const listing = json?.data?.listing
    if (!listing) throw new Error("RA: no listing in the response")
    return Array.isArray(listing.data) ? listing.data : [] // RA sends data: null when nothing is listed
  } finally {
    clearTimeout(timer)
  }
}

/** { upcoming, recent } from RA, or null when RA can't be reached. */
export async function fetchRaEvents(now = new Date()) {
  try {
    const iso = now.toISOString()
    const [upcoming, recent] = await Promise.all([
      listing({ gte: iso }, "ASCENDING", 12),
      listing({ lte: iso }, "DESCENDING", 5),
    ])
    return { upcoming, recent }
  } catch (err) {
    console.warn(`[wcmw] RA events not imported (${err.message}); using RA's widget instead`)
    return null
  }
}

// RA times are Riga local time without an offset ("2026-11-20T21:00:00.000")
const rigaOffset = (local) => {
  const probe = new Date(`${local.slice(0, 19)}Z`)
  const name = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Riga", timeZoneName: "longOffset" })
    .formatToParts(probe)
    .find((p) => p.type === "timeZoneName")?.value
  return (name || "GMT+02:00").replace("GMT", "")
}
const withOffset = (local) => (local ? `${local.slice(0, 19)}${rigaOffset(local)}` : undefined)

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const dayLabel = (local) => {
  const d = new Date(`${local.slice(0, 10)}T12:00:00Z`)
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

const item = (e, upcoming) => {
  const url = RA + e.contentUrl
  const artists = (e.artists || []).map((a) => a.name).filter(Boolean)
  const genres = (e.genres || []).map((g) => g.name).filter(Boolean)
  const time = (e.startTime || e.date).slice(0, 16)
  const meta = [
    artists.length && `<span class="ev-artists">${esc(artists.join(", "))}</span>`,
    genres.length && `<span class="ev-genres">${esc(genres.join(", ").toLowerCase())}</span>`,
  ]
    .filter(Boolean)
    .join("")
  const cta = upcoming ? `<span class="ev-cta">${e.isTicketed ? "Tickets on RA" : "Details on RA"}</span>` : ""
  return `<li class="ev-item"><a class="ev-link" href="${esc(url)}"><time class="ev-date" datetime="${esc(time)}">${esc(dayLabel(time))}</time><span class="ev-body"><span class="ev-title">${esc(e.title)}</span>${meta ? `<span class="ev-meta">${meta}</span>` : ""}</span>${cta}</a></li>`
}

/** The events list for the page; RA's widget when there is no imported data. */
export function renderEvents(data) {
  if (!data) return RA_WIDGET
  const next = data.upcoming.length
    ? `<h3 class="ev-head">Coming up</h3><ol class="ev-list">${data.upcoming.map((e) => item(e, true)).join("")}</ol>`
    : `<p class="ev-empty">No new dates announced yet.</p>`
  const past = data.recent.length
    ? `<h3 class="ev-head">Recently at WCMW</h3><ol class="ev-list ev-list--past">${data.recent.map((e) => item(e, false)).join("")}</ol>`
    : ""
  return `<div class="ev" data-source="ra">${next}${past}</div>`
}

/** schema.org Event objects for the bar's structured data. */
export function eventsJsonLd(data, place) {
  if (!data) return []
  return [...data.upcoming, ...data.recent].map((e) => {
    const flyer = (e.images || []).find((i) => i.type === "FLYERFRONT")?.filename
    const ev = {
      "@type": "MusicEvent",
      name: e.title,
      url: RA + e.contentUrl,
      startDate: withOffset(e.startTime || e.date),
      endDate: withOffset(e.endTime),
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: place,
      organizer: { "@type": "Organization", name: "WCMW", url: "https://wcmw.bar/" },
    }
    const artists = (e.artists || []).map((a) => ({ "@type": "Person", name: a.name }))
    if (artists.length) ev.performer = artists
    const genres = (e.genres || []).map((g) => g.name)
    if (genres.length) ev.keywords = genres.join(", ")
    if (flyer) ev.image = flyer
    if (e.isTicketed) ev.offers = { "@type": "Offer", url: RA + e.contentUrl, availability: "https://schema.org/InStock" }
    return ev
  })
}

/** Plain-text lines for llms.txt. */
export function eventsText(data) {
  if (!data) return [`Events are listed on Resident Advisor: ${RA}/promoters/${PROMOTER}`]
  const line = (e) => {
    const artists = (e.artists || []).map((a) => a.name).join(", ")
    const genres = (e.genres || []).map((g) => g.name).join(", ")
    return `- ${(e.startTime || e.date).slice(0, 10)}: ${e.title}${artists ? ` (${artists})` : ""}${genres ? `, ${genres}` : ""}: ${RA}${e.contentUrl}`
  }
  return [
    data.upcoming.length ? "Coming up:" : "No upcoming dates announced yet.",
    ...data.upcoming.map(line),
    ...(data.recent.length ? ["Recently:", ...data.recent.map(line)] : []),
    `All events: ${RA}/promoters/${PROMOTER}`,
  ]
}

const RA_WIDGET = `<div class="events-shell">
      <p class="events-loading" aria-hidden="true">loading line-ups from Resident Advisor.</p>
      <iframe class="events-frame" src="https://ra.co/promoters/187972/widget/events?theme=light&amp;transparentBackground=true&amp;customTextColor=%23000000"
        title="WCMW events on Resident Advisor" loading="lazy"
        height="650" width="100%" onload="this.parentNode.classList.add('is-loaded')"></iframe>
      </div>`

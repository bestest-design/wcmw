import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import mkcert from 'vite-plugin-mkcert'
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { renderMenuRail, renderMenuBody, renderMenuVisual, menuJsonLd } from './src/menu.render.mjs';
import { fetchRaEvents, renderEvents, eventsJsonLd, eventsText } from './src/events.mjs';
import { execSync } from 'child_process';
import { about, goodToKnow } from './src/about.copy.mjs';

// Inlines the bar menu (src/menu.data.mjs) and SVG partials into index.html at build/dev time.
// Zigzag sampled along a centreline so the spring bends smoothly.
// `segments` is a list of ['line', x0, y0, x1, y1] or ['arc', cx, cy, r, a0, a1] (radians).
const springAlong = (segments, { half = 3, amp = 5 } = {}) => {
  const pieces = segments.map((sg) => {
    if (sg[0] === 'line') {
      const [, x0, y0, x1, y1] = sg;
      const len = Math.hypot(x1 - x0, y1 - y0);
      return { len, at: (t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t], tan: () => [(x1 - x0) / len, (y1 - y0) / len] };
    }
    const [, cx, cy, r, a0, a1] = sg;
    return {
      len: Math.abs(a1 - a0) * r,
      at: (t) => [cx + r * Math.cos(a0 + (a1 - a0) * t), cy + r * Math.sin(a0 + (a1 - a0) * t)],
      tan: (t) => { const a = a0 + (a1 - a0) * t, sgn = Math.sign(a1 - a0); return [-Math.sin(a) * sgn, Math.cos(a) * sgn]; },
    };
  });
  const total = pieces.reduce((n, p) => n + p.len, 0);
  const pts = [];
  for (let d = 0, i = 0; d <= total + 0.001; d += half, i++) {
    let rest = d, p = pieces[0];
    for (const q of pieces) { p = q; if (rest <= q.len) break; rest -= q.len; }
    const t = Math.min(1, rest / p.len);
    const [x, y] = p.at(t);
    const [tx, ty] = p.tan(t);
    const off = i === 0 ? 0 : (i % 2 ? amp : -amp);
    pts.push([x + ty * off, y - tx * off]);
  }
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join('');
};

// Section rule: a coil with a fixed period (the box is sliced, never stretched),
// the brandbook's WCMWWWW spring. It draws itself on scroll.
const rule = () => {
  const d = springAlong([['line', 0, 12, 2600, 12]], { half: 7, amp: 8 });
  return `<div class="coil-rule" aria-hidden="true"><svg viewBox="0 0 2600 24" preserveAspectRatio="xMinYMid slice" focusable="false"><path d="${d}" pathLength="1" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
};

const SITE = 'https://wcmw.bar/';

// RA events: fetched once per build (cached for 15 minutes in dev)
let eventsCache = null;
const raEvents = () => {
  if (!eventsCache || Date.now() - eventsCache.at > 15 * 60 * 1000) eventsCache = { at: Date.now(), data: fetchRaEvents() };
  return eventsCache.data;
};

// Intrinsic size of local images, so the browser reserves their space before they load
const imageSize = (file) => {
  const full = path.resolve('public', file);
  if (!fs.existsSync(full)) return null;
  if (file.endsWith('.svg')) {
    const vb = /viewBox="\s*[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(fs.readFileSync(full, 'utf8'));
    return vb ? [Math.round(+vb[1]), Math.round(+vb[2])] : null;
  }
  if (file.endsWith('.webp')) {
    const b = fs.readFileSync(full);
    const fmt = b.toString('ascii', 12, 16);
    if (fmt === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (fmt === 'VP8L') { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >>> 14) & 0x3fff) + 1]; }
    if (fmt === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  }
  return null;
};
const sizeImages = (html) =>
  html.replace(/<img\b[^>]*>/g, (tag) => {
    if (/\swidth=/.test(tag)) return tag;
    const src = /\ssrc="\.\/([^"]+)"/.exec(tag);
    const size = src && imageSize(src[1]);
    return size ? tag.replace('<img', `<img width="${size[0]}" height="${size[1]}"`) : tag;
  });

const loadMenu = async () => {
  const dataUrl = pathToFileURL(path.resolve('src/menu.data.mjs')).href;
  return (await import(/* @vite-ignore */ `${dataUrl}?t=${Date.now()}`)).default;
};
const readLd = (html) => JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1]);

let pagePhotos = [];

const wcmwHtml = () => ({
  name: 'wcmw-html',
  async transformIndexHtml(html) {
    const menu = await loadMenu();
    const events = await raEvents();
    const svg = (file) => fs.readFileSync(path.resolve('public/img', file), 'utf8').trim();
    let out = html
      .replace('<!-- MENU_RAIL -->', renderMenuRail(menu))
      .replace('<!-- MENU_VISUAL -->', renderMenuVisual(menu))
      .replace('<!-- MENU_BODY -->', renderMenuBody(menu))
      .replace(/<!-- EVENTS:[^>]*-->/, renderEvents(events))
      .replace(/<!-- ABOUT:(\d) -->/g, (_, n) => about[n - 1])
      .replace('<!-- GOOD_TO_KNOW -->', `<dl class="know">${goodToKnow.map(({ q, a }) => `<div><dt>${q}</dt><dd>${a}</dd></div>`).join('')}</dl>`)
      .replaceAll('<!-- RULE -->', rule())
      .replace(/<!-- SVG:([\w.-]+) -->/g, (_, file) => svg(file));

    // Structured data: the full drinks menu and the RA events join the bar's details
    const ld = readLd(out);
    ld.hasMenu = menuJsonLd(menu, `${SITE}#drinks`);
    const place = { '@type': 'Place', name: 'WCMW', address: ld.address, geo: ld.geo };
    const evs = eventsJsonLd(events, place);
    if (evs.length) ld.event = evs;
    out = out.replace(/(<script type="application\/ld\+json">)[\s\S]*?(<\/script>)/, (_, a, b) => a + JSON.stringify(ld).replace(/</g, '\\u003c') + b);

    pagePhotos = [...new Set([...out.matchAll(/\.\/(pics\/opt\/[\w-]+-1280\.webp)/g)].map((m) => m[1]))];
    return sizeImages(out);
  },
  // sitemap.xml and llms.txt are generated from the same data as the page
  async generateBundle() {
    const menu = await loadMenu();
    const events = await raEvents();
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
    const ld = readLd(html);
    let lastmod = new Date().toISOString().slice(0, 10);
    try { lastmod = execSync('git log -1 --format=%cs', { encoding: 'utf8' }).trim() || lastmod; } catch {}
    const photos = pagePhotos.length ? pagePhotos : fs.readdirSync('public/pics/opt').filter((f) => f.endsWith('-1280.webp')).map((f) => `pics/opt/${f}`);
    this.emitFile({
      type: 'asset',
      fileName: 'sitemap.xml',
      source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE}</loc>
    <lastmod>${lastmod}</lastmod>
${photos.map((p) => `    <image:image><image:loc>${SITE}${p}</image:loc></image:image>`).join('\n')}
  </url>
</urlset>
`,
    });
    this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsText(menu, ld, events) });
  },
});

// llms.txt: a plain summary for AI assistants (https://llmstxt.org)
const llmsText = (menu, ld, events) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const open = Object.fromEntries(ld.openingHoursSpecification.map((o) => [o.dayOfWeek, `${o.opens}-${o.closes}`]));
  const hours = days.map((d) => `${d} ${open[d] || 'closed'}`).join('; ');
  const a = ld.address;
  const lines = [
    `# WCMW, When Coffee Meets Whisky`,
    ``,
    `> ${ld.description}`,
    ``,
    `- Address: ${a.streetAddress}, ${a.addressLocality}, ${a.postalCode}, Latvia (central Riga)`,
    `- Opening hours: ${hours}`,
    `- Phone: ${ld.telephone}; email: ${ld.email}`,
    `- Website: ${SITE}; drinks menu: ${SITE}#drinks`,
    `- Instagram: https://instagr.am/wcmw.bar; events: https://ra.co/promoters/187972`,
    `- Prices in euros. Spirits by the 50ml pour or by the bottle.`,
    ``,
    `## About`,
    ``,
    ...about.map((p) => p.replace(/<[^>]+>/g, '') + '\n'),
    `## Good to know`,
    ``,
    ...goodToKnow.map(({ q, a }) => `- ${q}: ${a}`),
    ``,
  ];
  for (const c of menu.categories) {
    for (const sec of c.sections) {
      const name = sec.plain || sec.title || c.label;
      lines.push(`## ${name}${sec.unit ? ` (${sec.unit})` : ''}`, '');
      for (const it of sec.items) {
        const detail = [it.desc, it.sub].filter(Boolean).join('; ');
        lines.push(`- ${it.name}${it.price ? `: ${it.price.replace('-/', 'bottle only, ').replace('/', ' / ')} EUR` : ''}${detail ? ` (${detail})` : ''}`);
      }
      lines.push('');
    }
  }
  lines.push(`## ${menu.deal.name}`, '', menu.deal.desc, '', '## Events', '', ...eventsText(events), '');
  return lines.join('\n');
};

let DEV_DOMAIN = 'wcmw.dev';

// Prevent lookup_orig from being overwritten when it is already defined
if (dns.lookup_orig === undefined) {
    // Save the original lookup function
    dns.lookup_orig = dns.lookup;
}

// https://nodejs.org/api/dns.html#dnslookuphostname-options-callback
const customLookup = (hostname, options, callback) => {
    if (hostname === DEV_DOMAIN) {
        const address = '0.0.0.0';
        if (typeof options === 'function') {
            // If options is omitted and callback is provided directly
            callback = options;
        }
        callback(null, address, 4);
    } else {
        // Forward other DNS queries to the original lookup function
        dns.lookup_orig(hostname, options, callback);
    }
}

// Override the built-in lookup function
dns.lookup = customLookup;

export default defineConfig({
  base: "./",
  server: {
    host: DEV_DOMAIN,
    https: true,
    port: 443,
  },
  build: {
    outDir: "_site",
  },
  plugins: [
    mkcert(),
    wcmwHtml(),
    viteStaticCopy({
      targets: [
        { src: "robots.txt", dest: "." },
        { src: "404.html", dest: "." },
      ],
    }),
  ],
});

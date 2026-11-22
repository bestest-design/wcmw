import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import mkcert from 'vite-plugin-mkcert'
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { renderMenuRail, renderMenuBody, renderMenuVisual } from './src/menu.render.mjs';

// Inlines the bar menu (src/menu.data.mjs) and SVG partials into index.html at build/dev time.
// Zigzag "spring" from the brandbook (WCM + coil): round-capped, BoldBold stroke weight.
// viewBox units: 100 = 1em tall, one period = 44 units.
const zigzag = (periods = 70) => {
  const p = 44, top = 12, bottom = 88;
  // starts at the top, so the first stroke continues the M's right stem like a W
  let d = `M0 ${top}`;
  for (let i = 0; i < periods; i++) d += `L${i * p + p / 2} ${bottom}L${(i + 1) * p} ${top}`;
  const w = periods * p;
  return `<svg class="coil-svg" viewBox="0 0 ${w} 100" width="${w / 100}em" height="1em" aria-hidden="true" focusable="false"><path d="${d}" fill="none" stroke="currentColor" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
};

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

// Mobile hero spring: drops out of the "W" of WCM, bends in one smooth curve and runs
// right into the record (centre line y = 36). viewBox units = hero --u units.
const coilL = () => {
  const d = springAlong([
    ['line', 12, 0, 12, 22],
    ['arc', 26, 22, 14, Math.PI, Math.PI / 2],
    ['line', 26, 36, 108, 36],
  ], { half: 3, amp: 5 });
  return `<svg class="coil-l-svg" viewBox="0 -2 100 46" aria-hidden="true" focusable="false"><path d="${d}" pathLength="1" fill="none" stroke="currentColor" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
};

// The poster's second motif: the W bursts into a bold jagged zigzag that lands on "HISKYYYY".
const burst = () => {
  const pts = [[4, 6], [46, 16], [10, 34], [60, 44], [22, 62], [70, 70], [46, 86], [78, 90]];
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('');
  return `<svg class="burst-svg" viewBox="-4 0 88 96" aria-hidden="true" focusable="false"><path d="${d}" pathLength="1" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
};

// Section rule: a coil with a fixed period (the box is sliced, never stretched),
// same stroke-to-amplitude ratio as the hero spring. It draws itself on scroll.
const rule = () => {
  const d = springAlong([['line', 0, 12, 2600, 12]], { half: 7, amp: 8 });
  return `<div class="coil-rule" aria-hidden="true"><svg viewBox="0 0 2600 24" preserveAspectRatio="xMinYMid slice" focusable="false"><path d="${d}" pathLength="1" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
};

const wcmwHtml = () => ({
  name: 'wcmw-html',
  async transformIndexHtml(html) {
    const dataUrl = pathToFileURL(path.resolve('src/menu.data.mjs')).href;
    const { default: menu } = await import(/* @vite-ignore */ `${dataUrl}?t=${Date.now()}`);
    const svg = (file) => fs.readFileSync(path.resolve('public/img', file), 'utf8').trim();
    return html
      .replace('<!-- MENU_RAIL -->', renderMenuRail(menu))
      .replace('<!-- MENU_VISUAL -->', renderMenuVisual(menu))
      .replace('<!-- MENU_BODY -->', renderMenuBody(menu))
      .replace('<!-- ZIGZAG -->', zigzag())
      .replace('<!-- COIL_L -->', coilL())
      .replace('<!-- BURST -->', burst())
      .replaceAll('<!-- RULE -->', rule())
      .replace(/<!-- SVG:([\w.-]+) -->/g, (_, file) => svg(file));
  },
});

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

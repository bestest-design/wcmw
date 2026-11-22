import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import mkcert from 'vite-plugin-mkcert'
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { renderMenuRail, renderMenuBody, renderMenuVisual } from './src/menu.render.mjs';

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

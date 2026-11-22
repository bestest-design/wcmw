import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import mkcert from 'vite-plugin-mkcert'
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { renderMenu } from './src/menu.render.mjs';

// Inlines the bar menu (src/menu.data.mjs) and SVG partials into index.html at build/dev time.
// Zigzag "spring" from the brandbook (WCM + coil): round-capped, BoldBold stroke weight.
// viewBox units: 100 = 1em tall, one period = 44 units.
const zigzag = (periods = 70) => {
  const p = 44, top = 12, bottom = 88;
  let d = `M0 ${bottom}`;
  for (let i = 0; i < periods; i++) d += `L${i * p + p / 2} ${top}L${(i + 1) * p} ${bottom}`;
  const w = periods * p;
  return `<svg class="coil-svg" viewBox="0 0 ${w} 100" width="${w / 100}em" height="1em" aria-hidden="true" focusable="false"><path d="${d}" fill="none" stroke="currentColor" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
};

const wcmwHtml = () => ({
  name: 'wcmw-html',
  async transformIndexHtml(html) {
    const dataUrl = pathToFileURL(path.resolve('src/menu.data.mjs')).href;
    const { default: menu } = await import(/* @vite-ignore */ `${dataUrl}?t=${Date.now()}`);
    const svg = (file) => fs.readFileSync(path.resolve('public/img', file), 'utf8').trim();
    return html
      .replace('<!-- MENU -->', renderMenu(menu))
      .replace('<!-- ZIGZAG -->', zigzag())
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

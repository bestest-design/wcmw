import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import mkcert from 'vite-plugin-mkcert'
import dns from 'dns';

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
    viteStaticCopy({
      targets: [
        { src: "robots.txt", dest: "." },
        { src: "404.html", dest: "." },
      ],
    }),
  ],
});

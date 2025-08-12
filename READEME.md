<h1 align="center">
 <img
  width="180"
  alt="ESP Reactle"
  src="src\favicon.svg">
    <br/>
    ESP Reactle
</h1>

<h4 align="center">
 I wanted a friendly replacement for the adafruit wordle clone and be able to upload it using drag and drop through circuit python.
</h4>

<p align="center">
 <strong>
  <a href="#quick-start">Getting started</a>
 </strong>
</p>
<p align="center">
 <a href="https://opensource.org/licenses/Apache-2.0" target="_blank"><img
  alt="License: Apache 2"
  src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"></a>
 <a href="https://discord.gg/eNKquhG" target="_blank"><img
  alt="Discord chat"
  src="https://img.shields.io/discord/324774009847808000?color=%235865f2&label=Discord&style=flat"></a>
 <a href="https://github.com/awesome-selfhosted/awesome-selfhosted" target="_blank"><img
  alt="Awesome"
  src="https://cdn.rawgit.com/sindresorhus/awesome/d7305f38d29fed78fa85652e3a63e154dd8e8829/media/badge.svg"></a>
</p>


## Table of Contents

- [Quick Start](#quick-start)
- [From Scratch](#from-scratch)
- [Configuration](#configuration)
- [File Structure](#on-device-file-structure)

## Intro

Inspired by a port of wordle on [adafruit](https://learn.adafruit.com/wordle-personal-esp32-s2-web-server/create-the-web-server) with broken link and github user [rabinkaspal](https://github.com/rabinkaspal/react-wordle). We have simple vite react wordle clone with chunking enabled; 

## Quick Start
```bash
# clone project
gh repo clone FriendlyNGeeks/esp-reactle
# install dependancies
npm install
# run local test server
npm run dev
# build for deployment(esp32)
npm run build
```

## From Scratch
[Template Examples](https://vite.dev/guide/#scaffolding-your-first-vite-project)
```bash
# scaffolding
npm create vite@latest my-vue-app -- --template preact
```

## Configuration

`\circuitpy\config.json` **MODE** [WIFI/AP] swaps between connecting to existing network and AD-HOC(Stand-alone)

`App.css` contains stylization for the entire app.

`\src\data\dictionary.js` contains all words and definitions (trimmed for chunk size to fit esp32)

`vite.config.ts` contains [splitVendorChunkPlugin](https://v3.vitejs.dev/guide/build.html#chunking-strategy) `rollupOptions` **REQUIRED**, which splits node_modules, components, hooks, views, and data files to keep them small enough to upload to an ESP32 chip with 8MB Flash. 

- vite.config.ts
```ts
import { defineConfig, splitVendorChunkPlugin } from "vite";
import preact from "@preact/preset-vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), splitVendorChunkPlugin()],
  build:{
    emptyOutDir: true,
    manifest: true,
    minify: true,
    polyfillModulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id:any) {
          if (id.includes('node_modules')) {
            return 'vendor'; // Split vendor libraries
          }
          if (id.includes('src/components/')) {
            return 'components'; // Split components into their own chunk
          }
          if (id.includes('src/hooks/')) {
            return 'hooks'; // Split hooks into their own chunk
          }
          if (id.includes('src/views/')) {
            return 'views'; // Split views into their own chunk
          }
          if (id.includes('src/data/')) {
            return 'data'; // Split data into their own chunk
          }
        },
      },
    },
    sourcemap: false,
  },
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
    },
  },
  server: {
    proxy: {
      "/api": "http://my-esp32.local",
    },
  },
});
```

## On Device File Structure

```ts
CIRCUITPY:{
  _www:{
    assets: [...]
    index.html
  }
  captive_portal: {
    __init__.py
    server.py
  }
  esp_portal: {
    __init__.py
    server.py
  }
  lib: {
    adafruit_httpserver: [...]
  }
  utils: {
    __init__.py
    mdns.py
    wifi.py
  }
  config.json
  settings.toml 
}
```
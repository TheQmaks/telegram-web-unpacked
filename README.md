# Telegram Web Unpacked

> **Disclaimer**
> This repository is provided **for research and educational purposes only**. The author does **not** endorse using these materials for unauthorized access to Telegram or any other web application.

---

## Why This Project Exists

Modern web apps are shipped as heavily‑minified **bundles**. Surprisingly often, even large companies forget to remove their **source‑map files** (`*.map`) from production. A published source map contains the complete mapping back to the original project structure-real variable names, module paths, folder hierarchy, and more.

If a team uses custom protocols or proprietary crypto, an exposed map file:

* removes most of the grunt work from reverse engineering;
* instantly reveals real function and class names;
* can slash analysis time from days to minutes.

💡 **Bottom line:** the time gap between *“read the source”* and *“deminify the bundle”* becomes huge in favor of the attacker.

---

## Spotting Source Maps in Chrome

1. Open **DevTools → Network**, then reload the page.
2. Filter by `.map` or by the string `sourceMappingURL`; look for `.js.map` / `.css.map` requests.
3. Alternatively, open **Sources** → expand `webpack://` or `(no domain)` - readable modules mean the map is already loaded.
4. Chrome often shows a console warning such as:

   ```text
   DevTools failed to load source map: Could not load content for …/app.js.map
   ```

### How Maps Are Embedded

| Variant                                          | Where to look                                        |
| ------------------------------------------------ | ---------------------------------------------------- |
| **Inline** (`//# sourceMappingURL=data:…`)       | At the very end of the minified file (`app.min.js`)  |
| **External** (`//# sourceMappingURL=app.js.map`) | Separate sibling file fetched via a normal HTTP call |

---

## Auto‑Unpacking with **kaifu**

[`kaifu`](https://github.com/ozio/kaifu) is a CLI tool that takes one or many `*.map` files and rebuilds the original directory tree with readable source files.

### Quick Start

```bash
# Install globally
npm i -g kaifu

# Unpack a single .map
kaifu --o ./src ./dist/app.js.map
```

---

## Next Steps After Extraction

* Perform static analysis on the recovered sources.
* Dive into custom protocols or crypto by reading the now‑readable functions/classes.
* Diff client versions to track logic changes over time.

# Tempo Strength Club — demo site

A single-page demo website for a fictional gym, built by [Corivo Digital](https://corivodigital.com) as a portfolio piece to show prospects what a premium, custom-built site looks like.

Dark theme, Anton and Inter from Google Fonts, hard edges, electric lime accent. Pinned hero with a marquee strip, count-up stats, a sticky split-scroll programs section, a horizontally pinned coaches row, a filterable weekly schedule, three membership tiers, testimonials and a free-week sign-up form.

## Stack

- `index.html`, `styles.css`, `main.js`. Vanilla HTML, CSS and JavaScript. No frameworks, no build step, no npm.
- `netlify.toml` publishes the repo root as-is and sets security headers.
- `favicon.svg` is the lime "T" mark. `og-image.png` is the social share image referenced in the head.
- Images are placeholders from [picsum.photos](https://picsum.photos) with fixed seeds so they stay consistent between loads.

## Run locally

Open `index.html` directly in a browser, or serve the folder with any static server:

```sh
npx serve .
# or
python3 -m http.server 8000
```

Then visit the printed URL.

## Deploy

Push the repo to Netlify. `netlify.toml` already sets `publish = "."` and the headers. Once a domain is attached, change the `og:image` and `twitter:image` URLs in `index.html` to absolute URLs so social previews resolve.

## Decisions worth knowing

- "Pinned for 150vh" and "pinned for 200vh" are implemented as the section height (150vh hero, 200vh coaches) with a 100vh sticky pin inside, so the pinned travel is 50vh and 100vh respectively. Change the section heights in `styles.css` if the literal reading is wanted.
- On very short viewports (under 500px tall, i.e. phones in landscape) the hero is not pinned at all, and on wide-but-short desktop viewports where the coach row already fits, the coaches section is not pinned either. Both fall back to plain sections.
- The nav "Free Trial" button uses a compact size (13px, 14px 22px padding) so it fits the 80px bar. Every other button follows the spec sizing.

## Notes

- Every name, quote, address, phone number and statistic on the site is fictional. Tempo Strength Club does not exist.
- The sign-up form does not submit anywhere. It validates the fields and shows a confirmation message.
- With `prefers-reduced-motion` on, pinning, parallax, the marquee, magnetic buttons and the custom cursor are disabled and only simple fades remain.
- With JavaScript disabled, all content is visible and the site is fully navigable.

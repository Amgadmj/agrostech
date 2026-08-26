# Deploying the levantamento page

The page is a static site in `site/`. It ships to its own Vercel project. The apex domain
`agrostech.xyz` is a **Lovable** app (Vite/React, `~flock.js`, `gpt-engineer-file-uploads`)
behind Cloudflare, with no GitHub repo backing it, so the page cannot be added as a route
inside that project.

## What ships

`site/` — 17 MB, 15 files.

| | |
|---|---|
| `index.html` | the page, ~19 KB |
| `vercel.json` | cache and security headers |
| `.vercelignore` | see the warning below, it is load bearing |
| `assets/` | 9 stills, keyed to transparent where needed |
| `assets/video/hero-desktop.mp4` | 1600×900, H.264, 22 s, 6.3 MB |
| `assets/video/hero-mobile.mp4` | 720×1280, H.264, 15 s, 3.5 MB |

Both videos were HEVC originally (409 MB and 42 MB). HEVC does not play in Firefox and is
unreliable in Chrome, so they were re-encoded to H.264. The desktop cut is trimmed from
0:08 of the source flight, so the player loops natively.

> **Do not delete `site/.vercelignore`.** Without it the Vercel CLI falls back to
> `.gitignore`, and `site/assets/.gitignore` excludes `video/`. The deploy would silently
> ship with no hero video and a black first screen.

## 1. Authenticate

Either log in interactively:

```bash
npx vercel login
```

Or export a token from https://vercel.com/account/tokens:

```bash
export VERCEL_TOKEN=xxxxxxxx
```

## 2. Deploy

From the repo root. The first run creates the project and asks for a name; answer
`agrostech-levantamento`, accept the detected root, and take the defaults for build
settings (there is no build step, it is static).

```bash
npx vercel deploy site --prod --yes
```

With a token instead of an interactive login:

```bash
npx vercel deploy site --prod --yes --token "$VERCEL_TOKEN"
```

## 3. Check

Confirm the video actually shipped. This is the failure mode worth testing first:

```bash
curl -sI https://<deployment>.vercel.app/assets/video/hero-desktop.mp4 | grep -iE "HTTP/|content-length|content-type"
```

Expect `200`, `video/mp4`, and roughly 6.6 MB. A `404` means `.vercelignore` was lost.

Range support is what makes the video seekable, and Vercel serves it by default:

```bash
curl -sI -r 0-99 https://<deployment>.vercel.app/assets/video/hero-desktop.mp4 | grep -i "206\|content-range"
```

## 4. Putting it on agrostech.xyz

The Vercel deployment answers on `*.vercel.app`. Two ways onto the real domain:

- **Subdomain, simplest.** Add `levantamento.agrostech.xyz` as a domain on the Vercel
  project and create the CNAME it asks for in Cloudflare. Set that DNS record to **DNS only**,
  not proxied, or Cloudflare and Vercel will both try to terminate TLS.
- **Path on the apex.** Keep `deploy/cloudflare-worker.js` and point its `ORIGIN` at the
  Vercel URL instead of a Pages URL, then bind the Worker to `agrostech.xyz/levantamento*`.
  This keeps the page on the apex while everything else still hits Lovable.

## Known limits

- **Asset filenames are not content-hashed.** `vercel.json` caches them for 7 days rather
  than a year, so a re-encode propagates within a week. If this page starts changing often,
  hash the filenames and raise the max-age.
- **The drone renders are manufacturer product shots**, not Agrostech equipment. The spray
  drone implies a service that is not on the site's list. Resolve before promoting this.
- **The figures are one real job.** `217,12 ha`, `359,2 m`, `26,91 ha` and `121,76 ha`, plus
  the perimeter shape in `declividade.png`, all trace to a single surveyed property. The
  client name is gone from the page; the measurements are not anonymised.
- **Local preview needs `serve_site.py`**, not `python -m http.server` — the stdlib server
  ignores Range headers and the video will not seek.

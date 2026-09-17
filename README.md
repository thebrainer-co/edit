# Edit by The Brainer — let the owner edit the site you built them

One script tag. The owner opens their site through a private link, taps **Change something**, and says what to change in plain words: *"change the opening hours to 9 to 5"*, *"make the header photo taller"*, *"swap the photo of the van"*. The change appears on the page in front of them. **Save** writes a new version of the site. **Undo** reverts the last request. No CMS, no account to create, no prompt box to learn.

Visitors never see it. For them the script reads one browser key and exits without rendering or requesting anything.

Works on any static HTML site: hand-written, Claude Code, Lovable, Bolt, v0, Astro, Hugo, Eleventy, exported Webflow, a WordPress site turned static. No markup changes required.

## Try it first

Seven demo sites at https://thebrainer.co/#try run this exact script in demo mode. Tap **Change something**, say what to change, tap a photo to swap it, tap any text and type. Nothing is saved there.

## Install

Add this before `</body>` on every page:

```html
<script src="https://edit.thebrainer.co/edit.js" data-site="YOUR_SITE_KEY" defer></script>
```

Sign in at https://thebrainer.co/app with your email (no password, a link is sent), register the site's hostname, and you get the site key and the install tag. Add an editor by email and they receive an **owner link**:

```
https://www.example.com/?admin=8f2c4b7e91a0d3f6c5b2e1a4
```

Send that link to the owner. The token is stored in their browser on first open and removed from the address bar. Anyone with the link can edit, so send it the way you would send a password: a direct message, not a public page. A new link can be issued at any time and the old one stops working.

That is the whole integration.

## What the owner can do

| Owner says or does | What happens |
|---|---|
| "change the headline to Family plumbers in Leeds" | The text block changes on the page. Save writes it into the HTML. |
| "make the header photo taller" | The region gets a `min-height`; photos inside it grow with it. Save appends a CSS rule. |
| "slow down the slideshow", "bigger text", "hide the newsletter box", "make the button green" | Style changes from a fixed whitelist of properties. |
| "change a photo", or taps the paper clip | Tap the photo on the page, pick a file from the device. The image is uploaded, converted to WebP, and the `src` is replaced on Save. |
| **Tap to edit** | Taps any text on the page and types. Enter keeps it, Escape puts it back. Same save path. |
| **Suggestions** | The script inspects the page and offers fixes one at a time: hero too short, slideshow too fast, text under 15 px on phones, menu links too small to tap. |
| **Undo** | Reverts the whole last request, not one property. |
| **Save** | A new version of the site. Every earlier version is kept. |

Everything the owner does before Save happens only in their browser.

## Optional markup

None is needed. The script finds text blocks, images and layout regions by walking the page. Two attributes are available when you want stable names or want to keep something out of reach:

```html
<h1 data-edit="hero.title">Family plumbers in Leeds</h1>
<img data-edit-img="hero.image" src="/img/van.jpg" alt="Our van">
<div data-edit-ignore>…legal text the owner must not touch…</div>
```

`data-edit` and `data-edit-img` values become the element's id in the saved change record, so your build can map them back to a source file or a data field. Elements inside `data-edit-ignore` are never offered for editing.

## Script attributes

| Attribute | Default | Meaning |
|---|---|---|
| `data-site` | required | Site key from the control plane |
| `data-api` | the script's own origin and path | Base URL of the backend (see API) |
| `data-brand` | none | Your studio name, shown in the panel header ("by Northwind Studio") |
| `data-color`, `data-paper`, `data-ink`, `data-surface` | acid on black | Panel colours, so it can match your client's site |
| `data-lang` | page `lang` | Language for voice input and replies |
| `data-admin-param` | `admin` | Query parameter name used by the owner link |
| `data-slider` | `.autoserve-slider,[data-edit-slider]` | Selector for slideshows the owner may slow down or speed up |

## How saving works

**Sites hosted on the control plane** (Autoserve sites, or sites you upload): Save hardlink-copies the current version to `vN+1`, rewrites only the files that changed, and flips the `current` pointer. Old versions stay intact and can be restored.

**Sites in a git repository** (Netlify, Vercel, Cloudflare Pages, GitHub Pages, Lovable's GitHub sync, your own server): give the repository URL with access when you register the site, for GitHub a fine-grained token with Contents read and write on that one repository, pasted into the URL as `https://TOKEN@github.com/you/site.git`. Every save is a commit "Edit by The Brainer: …": text replaced in the page file (for Vite and Lovable projects the text is found in `src/`), uploaded images added under `assets/uploads/` (or `public/assets/uploads/`), style rules appended to `assets/edit.css` (or `public/edit.css`). Your existing deploy runs. The commit history is the owner's version history.

**Sites hosted with us:** choose "host it with us" when registering, upload a zip of the site from the dashboard, point the hostname at our server. Save writes a new version and keeps every earlier one.

## For Claude Code, Lovable and Bolt users

Paste this into your prompt when the site is done:

> Make this site editable by my client. Add `<script src="https://edit.thebrainer.co/edit.js" data-site="SITE_KEY" defer></script>` before `</body>` on every page. Do not change any other markup. If a page has a legal or terms section, wrap it in `<div data-edit-ignore>`. Load `assets/edit.css` on every page if it exists (create it empty if it does not).

Replace `SITE_KEY` with the key from the control plane. The site itself needs nothing else: the editor works on plain HTML.

A Claude Code skill that does the registration and the tag insertion is in `SKILL.md` in this repository.

## API

The client talks to six endpoints under the base URL. Implement them and the same script works against your own backend. All JSON bodies carry `site`, `admin` (the owner token), `session` (a random browser id) and `lang`.

`GET  {api}/session?site=&admin=` → `{"ok": true, "admin": true, "live": true, "name": "Change something", "intro": "…"}`
Returns `admin: false` for a bad or revoked token. The script then removes the token and renders nothing.

`POST {api}/edit` `{instruction, blocks, images, regions, mobile, history}` → `EditPlan`
The page describes itself. `blocks` = `[{id, tag, text}]` (≤160), `images` = `[{id, alt, w, h, area, top, bg}]` (≤60), `regions` = `[{id, tag, cls, w, h, top, photo, font, text, slider?, delay?}]` (≤60, always includes `body`). The backend asks a model for a plan and validates it: every `id` must exist in the submitted lists, style properties must be in the whitelist below, at most 12 text edits and 8 style items.

```json
{"reply": "Done: the header is now 50% taller.",
 "edits":  [{"id": "b3", "text": "Family plumbers in Leeds"}],
 "styles": [{"id": "r2", "css": {"min-height": "540px", "object-fit": "cover"}}],
 "wants_image": false, "image_target": null, "ask_which_image": false}
```

Style whitelist: `height min-height max-height width max-width font-size line-height font-weight letter-spacing text-align color background-color padding padding-top padding-bottom padding-left padding-right margin margin-top margin-bottom border-radius opacity display(none only) object-fit text-transform gap background-size background-position --as-slide-ms`. Values match `^[a-zA-Z0-9#%.,()\s\-]{1,60}$`, never `url(`.

`POST {api}/save` `{path, changes}` → `{"ok": true, "applied": 3, "missed": [], "version": 7}`
`path` is the page's pathname. `changes` is the record to persist:

```json
[{"kind": "text",  "id": "hero.title", "old": "Plumbers in Leeds", "new": "Family plumbers in Leeds"},
 {"kind": "style", "selector": "section.hero", "css": {"min-height": "540px"}},
 {"kind": "img",   "old": "/img/van.jpg", "new": "/assets/uploads/3f9a…c1.webp"},
 {"kind": "bg",    "selector": "section.hero", "new": "/assets/uploads/3f9a…c1.webp"}]
```

Text is replaced by exact match of `old` in the page file (HTML-escaped form tried first). A text that cannot be found is returned in `missed` and the owner is asked for the exact words. Style and background rules are appended to a stylesheet the page already loads, as `selector{prop:value !important}`. Selectors are the element's CSS path (`tag#id`, or up to two classes, or `:nth-of-type`), at most five levels.

`POST {api}/upload` multipart `site, admin, file` → `{"ok": true, "url": "/assets/uploads/<sha1>.webp"}`
15 MB limit, jpg/png/webp/gif, resized to 2000 px and stored as WebP.

`POST {api}/chat` `{messages}` → `{"reply": "…"}`
Plain questions that are not edits ("how do I add a page?"). Optional; the client degrades gracefully.

`POST {api}/ev` `{kind, path, …}` → 204. Fire-and-forget usage events. Optional.

## Limits

- Text edits work on elements with three or fewer children. Rich inline markup inside a block is flattened to the new text.
- Style edits are per element or per selector, appended as `!important` rules. They do not touch your source CSS.
- New pages, new sections and layout changes are out of scope. The owner edits what is there.
- One page at a time: the owner edits the page they are looking at.

## Licence

MIT. The client is free to use, copy and modify. The hosted control plane is a paid service for more than one site.

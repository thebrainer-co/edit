---
name: make-site-editable
description: Make a finished static HTML site editable by its non-technical owner with one script tag (handover edit.js). Use when the user asks how the client will edit the site, wants a CMS-free handover, or says "make this editable".
---

# Make this site editable by the client

1. Find every HTML page in the project (`**/*.html`, or the template that wraps every page for Astro/Eleventy/Hugo).
2. Insert this line before `</body>` on each of them, once:
   `<script src="https://edit.thebrainer.co/edit.js" data-site="SITE_KEY" defer></script>`
   Ask the user for the site key if it is not in the prompt or in a `.env` as `EDIT_SITE_KEY`. Do not invent one.
3. If a page loads no stylesheet of its own, add `<link rel="stylesheet" href="/assets/edit.css">` and create the empty file. Style edits are appended there.
4. Wrap legal, terms and cookie text in `<div data-edit-ignore>` so the owner cannot change it by accident.
5. Do not change any other markup. The editor works without attributes. Add `data-edit="section.field"` names only if the user wants stable ids for their own build.
6. Tell the user: send the owner link (`https://<their host>/?admin=<token>`, from the control plane) to the client by direct message, not on a public page. The client opens it once; after that a "Change something" button appears for them on every page.

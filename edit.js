/*! handover edit.js — one script tag that lets a site owner edit their own static site.
 *  Visitors: the script reads one localStorage key and exits. Nothing is rendered, nothing is requested.
 *  Owner: opens the site through the admin link (?admin=<token>) once; from then on a small "Change something"
 *  button appears on every page. They describe the change in words, tap a photo to swap it, save.
 *  MIT licence. Backend contract: see README "API".
 */
(function () {
  var me = document.currentScript || (function () { var s = document.getElementsByTagName('script'); return s[s.length - 1]; })();
  var ds = (me && me.dataset) || {};
  var SITE = ds.site; if (!SITE) return;
  var API = (ds.api || (me && me.src ? me.src.replace(/\/[^\/]*$/, '') + '/v1' : '/v1')).replace(/\/$/, '');  // the control plane lives under /v1 on the script host
  var PARAM = ds.adminParam || 'admin', KEY = 'hv_adm_' + SITE, BRAND = ds.brand || '', LANG = ds.lang || document.documentElement.lang || '';
  var ADMIN = ''; try { ADMIN = localStorage.getItem(KEY) || ''; } catch (e) {}
  try { var sp = new URLSearchParams(location.search); var t = sp.get(PARAM);
    if (t && t.length > 3) { ADMIN = t; try { localStorage.setItem(KEY, t); } catch (e) {} sp.delete(PARAM); window.history.replaceState(null, '', location.pathname + (sp.toString() ? '?' + sp.toString() : '') + location.hash); } } catch (e) {}
  var DEMO = ds.demo === '1' || ds.demo === 'true';  // demo page: everyone may try, nothing is saved
  if (DEMO && !ADMIN) ADMIN = 'demo';
  if (!ADMIN) return;
  if (/Chrome-Lighthouse|Lighthouse|PageSpeed|HeadlessChrome/i.test(navigator.userAgent)) return;

  var session; try { session = localStorage.getItem('hv_s'); if (!session) { session = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('hv_s', session); } } catch (e) { session = 'x' + Date.now(); }
  function post(path, body) { return fetch(API + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ site: SITE, session: session, admin: ADMIN, lang: LANG }, body)) }); }
  function ev(kind, extra) { try { post('/ev', Object.assign({ kind: kind, path: location.pathname }, extra || {})).catch(function () {}); } catch (e) {} }
  var isMobile = window.innerWidth < 700, LIVE = true, SLIDER = ds.slider || '.autoserve-slider,[data-edit-slider]', SLIDE = '.autoserve-slide,[data-edit-slide]';
  var C = ds.color || '#C9FF3D', C2 = ds.paper || '#0A0A0B', INK = ds.ink || '#F4F4EF', SURF = ds.surface || '#101113', ACC = ds.accent || '#C9FF3D';  // the Edit identity: acid on black; builders override with data-color / data-paper / data-ink / data-surface

  var css = '\
#hv-bub{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;background:' + C + ';color:' + C2 + ';border:0;box-shadow:0 8px 24px rgba(0,0,0,.28);cursor:pointer;font:600 14px/1.1 system-ui,-apple-system,sans-serif}\
#hv-pan{position:fixed;right:16px;bottom:74px;z-index:2147483000;width:440px;max-width:calc(100vw - 32px);max-height:min(88vh,800px);background:' + C2 + ';color:' + INK + ';border:1px solid rgba(255,255,255,.1);border-radius:14px;box-shadow:0 14px 44px rgba(0,0,0,.5);display:none;flex-direction:column;overflow:hidden;font:15px/1.45 system-ui,-apple-system,sans-serif}\
#hv-pan.on{display:flex}#hv-pan header{background:' + C + ';color:' + C2 + ';padding:10px 12px;display:flex;align-items:center;gap:9px}#hv-pan header span{flex:1;font-weight:700}#hv-pan header small{display:block;font-weight:500;opacity:.8;font-size:12px}#hv-pan header button{background:none;border:0;color:' + C2 + ';font-size:24px;cursor:pointer;line-height:1;padding:0 4px}\
#hv-msgs{padding:10px 12px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:8px;min-height:120px}\
.hv-m{padding:9px 12px;border-radius:10px;max-width:92%;white-space:pre-wrap}.hv-m.a{max-width:100%;width:100%;box-sizing:border-box;background:' + SURF + ';color:' + INK + ';align-self:flex-start;border:1px solid rgba(255,255,255,.1)}.hv-m.u{background:' + C + ';color:' + C2 + ';align-self:flex-end}\
.hv-chips{display:flex;flex-wrap:wrap;gap:6px;padding:10px 0 2px;margin-top:8px;border-top:1px dashed rgba(255,255,255,.14)}.hv-chips button{border:1px solid ' + C + ';background:transparent;color:' + C + ';border-radius:999px;padding:7px 12px;font:600 13px system-ui,sans-serif;cursor:pointer}.hv-chips button.pri{background:' + C + ';color:' + C2 + '}.hv-chips button.warn{border-color:#FF6B57;color:#FF6B57}\
#hv-pan,#hv-pan *{font-family:system-ui,-apple-system,sans-serif !important;box-sizing:border-box}#hv-form{padding:10px 12px 12px;border-top:1px solid rgba(255,255,255,.1)}.hv-box{background:' + SURF + ';border:1.5px solid rgba(255,255,255,.16);border-radius:14px;padding:10px 10px 6px 12px}.hv-box:focus-within{border-color:' + C + '}.hv-box textarea{display:block;width:100%;border:0;outline:0;resize:none;background:transparent;font:16px/1.4 system-ui,sans-serif;color:' + INK + ';min-height:44px;max-height:140px;padding:2px 0}\
.hv-tools{display:flex;justify-content:space-between;align-items:center;gap:6px;margin-top:4px}.hv-tools .hv-r{display:flex;gap:6px;margin-left:auto}.hv-tools button{border:0;background:transparent;color:' + INK + ';opacity:.75;width:36px;height:36px;border-radius:50%;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}.hv-tools #hv-mic.on{color:#fff;background:#B3402A}.hv-tools #hv-send{background:' + C + ';color:' + C2 + '}.hv-tools #hv-send:disabled{opacity:.35}.hv-tools [hidden]{display:none}\
@media(max-width:699px){#hv-pan{right:0;left:0;bottom:0;width:auto;max-width:none;border-radius:14px 14px 0 0;max-height:92vh;height:92vh}#hv-pan header small{display:none}#hv-pan header button{font-size:14px;font-weight:600;border:1px solid rgba(0,0,0,.35);border-radius:6px;padding:6px 10px}.hv-chips{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.hv-chips::-webkit-scrollbar{display:none}.hv-chips button{flex:0 0 auto}}\
body.hv-pick *{cursor:crosshair !important}.hv-hover{outline:3px dashed ' + ACC + ' !important;outline-offset:-3px}.hv-target{outline:3px solid ' + ACC + '!important;outline-offset:2px}.hv-changed{outline:2px dashed ' + C + '!important;outline-offset:2px}\
#hv-addimg{position:absolute;z-index:2147482000;padding:10px 16px;border:0;border-radius:8px;background:' + ACC + ';color:#0A0A0B;font:700 14px system-ui;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.3)}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  var bub = document.createElement('button'); bub.id = 'hv-bub'; bub.hidden = true; bub.innerHTML = ICON + '<span>Change something</span>'; document.body.appendChild(bub);
  var pan = document.createElement('div'); pan.id = 'hv-pan'; pan.hidden = true;
  pan.innerHTML = '<header>' + ICON + '<span>Edit this site<small>' + location.hostname + (BRAND ? ' · by ' + BRAND : '') + '</small></span><button type="button" aria-label="Close">' + (isMobile ? 'See the site ✕' : '×') + '</button></header>' +
    '<div id="hv-msgs"></div><form id="hv-form"><div class="hv-box"><textarea rows="2" placeholder="Tell me what to change…" autocomplete="off"></textarea><div class="hv-tools"><button type="button" id="hv-clip" aria-label="Attach a picture" title="Attach a picture"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.4 11.05l-9.2 9.2a6 6 0 0 1-8.5-8.5l9.9-9.9a4 4 0 0 1 5.7 5.7l-9.9 9.9a2 2 0 0 1-2.8-2.8l8.5-8.5"/></svg></button><div class="hv-r"><button type="button" id="hv-mic" aria-label="Speak" title="Speak"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg></button><button type="submit" id="hv-send" aria-label="Send"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg></button></div></div></div></form>';
  document.body.appendChild(pan);
  var msgs = pan.querySelector('#hv-msgs'), form = pan.querySelector('#hv-form'), input = form.querySelector('textarea'), sendBtn = form.querySelector('#hv-send'); sendBtn.disabled = true;
  function grow() { input.style.height = 'auto'; input.style.height = Math.min(140, Math.max(44, input.scrollHeight)) + 'px'; sendBtn.disabled = !input.value.trim(); }
  input.addEventListener('input', grow); input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })); } });
  var hist = [], opened = false, intro = null;

  // ---- messages + chips (chips live inside the latest answer)
  function chips(into, defs) { var c = document.createElement('div'); c.className = 'hv-chips'; defs.forEach(function (q) { var b = document.createElement('button'); b.type = 'button'; b.textContent = q[0]; if (q[2]) b.className = q[2]; b.onclick = function () { c.remove(); q[1](); }; c.appendChild(b); }); into.appendChild(c); }
  function add(role, text, defs) { var d = document.createElement('div'); d.className = 'hv-m ' + (role === 'user' ? 'u' : 'a'); d.textContent = text; msgs.appendChild(d); if (role !== 'user' && defs && defs.length) chips(d, defs); msgs.scrollTop = msgs.scrollHeight; return d; }
  function remember(role, text) { hist.push({ role: role, content: text }); if (hist.length > 14) hist.splice(0, hist.length - 14); }
  function userSays(t) { add('user', t); remember('user', t); }
  function setPlaceholder(t) { input.placeholder = t; try { input.focus(); } catch (e) {} }
  var CH = {
    undo: ['Undo', function () { undoEdit(); }, 'warn'],
    save: ['Save', function () { saveEdits(); }, 'pri'],
    done: ['Done', function () { stopEdit(); }],
    photo: ['Change a photo', function () { userSays('Change a photo'); if (images().length > 1) pickMode(); else pickImage(null); }],
    suggest: ['Suggestions', function () { userSays('What would you improve?'); runSuggestions(); }, 'pri'],
    headline: ['Change the headline', function () { userSays('Change the headline'); setPlaceholder('Type the new headline…'); pendingHeadline = true; }],
    tap: ['Tap to edit text', function () { userSays('Tap to edit'); tapMode(); }]
  };

  // ---- the page describes itself: text blocks, images, layout regions. Optional data-edit / data-edit-img names win over generated ids.
  function esc(s) { return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&'); }
  function ours(el) { return !!el.closest('#hv-pan,#hv-bub,#hv-addimg,[data-edit-ignore]'); }
  function blocks() {
    var TAGS = 'h1,h2,h3,h4,p,li,a,button,span,td,th,blockquote,figcaption,label', out = [], i = 0, els = document.querySelectorAll('[data-edit],' + TAGS);
    for (var k = 0; k < els.length && out.length < 160; k++) {
      var el = els[k]; if (ours(el) || (el.children.length > 3 && !el.hasAttribute('data-edit'))) continue;
      var t = (el.innerText || '').trim().replace(/\s+/g, ' '); if (!t || t.length < 2 || t.length > 300) continue;
      if (!el.hasAttribute('data-edit')) {  // a wrapper whose text lives in its own text children (an <li> of two <span>s) is skipped: the children are the blocks, so a change never flattens the row
        var covered = 0; for (var c = 0; c < el.children.length; c++) if (el.children[c].matches(TAGS)) covered += (el.children[c].innerText || '').trim().replace(/\s+/g, ' ').length;
        if (covered >= t.length * 0.9) continue;
      }
      var r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
      if (!el.dataset.hvId) el.dataset.hvId = el.getAttribute('data-edit') || ('b' + (i++));
      if (out.some(function (o) { return o.id === el.dataset.hvId; })) continue;
      out.push({ id: el.dataset.hvId, tag: el.tagName.toLowerCase(), text: t.slice(0, 200) });
    }
    return out;
  }
  function images() {
    var out = [], k = 0;
    var consider = function (el, isBg) {
      if (ours(el) || (!el.hasAttribute('data-edit-img') && el.closest('header,nav,footer,[class*="logo"],[id*="logo"],[class*="brand"]'))) return;
      var r = el.getBoundingClientRect(); if (r.width < 120 || r.height < 60) return;
      if (isBg) { var bg = getComputedStyle(el).backgroundImage; if (!bg || bg === 'none' || bg.indexOf('url(') < 0) return; }
      if (!el.dataset.hvImg) el.dataset.hvImg = el.getAttribute('data-edit-img') || ('i' + (k++));
      out.push({ id: el.dataset.hvImg, alt: (el.alt || el.getAttribute('data-edit-img') || el.className || '').toString().slice(0, 60), w: Math.round(r.width), h: Math.round(r.height), area: Math.round(r.width * r.height), top: Math.round(r.top + window.scrollY), bg: !!isBg });
    };
    var imgs = document.querySelectorAll('img,[data-edit-img]'); for (var i = 0; i < imgs.length && out.length < 60; i++) consider(imgs[i], imgs[i].tagName !== 'IMG');
    var bgs = document.querySelectorAll('section,div,figure,a,li'); for (var j = 0; j < bgs.length && out.length < 120; j++) if (!bgs[j].dataset.hvImg) consider(bgs[j], true);
    return out.sort(function (a, b) { return (b.area - a.area) || (a.top - b.top); });
  }
  function regions() {
    var out = [], k = 0, vw = window.innerWidth;
    var consider = function (el, extra) {
      if (ours(el)) return; var r = el.getBoundingClientRect(); if (r.width < vw * 0.3 || r.height < 24) return;
      if (!el.dataset.hvRg) el.dataset.hvRg = 'r' + (k++);
      var cs = getComputedStyle(el); var photo = el.tagName === 'IMG' || (cs.backgroundImage && cs.backgroundImage.indexOf('url(') >= 0) || !!el.querySelector('img');
      out.push(Object.assign({ id: el.dataset.hvRg, tag: el.tagName.toLowerCase(), cls: (typeof el.className === 'string' ? el.className : '').trim().split(/\s+/).filter(function (c) { return c && !/^hv-/.test(c); }).slice(0, 2).join('.'), w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top + window.scrollY), photo: photo, font: Math.round(parseFloat(cs.fontSize)), text: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60) }, extra || {}));
    };
    document.querySelectorAll(SLIDER).forEach(function (el) { consider(el, { slider: true, delay: parseInt(getComputedStyle(el).getPropertyValue('--as-slide-ms')) || 6000 }); });
    document.querySelectorAll('header,nav,main,section,footer,h1,h2,article,aside,figure,img,[class*="hero"],[class*="banner"],[class*="slide"],[class*="header"],[class*="btn"],[class*="button"],a.button,button').forEach(function (el) { if (out.length < 60 && !el.dataset.hvRg) consider(el); });
    if (!document.body.dataset.hvRg) document.body.dataset.hvRg = 'body';
    out.push({ id: 'body', tag: 'body', w: vw, h: Math.round(document.body.scrollHeight), top: 0, font: Math.round(parseFloat(getComputedStyle(document.body).fontSize)), text: 'whole page' });
    return out.sort(function (a, b) { return a.top - b.top; });
  }
  function byId(attr, id) { return id === 'body' && attr === 'data-hv-rg' ? document.body : document.querySelector('[' + attr + '="' + esc(id) + '"]'); }

  // ---- apply in the browser; one edits[] stack, one batch per request so Undo reverts the whole request
  var edits = [], batch = 0, pendingHeadline = false, targetImg = null, editing = false, picking = null;
  function newBatch() { batch++; }
  function cssPath(el) { var p = []; while (el && el.nodeType === 1 && el !== document.body && p.length < 5) { var s = el.tagName.toLowerCase(); if (el.id) { p.unshift(s + '#' + el.id); break; } var cls = (typeof el.className === 'string' ? el.className : '').trim().split(/\s+/).filter(function (c) { return c && !/^hv-/.test(c); }).slice(0, 2); if (cls.length) s += '.' + cls.join('.'); else { var i = 1, sib = el; while ((sib = sib.previousElementSibling)) if (sib.tagName === el.tagName) i++; s += ':nth-of-type(' + i + ')'; } p.unshift(s); el = el.parentElement; } return p.join('>'); }
  function showSlide(el) { var sl = el.closest(SLIDE); if (!sl) return; var sc = sl.closest(SLIDER); if (sc && sc.__asShow && sc.__asSlides) { var ix = sc.__asSlides.indexOf(sl); if (ix >= 0) sc.__asShow(ix); } }
  function pauseSliders() { document.querySelectorAll(SLIDER).forEach(function (sc) { if (sc.__asStop) sc.__asStop(); }); }
  function styleOne(el, selector, css) {
    edits.push({ batch: batch, el: el, attr: 'style', prev: el.getAttribute('style'), selector: selector, css: css });
    Object.keys(css).forEach(function (k) { el.style.setProperty(k, css[k], 'important'); });
    if (css['--as-slide-ms'] && el.__asRestart) el.__asRestart();
    el.classList.add('hv-changed');
  }
  function applyStyles(list) {
    var applied = [];
    list.forEach(function (s) {
      if (!s.css) return;
      if (s.selector && (!s.id || s.id === 'body')) { document.querySelectorAll(s.selector).forEach(function (el) { if (!ours(el)) styleOne(el, s.selector, s.css); }); applied.push(s); return; }
      var el = byId('data-hv-rg', s.id); if (!el) return;
      var sel = s.selector || (s.id === 'body' ? 'body' : cssPath(el));
      styleOne(el, sel, s.css);
      var hv = s.css['min-height'] || s.css['height'];   // a taller photo region: what is inside must grow with it
      if (hv && el.tagName !== 'IMG') {
        var slides = el.querySelectorAll(SLIDE); if (slides.length) slides.forEach(function (sl) { styleOne(sl, sel + ' ' + SLIDE.split(',')[0], { 'min-height': hv }); });
        var imgs = Array.prototype.slice.call(el.querySelectorAll('img')).filter(function (im) { return im.getBoundingClientRect().width > el.getBoundingClientRect().width * 0.6; });
        if (imgs.length) imgs.forEach(function (im) { styleOne(im, sel + ' img', { 'min-height': hv, 'height': hv, 'width': '100%', 'object-fit': 'cover' }); });
        else if (!slides.length) { var cs = getComputedStyle(el); if (cs.backgroundImage && cs.backgroundImage.indexOf('url(') >= 0) styleOne(el, sel, { 'background-size': 'cover', 'background-position': 'center' }); }
      }
      applied.push(s);
    });
    if (applied.length && applied[0].id && applied[0].id !== 'body') { var e0 = byId('data-hv-rg', applied[0].id); if (e0) e0.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    return applied;
  }
  function applyEdits(list) {
    var applied = [];
    list.forEach(function (e) {
      var el = byId('data-hv-id', e.id); if (!el || typeof e.text !== 'string') return;
      edits.push({ batch: batch, el: el, before: el.innerHTML, oldText: (el.innerText || '').trim(), newText: e.text }); el.textContent = e.text; el.classList.add('hv-changed'); applied.push(e); showSlide(el);
    });
    if (applied.length) { var el0 = byId('data-hv-id', applied[0].id); if (el0) el0.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    return applied;
  }
  function revertOne(last) {
    if (last.attr === 'style') { if (last.prev === null) last.el.removeAttribute('style'); else last.el.setAttribute('style', last.prev); if (last.css['--as-slide-ms'] && last.el.__asRestart) last.el.__asRestart(); }
    else if (last.attr === 'src') { last.el.src = last.prev; if (last.prevSet) last.el.srcset = last.prevSet; }
    else if (last.attr === 'bg') { last.el.style.backgroundImage = last.prev; }
    else last.el.innerHTML = last.before;
    if (!edits.some(function (e) { return e.el === last.el; })) last.el.classList.remove('hv-changed');
  }
  function undoEdit() {
    if (!edits.length) { add('assistant', 'Nothing to undo.', [CH.done]); return; }
    var b = edits[edits.length - 1].batch; while (edits.length && edits[edits.length - 1].batch === b) revertOne(edits.pop());
    add('assistant', edits.length ? 'Undone. Next change?' : 'Undone. Back to how it was. Next change?', edits.length ? [CH.undo, CH.done] : [CH.done]);
  }
  function saveEdits() {
    if (!edits.length) { add('assistant', 'Nothing to save yet.', []); return; }
    if (DEMO) { add('assistant', 'This is a demo, so nothing is written. On your own site this tap writes a new version of the page, and every earlier version is kept. Keep trying: ' + edits.length + ' change' + (edits.length === 1 ? '' : 's') + ' so far.', [CH.tap, CH.photo, CH.undo]); ev('demo_save'); return; }
    var changes = edits.map(function (e) {
      if (e.attr === 'src') return { kind: 'img', old: e.prevPath, new: e.newPath };
      if (e.attr === 'bg') return { kind: 'bg', selector: cssPath(e.el), new: e.newPath };
      if (e.attr === 'style') return { kind: 'style', selector: e.selector, css: e.css, new: 'style' };
      return { kind: 'text', id: e.el.dataset.hvId, old: e.oldText, new: e.newText };
    }).filter(function (c) { return c.new; });
    var w = add('assistant', 'Saving…');
    post('/save', { path: location.pathname, changes: changes }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.ok) { w.textContent = 'Could not save: ' + (j.error || 'try again'); return; }
      edits = []; document.querySelectorAll('.hv-changed').forEach(function (el) { el.classList.remove('hv-changed'); });
      w.textContent = (LIVE ? 'Saved and live. ' : 'Saved. It goes live with the next publish. ') + (j.missed && j.missed.length ? 'One change I could not place: tell me the exact words and I try again.' : 'Next change?');
      chips(w, [CH.tap, CH.photo, CH.suggest]); ev('saved', { n: j.applied, version: j.version });
    }).catch(function () { w.textContent = 'Could not save just now. Try once more.'; });
  }

  // ---- photos: tap to pick, then upload
  function clearTarget() { if (targetImg) { targetImg.classList.remove('hv-target'); targetImg = null; } var b = document.getElementById('hv-addimg'); if (b) b.remove(); }
  function pickMode() {
    clearTarget(); pauseSliders(); document.body.classList.add('hv-pick'); var last = null;
    var target = function (t) { var el = t.closest && t.closest('img,[data-edit-img]'); if (el) return el; var e = t; while (e && e !== document.body) { var bg = getComputedStyle(e).backgroundImage; if (bg && bg.indexOf('url(') >= 0) return e; e = e.parentElement; } return null; };
    var onMove = function (e) { var el = target(e.target); if (el === last) return; if (last) last.classList.remove('hv-hover'); last = el; if (el && !ours(el)) el.classList.add('hv-hover'); };
    var onClick = function (e) { var el = target(e.target); if (!el || ours(el)) return; e.preventDefault(); e.stopPropagation(); stop(); images(); pickImage(el.dataset.hvImg || null, el); };
    var stop = function () { document.body.classList.remove('hv-pick'); document.removeEventListener('mousemove', onMove, true); document.removeEventListener('click', onClick, true); if (last) last.classList.remove('hv-hover'); picking = null; };
    picking = stop; document.addEventListener('mousemove', onMove, true); document.addEventListener('click', onClick, true);
    if (isMobile) close();
    add('assistant', (isMobile ? 'Which photo? Tap it on the page' : 'Which photo? Click it on the page') + ' and I bring the upload button.', [['Cancel', function () { stop(); add('assistant', 'Okay. What else?', [CH.done]); }]]);
  }
  function swapWith(im, file) {
    var url = URL.createObjectURL(file); newBatch();
    if (im.tagName === 'IMG') { edits.push({ batch: batch, el: im, attr: 'src', prev: im.src, prevSet: im.srcset, prevPath: im.getAttribute('src') || '' }); im.removeAttribute('srcset'); im.src = url; }
    else { edits.push({ batch: batch, el: im, attr: 'bg', prev: im.style.backgroundImage }); im.style.setProperty('background-image', 'url(' + url + ')', 'important'); im.style.backgroundSize = 'cover'; }
    im.classList.add('hv-changed'); clearTarget();
    if (DEMO) { add('assistant', 'Swapped, in your browser only. On your own site the photo is uploaded and saved with the page.', [CH.save, CH.undo, CH.done]); return; }
    var fd = new FormData(); fd.append('site', SITE); fd.append('admin', ADMIN); fd.append('file', file); var w = add('assistant', 'Uploading…');
    fetch(API + '/upload', { method: 'POST', body: fd }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.ok) { edits[edits.length - 1].newPath = j.url; w.textContent = 'Swapped. Tap Save when you are happy, or Undo.'; } else w.textContent = 'Upload failed: ' + (j.error || 'try again');
      chips(w, [CH.save, CH.undo, CH.done]);
    }).catch(function () { w.textContent = 'Upload failed. Try once more.'; });
  }
  function pickImage(id, elDirect) {
    clearTarget(); pauseSliders();
    var im = elDirect || (id ? byId('data-hv-img', id) : null);
    if (!im) { var list = images(); im = list[0] && byId('data-hv-img', list[0].id); }
    if (!im) { add('assistant', 'I could not find a photo to change on this page.', [CH.done]); return; }
    showSlide(im); targetImg = im; im.classList.add('hv-target'); im.scrollIntoView({ block: 'center', behavior: 'smooth' });
    var f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*'; f.hidden = true; document.body.appendChild(f);
    var over = document.createElement('button'); over.type = 'button'; over.id = 'hv-addimg'; over.textContent = 'Upload new image'; over.onclick = function () { f.click(); }; document.body.appendChild(over);
    var place = function () { var r = im.getBoundingClientRect(); over.style.left = (window.scrollX + r.left + r.width / 2 - 80) + 'px'; over.style.top = (window.scrollY + r.top + r.height / 2 - 20) + 'px'; }; place(); window.addEventListener('scroll', place, { passive: true }); window.addEventListener('resize', place);
    add('assistant', 'The photo is highlighted on the page. Use the Upload new image button on it and pick a photo from your device.', [['Not this photo, the next one', function () { var list = images(); var idx = list.findIndex(function (x) { return x.id === im.dataset.hvImg; }); pickImage(list[(idx + 1) % list.length].id); }], CH.done]);
    f.onchange = function () { if (f.files[0]) swapWith(im, f.files[0]); };
  }
  var clip = pan.querySelector('#hv-clip'), clipIn = document.createElement('input'); clipIn.type = 'file'; clipIn.accept = 'image/*'; clipIn.hidden = true; document.body.appendChild(clipIn);
  clip.onclick = function () { clipIn.value = ''; clipIn.click(); };
  clipIn.onchange = function () { var file = clipIn.files[0]; if (!file) return; if (targetImg) { swapWith(targetImg, file); return; } var w = add('assistant', 'Which photo should it replace? Tap it on the page.', []); pickMode(); var im0 = null; var poll = setInterval(function () { if (targetImg && targetImg !== im0) { clearInterval(poll); swapWith(targetImg, file); } }, 300); setTimeout(function () { clearInterval(poll); }, 60000); };

  // ---- tap to edit: the owner taps any text block and types; the result is recorded exactly like a chat edit
  var tapping = null;
  function tapMode() {
    clearTarget(); pauseSliders(); if (picking) picking(); if (tapping) tapping();
    var TXT = 'h1,h2,h3,h4,h5,h6,p,li,a,button,span,td,th,blockquote,figcaption,label,dt,dd,[data-edit]';
    var target = function (t) { var el = t.closest && t.closest(TXT); while (el && (ours(el) || (el.children.length > 3 && !el.hasAttribute('data-edit')) || !(el.innerText || '').trim())) el = el.parentElement && el.parentElement.closest(TXT); return el && !ours(el) ? el : null; };
    var last = null, active = null;
    var finish = function () {
      if (!active) return; var el = active; active = null; el.contentEditable = 'false'; el.classList.remove('hv-target');
      var nt = (el.innerText || '').trim().replace(/\s+/g, ' '); var ot = el.__hvOld;
      if (nt === ot) { el.innerHTML = el.__hvBefore; return; }
      newBatch(); edits.push({ batch: batch, el: el, before: el.__hvBefore, oldText: ot, newText: nt }); el.textContent = nt; el.classList.add('hv-changed');
      add('assistant', 'Changed. Tap another text, or Save.', [CH.save, CH.undo, CH.done]);
    };
    var onMove = function (e) { var el = target(e.target); if (el === last) return; if (last && last !== active) last.classList.remove('hv-hover'); last = el; if (el && el !== active) el.classList.add('hv-hover'); };
    var onClick = function (e) {
      var el = target(e.target); if (!el) { if (active && !active.contains(e.target)) finish(); return; }
      if (el === active) return; e.preventDefault(); e.stopPropagation(); finish();
      blocks(); active = el; el.__hvOld = (el.innerText || '').trim().replace(/\s+/g, ' '); el.__hvBefore = el.innerHTML;
      el.classList.remove('hv-hover'); el.classList.add('hv-target'); el.contentEditable = 'true'; el.focus();
      try { var r = document.createRange(); r.selectNodeContents(el); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); } catch (x) {}
    };
    var onKey = function (e) { if (!active) return; if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finish(); } if (e.key === 'Escape') { active.innerHTML = active.__hvBefore; active.__hvOld = active.innerText; finish(); } };
    var stop = function () { finish(); document.body.classList.remove('hv-pick'); document.removeEventListener('mousemove', onMove, true); document.removeEventListener('click', onClick, true); document.removeEventListener('keydown', onKey, true); if (last) last.classList.remove('hv-hover'); tapping = null; };
    tapping = stop; document.body.classList.add('hv-pick');
    document.addEventListener('mousemove', onMove, true); document.addEventListener('click', onClick, true); document.addEventListener('keydown', onKey, true);
    editing = true; if (isMobile) close();
    add('assistant', (isMobile ? 'Tap any text on the page' : 'Click any text on the page') + ' and type. Enter keeps it, Escape puts it back. Links do not open while you edit.', [['Stop tapping', function () { stop(); add('assistant', 'Okay. Save, or tell me the next change.', [CH.save, CH.undo, CH.done]); }]]);
  }

  // ---- suggestions: what we would improve on this page, one at a time
  function suggestions() {
    var out = [], vw = window.innerWidth, rg = regions();
    var hero = rg.filter(function (r) { return r.photo && r.top < 400 && r.w > vw * 0.6 && r.id !== 'body'; }).sort(function (a, b) { return (b.w * b.h) - (a.w * a.h); })[0];
    if (hero && hero.h < (isMobile ? 200 : 380) && hero.h > 40) out.push({ key: 'hero', text: 'The main photo area at the top is quite low (' + hero.h + ' pixels). A taller header makes the first impression stronger. Make it about 50% taller?', styles: [{ id: hero.id, css: { 'min-height': Math.round(hero.h * 1.5) + 'px', 'object-fit': 'cover' } }] });
    var sl = rg.filter(function (r) { return r.slider; })[0];
    if (sl && document.querySelectorAll(SLIDE).length > 1 && (sl.delay || 6000) < 8000) out.push({ key: 'slider', text: 'The slideshow changes every ' + Math.round((sl.delay || 6000) / 1000) + ' seconds. That is fast for reading. Slow it to 10 seconds?', styles: [{ id: sl.id, css: { '--as-slide-ms': '10000' } }] });
    var p = document.querySelector('main p, section p, article p, p'); var fs = p ? parseFloat(getComputedStyle(p).fontSize) : 16;
    if (isMobile && fs < 15) out.push({ key: 'text', text: 'The text is small on phones (' + Math.round(fs) + ' pixels). Most readers prefer 16. Make body text 16 pixels?', styles: [{ id: 'body', selector: 'p, li', css: { 'font-size': '16px', 'line-height': '1.55' } }] });
    var links = Array.prototype.slice.call(document.querySelectorAll('nav a, header a')).filter(function (a) { var r = a.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 34; });
    if (isMobile && links.length > 3) out.push({ key: 'tap', text: 'The menu links are small to tap on a phone. Give them more room?', styles: [{ id: 'body', selector: 'nav a, header nav a', css: { 'padding': '10px 12px', 'display': 'inline-block' } }] });
    return out;
  }
  var sugQueue = [], sugDone = 0;
  function runSuggestions() {
    if (!sugQueue.length) { sugQueue = suggestions(); if (!sugQueue.length) { add('assistant', 'I looked at this page and found nothing I would change right now. Tell me what you want changed.', [CH.headline, CH.photo]); return; } add('assistant', 'I looked at this page. ' + sugQueue.length + (sugQueue.length === 1 ? ' thing' : ' things') + ' I would improve. One at a time:', []); }
    var sg = sugQueue.shift(); if (!sg) { add('assistant', sugDone ? 'That is all. Tap Save to keep them, or Undo.' : 'Okay, nothing changed.', [CH.save, CH.undo]); sugDone = 0; return; }
    add('assistant', sg.text, [['Yes, do it', function () { newBatch(); applyStyles(sg.styles); sugDone++; userSays('Yes'); runSuggestions(); }, 'pri'], ['Skip', function () { userSays('Skip'); runSuggestions(); }]]);
    if (!editing) { editing = true; pauseSliders(); }
  }

  // ---- the model call: request + the three lists in, a plan out
  function editRequest(text) {
    var w = add('assistant', '…');
    post('/edit', { instruction: text, blocks: blocks(), images: images(), regions: regions(), mobile: isMobile, history: hist }).then(function (r) { return r.json(); }).then(function (j) {
      w.remove();
      if (j.wants_image) { if (j.ask_which_image || !j.image_target) pickMode(); else pickImage(j.image_target); return; }
      newBatch(); var applied = (j.edits && j.edits.length ? applyEdits(j.edits) : []).concat(j.styles && j.styles.length ? applyStyles(j.styles) : []);
      var msg = j.reply || (applied.length ? 'Done.' : 'I could not find that text on this page. Tell me the exact words you see.');
      add('assistant', msg + (applied.length ? '\nHappy with it? Tap Save. Or tell me the next change.' : ''), applied.length ? [CH.save, CH.undo, CH.done] : [CH.done]);
      remember('assistant', msg);
    }).catch(function () { w.textContent = 'Sorry, that did not work. Try once more.'; });
  }
  function ask(q) {
    userSays(q); var w = add('assistant', '…');
    post('/chat', { messages: hist }).then(function (r) { return r.json(); }).then(function (j) { var reply = j.reply || 'Sorry, try again.'; w.textContent = reply; remember('assistant', reply); chips(w, [CH.suggest, CH.headline, CH.photo]); })
      .catch(function () { w.textContent = 'I could not answer right now. Tell me a change to make instead.'; });
  }
  function stopEdit() { editing = false; pendingHeadline = false; clearTarget(); if (picking) picking(); if (tapping) tapping(); input.placeholder = 'Tell me what to change…'; if (edits.length) add('assistant', 'You have unsaved changes. Save them, or undo?', [CH.save, CH.undo]); else add('assistant', 'Editing closed. Anything else?', [CH.suggest, CH.headline, CH.photo]); }
  function handleInput(q) {
    if (/^(close|stop|done|exit|finished?|ok done)( the)?( editor| editing)?[.!]?$/i.test(q)) { userSays(q); stopEdit(); return; }
    if (/^(save|save it|publish|yes,? save|go live)[.!]?$/i.test(q)) { userSays(q); saveEdits(); return; }
    if (/^(undo|undo that|go back)[.!]?$/i.test(q)) { userSays(q); undoEdit(); return; }
    if (/^(tap|tap to edit|click to edit|let me type|i want to type)[.!]?$/i.test(q)) { userSays(q); tapMode(); return; }
    if (/\b(suggest|improve|improvements|what would you (change|do|fix))\b/i.test(q)) { userSays(q); runSuggestions(); return; }
    if (/\b(image|images|photo|photos|picture|pictures|logo|banner|hero)\b/i.test(q) && /\b(change|upload|replace|swap|edit|update|own|new|can i|could i|different|another)\b/i.test(q)) { userSays(q); editing = true; pickImage(null); return; }
    if (editing || pendingHeadline || /\b(change|replace|edit|rename|rewrite|update|swap|make (it|the|this)|set the|hide|bigger|smaller|taller|higher|lower|slower|faster|larger|colou?r)\b/i.test(q)) {
      userSays(q); if (pendingHeadline) { pendingHeadline = false; q = 'Change the main headline to: ' + q; } editing = true; pauseSliders(); editRequest(q); return;
    }
    ask(q);
  }
  form.onsubmit = function (e) { e.preventDefault(); var q = input.value.trim(); if (!q) return; input.value = ''; grow(); handleInput(q); };

  // ---- open / close / voice
  function open() { pan.classList.add('on'); if (!opened) { opened = true; ev('opened'); var d0 = add('assistant', intro || 'This is your site. Tell me the change in plain words, for example "change the opening hours to 9 to 5", "make the header photo taller", or "change a photo". Or tap any text on the page and type.', [CH.tap, CH.photo, CH.suggest]); remember('assistant', d0.textContent); } }
  function close() { pan.classList.remove('on'); }
  bub.onclick = function () { pan.classList.contains('on') ? close() : open(); };
  pan.querySelector('header button').onclick = close;
  var mic = pan.querySelector('#hv-mic'), SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) mic.hidden = true; else {
    var rec = new SR(); rec.lang = LANG || 'en-GB'; rec.interimResults = false; var listening = false;
    rec.onresult = function (e) { var t = e.results[0][0].transcript; mic.classList.remove('on'); listening = false; handleInput(t); };
    rec.onend = function () { mic.classList.remove('on'); listening = false; }; rec.onerror = rec.onend;
    mic.onclick = function () { if (listening) { rec.stop(); return; } try { rec.start(); listening = true; mic.classList.add('on'); input.placeholder = 'Listening…'; } catch (e) {} };
  }

  // ---- session: is this admin token good for this site?
  if (DEMO) { bub.hidden = false; pan.hidden = false; LIVE = false; setTimeout(open, 900); return; }
  fetch(API + '/session?site=' + encodeURIComponent(SITE) + '&admin=' + encodeURIComponent(ADMIN)).then(function (r) { return r.json(); }).then(function (j) {
    if (!j.ok || !j.admin) { try { localStorage.removeItem(KEY); } catch (e) {} bub.remove(); pan.remove(); return; }
    LIVE = j.live !== false; intro = j.intro || null;
    if (j.name) bub.querySelector('span').textContent = j.name;
    bub.hidden = false; pan.hidden = false;
    var seen = false; try { seen = sessionStorage.getItem('hv_intro') === '1'; sessionStorage.setItem('hv_intro', '1'); } catch (e) {}
    if (!seen) setTimeout(open, 1200);
  }).catch(function () {});
})();

(function () {
  'use strict';

  var STORE_KEY = 'nidForm.v1';
  var LAST_STEP = window.NID_STEPS.length; // index of the review step

  var state = {
    lang: null,          // 'Ara' | 'Kur'
    step: 0,             // 0..LAST_STEP
    data: Object.assign({}, window.NID_HIDDEN_DEFAULTS),
  };

  var FIELD_BY_NAME = {};
  window.NID_FIELDS.forEach(function (f) { FIELD_BY_NAME[f.name] = f; });

  function S() { return window.NID_STRINGS[state.lang]; }
  function U() { return window.NID_UI[state.lang]; }
  function $(id) { return document.getElementById(id); }

  // ---------- Small helpers ----------
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Arabic-Indic (٠-٩) and Persian/Kurdish (۰-۹) digits -> 0-9, so numbers
  // typed on an Arabic or Kurdish keyboard end up the same in the QR code.
  function latinDigits(v) {
    return String(v).replace(/[\u0660-\u0669]/g, function (c) { return c.charCodeAt(0) - 0x0660; })
      .replace(/[\u06F0-\u06F9]/g, function (c) { return c.charCodeAt(0) - 0x06F0; });
  }

  // The QR payload is comma-separated, so a comma typed inside a field would
  // shift every later field. Swap it for the Arabic comma, which reads the
  // same to a person and is harmless to the scanner.
  function cleanValue(name, v) {
    return latinDigits(String(v).replace(/,/g, '\u060C').replace(/[\r\n]+/g, ' '));
  }

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    for (var k in attrs) {
      if (attrs[k] === undefined || attrs[k] === null) continue;
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) {
      if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  function getDataSource(dataKey) {
    var parts = dataKey.split('.');
    var src = window.NID_DATA;
    for (var i = 0; i < parts.length; i++) {
      var key = parts[i] === 'other'
        ? (state.lang === 'Ara' ? 'selectFieldOptionsAra' : 'selectFieldOptionsKur')
        : parts[i];
      src = src && src[key];
    }
    return src || [];
  }

  function resolveText(dataKey, val) {
    var list = getDataSource(dataKey);
    for (var i = 0; i < list.length; i++) {
      // Loose equality: some lookup lists use numeric `val`s.
      if (list[i].val == val) return list[i].text;
    }
    return val || '';
  }

  // Search ignores tatweel, joiners and alef/taa-marbuta/yaa variants.
  function normalizeSearch(s) {
    return (s || '')
      .replace(/[\u0640\u200b\u200c\u200d]/g, '')
      .replace(/[\u0622\u0623\u0625]/g, '\u0627')
      .replace(/\u0629/g, '\u0647')
      .replace(/[\u0649\u06CC]/g, '\u064a')
      .replace(/\u06A9/g, '\u0643')
      .trim();
  }

  // ---------- Saving on the device ----------
  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ lang: state.lang, step: state.step, data: state.data }));
    } catch (e) { /* private mode or storage full: the form still works */ }
  }
  function loadSaved() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function hasUserData(data) {
    return Object.keys(data || {}).some(function (k) { return k !== 'a32' && data[k]; });
  }
  function resetForm() {
    state.data = Object.assign({}, window.NID_HIDDEN_DEFAULTS);
    state.step = 0;
    persist();
  }

  // ---------- Usage counters (Vercel Web Analytics custom events) ----------
  // Only counts actions; never sends anything the person typed.
  function trackEv(name, data) {
    try {
      if (window.va) window.va('event', { name: name, data: Object.assign({ lang: state.lang || '' }, data || {}) });
    } catch (e) { /* analytics must never break the app */ }
  }

  // ---------- Owner / WhatsApp contact ----------
  function ownerLang() { return state.lang || 'Ara'; }
  function waLinkTo(number, msg) {
    return 'https://wa.me/' + number + '?text=' + encodeURIComponent(msg);
  }
  function waLink(msg) {
    var o = window.NID_OWNER;
    return 'https://wa.me/' + o.whatsapp + '?text=' + encodeURIComponent(msg || o.text[ownerLang()].message);
  }
  // Scrolling promo strip. Each announcement is its own link, so a tap
  // opens WhatsApp with the matching message and is counted separately.
  var PROMO_ICONS = {
    calendar: '<path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM16 3v4M8 3v4M4 11h16M8 15h2v2H8z"/>',
    palette: '<path d="M12 21a9 9 0 1 1 0-18c5 0 9 3.6 9 8 0 2.5-2 4-4.5 4H15a2 2 0 0 0-1.5 3.3A1.6 1.6 0 0 1 12 21z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.5" cy="10.5" r="1"/>',
    scale: '<path d="M7 20h10M6 6l6-1 6 1M12 3v17M9 12L6 6l-3 6a3 3 0 0 0 6 0zM21 12l-3-6-3 6a3 3 0 0 0 6 0z"/>'
  };
  function promoTicker() {
    var t = window.NID_OWNER.text[ownerLang()];
    var promos = [
      { icon: 'calendar', title: t.promo, cta: t.promoCta, msg: t.promoMessage, ev: 'booking_click' },
      { icon: 'scale', title: t.lawyerTitle, text: t.lawyerText, cta: t.lawyerCta, msg: t.lawyerMessage, ev: 'lawyer_click' },
      { icon: 'palette', title: t.designTitle, text: t.designText, cta: t.designCta, msg: t.designMessage, ev: 'design_click' }
    ];
    var bar = el('div', { class: 'promo no-print' });
    var track = el('div', { class: 'promo-track' });
    for (var round = 0; round < 2; round++) {
      promos.forEach(function (p) {
        var a = el('a', { class: 'promo-item promo-' + p.icon, dir: 'rtl', href: p.href || waLink(p.msg), target: '_blank', rel: 'noopener' });
        if (round > 0) { a.setAttribute('aria-hidden', 'true'); a.setAttribute('tabindex', '-1'); }
        a.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + PROMO_ICONS[p.icon] + '</g></svg>';
        a.appendChild(el('b', { text: p.title }));
        if (p.text) { a.appendChild(el('span', { class: 'promo-sep', text: '•' })); a.appendChild(el('span', { text: p.text })); }
        a.appendChild(el('span', { class: 'promo-sep', text: '•' }));
        a.appendChild(el('span', { class: 'promo-cta', text: p.cta }));
        a.addEventListener('click', function () { trackEv(p.ev, { place: 'promo_strip' }); });
        track.appendChild(a);
      });
    }
    bar.appendChild(track);
    return bar;
  }
  var FB_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg>';
  function fbLink(cls, label, place) {
    var a = el('a', { class: cls, href: window.NID_OWNER.facebook, target: '_blank', rel: 'noopener' });
    a.innerHTML = FB_SVG;
    if (label) a.appendChild(el('span', { text: label }));
    else a.setAttribute('aria-label', 'Facebook');
    a.addEventListener('click', function () { trackEv('facebook_click', { place: place }); });
    return a;
  }
  var TT_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M16.6 2h-3.3v13.3a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.1a6.3 6.3 0 1 0 5.3 6.2V8.6a7.7 7.7 0 0 0 4.4 1.4V6.7a4.4 4.4 0 0 1-4.4-4.4z"/></svg>';
  function ttLink(cls, label, place) {
    var a = el('a', { class: cls, href: window.NID_OWNER.tiktok, target: '_blank', rel: 'noopener' });
    a.innerHTML = TT_SVG;
    if (label) a.appendChild(el('span', { text: label }));
    else a.setAttribute('aria-label', 'TikTok');
    a.addEventListener('click', function () { trackEv('tiktok_click', { place: place }); });
    return a;
  }
  function ownerPhoto(size) {
    var img = el('img', { class: 'owner-photo', src: window.NID_OWNER.photo, alt: '',
      width: String(size), height: String(size) });
    img.style.width = size + 'px';
    img.style.height = size + 'px';
    return img;
  }
  function waButton(cls, label) {
    var a = el('a', { class: cls, href: waLink(), target: '_blank', rel: 'noopener' });
    a.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.4c.1.2 1.6 2.5 4 3.5 1.5.6 2.1.7 2.8.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>';
    if (label) a.appendChild(el('span', { text: label }));
    else a.setAttribute('aria-label', 'WhatsApp');
    return a;
  }

  // ---------- Toast ----------
  var toastTimer;
  function toast(msg) {
    var t = $('toast');
    if (!t) { t = el('div', { id: 'toast', class: 'toast no-print', role: 'status' }); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  // ---------- Sheets (bottom dialogs) ----------
  function openSheet(content, opts) {
    opts = opts || {};
    closeSheet(true);
    var overlay = el('div', { class: 'sheet-overlay no-print', id: 'sheet' });
    var sheet = el('div', { class: 'sheet' + (opts.tall ? ' sheet-tall' : ''), role: 'dialog', 'aria-modal': 'true' });
    sheet.appendChild(el('div', { class: 'sheet-grip', 'aria-hidden': 'true' }));
    sheet.appendChild(content);
    overlay.appendChild(sheet);
    overlay.addEventListener('click', function (e) { if (e.target === overlay && !opts.modal) closeSheet(); });
    document.body.appendChild(overlay);
    document.body.classList.add('sheet-open');
    requestAnimationFrame(function () { overlay.classList.add('open'); });
    if (!opts.modal) history.pushState({ step: state.step, sheet: true }, '');
  }
  function closeSheet(silent) {
    var s = $('sheet');
    if (!s) return;
    s.parentNode.removeChild(s);
    document.body.classList.remove('sheet-open');
    if (!silent && history.state && history.state.sheet) history.back();
  }

  // ---------- Language ----------
  function showLangDialog() { $('lang-dialog').style.display = 'flex'; }

  function selectLang(lang) {
    state.lang = lang;
    $('lang-dialog').style.display = 'none';
    applyLang();
    persist();
    render();
  }
  function applyLang() {
    document.documentElement.setAttribute('dir', S().dir);
    document.documentElement.setAttribute('lang', state.lang === 'Ara' ? 'ar' : 'ckb');
    document.body.style.fontFamily = S().font;
    document.documentElement.style.setProperty('--pf-font', S().font);
    document.body.classList.toggle('lang-kur', state.lang === 'Kur');
  }

  // ---------- Install (PWA) ----------
  var deferredInstall = null;
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }
  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function canOfferInstall() {
    return !isStandalone() && (deferredInstall || isIOS());
  }
  function onInstallClick() {
    if (deferredInstall) {
      deferredInstall.prompt();
      deferredInstall.userChoice.finally(function () { deferredInstall = null; updateInstall(); });
      return;
    }
    var u = U();
    openSheet(el('div', { class: 'sheet-body' }, [
      el('h2', { class: 'sheet-title', text: u.installIosTitle }),
      el('p', { class: 'sheet-text', text: u.installIosBody }),
      (function () {
        var b = el('button', { class: 'btn btn-primary btn-block', type: 'button', text: u.close });
        b.onclick = function () { closeSheet(); };
        return b;
      })(),
    ]));
  }

  // ---------- Picker (searchable list in a bottom sheet) ----------
  function openPicker(field, onPicked) {
    var u = U();
    var list = getDataSource(field.dataKey);
    var label = S().labels[field.name] || field.name;

    var search = el('input', {
      class: 'picker-search', type: 'search', placeholder: u.searchPlaceholder,
      autocomplete: 'off', enterkeyhint: 'search', 'aria-label': u.searchPlaceholder,
    });
    var results = el('div', { class: 'picker-list', role: 'listbox' });
    var head = el('div', { class: 'picker-head' }, [
      el('h2', { class: 'sheet-title', text: label }),
    ]);
    var closeBtn = el('button', { class: 'icon-btn', type: 'button', 'aria-label': u.close, text: '✕' });
    closeBtn.onclick = function () { closeSheet(); };
    head.appendChild(closeBtn);

    function draw() {
      results.innerHTML = '';
      var needle = normalizeSearch(search.value);
      var filtered = needle
        ? list.filter(function (o) { return normalizeSearch(o.text).indexOf(needle) !== -1; })
        : list;
      var shown = filtered.slice(0, 200);
      var current = state.data[field.name];
      shown.forEach(function (o) {
        var picked = current !== undefined && current !== '' && o.val == current;
        var item = el('button', {
          class: 'picker-item' + (picked ? ' picked' : ''), type: 'button', role: 'option',
          'aria-selected': picked ? 'true' : 'false',
        }, [o.text]);
        item.onclick = function () {
          state.data[field.name] = o.val;
          persist();
          closeSheet();
          onPicked();
        };
        results.appendChild(item);
      });
      if (!shown.length) results.appendChild(el('div', { class: 'picker-empty', text: u.noResults }));
      else if (filtered.length > shown.length) results.appendChild(el('div', { class: 'picker-empty', text: u.moreResults }));
    }
    search.addEventListener('input', draw);

    var body = el('div', { class: 'picker' }, [head]);
    if (list.length > 8) body.appendChild(search);
    body.appendChild(results);
    if (state.data[field.name] && !field.required) {
      var clear = el('button', { class: 'btn btn-quiet btn-block', type: 'button', text: u.clearChoice });
      clear.onclick = function () { state.data[field.name] = ''; persist(); closeSheet(); onPicked(); };
      body.appendChild(clear);
    }
    draw();
    openSheet(body, { tall: list.length > 8 });
    if (list.length > 8 && !('ontouchstart' in window)) search.focus();
  }

  // ---------- Field widgets ----------
  function fieldRow(field, isLastOfStep) {
    var s = S(), u = U();
    var label = s.labels[field.name] || field.name;
    var id = 'f-' + field.name;
    var row = el('div', { class: 'field', id: 'row-' + field.name });
    var labelEl = el('label', { class: 'field-label', for: id }, [label]);
    if (field.required) labelEl.appendChild(el('span', { class: 'req', 'aria-hidden': 'true', text: ' *' }));
    row.appendChild(labelEl);

    var control;
    if (field.type === 'select') {
      var current = state.data[field.name];
      var shownText = current !== undefined && current !== '' ? resolveText(field.dataKey, current) : '';
      control = el('button', {
        class: 'field-input field-select' + (shownText ? '' : ' empty'), type: 'button', id: id,
        'aria-haspopup': 'listbox',
      }, [shownText || u.choose]);
      control.onclick = function () {
        openPicker(field, function () {
          var t = resolveText(field.dataKey, state.data[field.name]);
          control.textContent = state.data[field.name] ? t : u.choose;
          control.classList.toggle('empty', !state.data[field.name]);
          clearError(field.name);
        });
      };
    } else if (field.type === 'date') {
      control = el('input', { class: 'field-input', type: 'date', id: id, name: field.name });
      if (field.name === 'a05birthDate' || field.name === 'a18shDate' || field.name === 'a24addrFromDate') {
        control.max = new Date().toISOString().slice(0, 10);
      }
      if (state.data[field.name]) control.value = String(state.data[field.name]).slice(0, 10);
      control.addEventListener('change', function (e) {
        state.data[field.name] = e.target.value;
        persist();
        clearError(field.name);
      });
    } else {
      var numeric = window.NID_NUMERIC.indexOf(field.name) !== -1;
      control = el('input', {
        class: 'field-input', type: field.name === 'a40phone' ? 'tel' : 'text', id: id, name: field.name,
        inputmode: numeric ? 'numeric' : 'text', autocomplete: 'off',
        enterkeyhint: isLastOfStep ? 'done' : 'next', dir: numeric ? 'ltr' : null,
      });
      if (state.data[field.name]) control.value = state.data[field.name];
      control.addEventListener('input', function (e) {
        var v = cleanValue(field.name, e.target.value);
        if (v !== e.target.value) {
          var pos = e.target.selectionStart;
          e.target.value = v;
          try { e.target.setSelectionRange(pos, pos); } catch (err) { /* type=tel on some browsers */ }
        }
        state.data[field.name] = v;
        persist();
        if (v) clearError(field.name);
      });
      control.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        var inputs = Array.prototype.slice.call(document.querySelectorAll('.step-body .field-input'));
        var i = inputs.indexOf(control);
        if (i > -1 && i < inputs.length - 1) inputs[i + 1].focus();
        else control.blur();
      });
    }
    row.appendChild(control);

    var hint = u.hints[field.name];
    if (hint) row.appendChild(el('p', { class: 'field-hint', text: hint }));
    row.appendChild(el('p', { class: 'field-error', id: 'err-' + field.name, role: 'alert' }));
    return row;
  }

  function clearError(name) {
    var e = $('err-' + name);
    if (e) e.textContent = '';
    var r = $('row-' + name);
    if (r) r.classList.remove('has-error');
  }

  function missingIn(stepIndex) {
    return window.NID_STEPS[stepIndex].filter(function (name) {
      var f = FIELD_BY_NAME[name];
      return f && f.required && !state.data[name];
    });
  }

  function showErrors(names) {
    names.forEach(function (name) {
      var e = $('err-' + name);
      if (e) e.textContent = U().missing;
      var r = $('row-' + name);
      if (r) r.classList.add('has-error');
    });
    var first = $('row-' + names[0]);
    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var c = first.querySelector('.field-input');
      if (c && c.tagName === 'INPUT') setTimeout(function () { c.focus(); }, 300);
    }
    if (navigator.vibrate) navigator.vibrate(40);
  }

  // ---------- Navigation ----------
  function goTo(step, push) {
    state.step = step;
    persist();
    if (push) history.pushState({ step: step }, '');
    render();
    window.scrollTo(0, 0);
  }

  function onNext() {
    var missing = missingIn(state.step);
    if (missing.length) { showErrors(missing); return; }
    if (state.step === LAST_STEP - 1) {
      // Before the review, make sure no earlier step was left incomplete.
      for (var i = 0; i < LAST_STEP; i++) {
        var m = missingIn(i);
        if (m.length) {
          goTo(i, true);
          setTimeout(function () { showErrors(m); }, 50);
          return;
        }
      }
    }
    if (state.step === LAST_STEP - 1) trackEv('form_completed');
    goTo(state.step + 1, true);
  }

  function onBack() {
    if (history.state && typeof history.state.step === 'number' && history.state.step > 0) history.back();
    else if (state.step > 0) goTo(state.step - 1, false);
  }

  window.addEventListener('popstate', function (e) {
    if ($('sheet')) { closeSheet(true); return; }
    var st = e.state && typeof e.state.step === 'number' ? e.state.step : 0;
    state.step = Math.min(st, LAST_STEP);
    persist();
    render();
    window.scrollTo(0, 0);
  });

  // ---------- Rendering ----------
  function renderHeader(root) {
    var s = S(), u = U();
    var bar = el('header', { class: 'app-bar no-print' });
    bar.appendChild(el('h1', { class: 'app-title', text: s.appTitle }));
    var actions = el('div', { class: 'app-bar-actions' });
    var ib = el('button', { class: 'chip chip-solid', type: 'button', text: u.install, id: 'install-btn' });
    ib.onclick = onInstallClick;
    ib.hidden = !canOfferInstall();
    actions.appendChild(ib);
    var lb = el('button', { class: 'chip', type: 'button', text: u.langShort, 'aria-label': s.changeLang });
    lb.onclick = function () { selectLang(state.lang === 'Ara' ? 'Kur' : 'Ara'); };
    actions.appendChild(lb);
    bar.appendChild(actions);
    root.appendChild(bar);

    var ot = window.NID_OWNER.text[ownerLang()];
    var strip = el('div', { class: 'owner-strip no-print' });
    var who = el('a', { class: 'owner-strip-who', href: waLink(), target: '_blank', rel: 'noopener' });
    who.appendChild(ownerPhoto(26));
    who.appendChild(el('span', { class: 'owner-strip-text', text: ot.strip + ' ' + window.NID_OWNER.name[ownerLang()] }));
    who.addEventListener('click', function () { trackEv('whatsapp_click', { place: 'top_strip' }); });
    strip.appendChild(who);
    var waIcon = waButton('owner-strip-icon', null);
    waIcon.addEventListener('click', function () { trackEv('whatsapp_click', { place: 'top_strip' }); });
    strip.appendChild(ttLink('owner-strip-icon', null, 'top_strip'));
    strip.appendChild(fbLink('owner-strip-icon', null, 'top_strip'));
    strip.appendChild(waIcon);
    root.appendChild(strip);
    root.appendChild(promoTicker());

    var total = LAST_STEP + 1;
    var prog = el('div', { class: 'progress no-print' });
    prog.appendChild(el('p', { class: 'progress-label', text: u.stepOf(state.step + 1, total) }));
    var track = el('div', { class: 'progress-track', role: 'progressbar',
      'aria-valuemin': '1', 'aria-valuemax': String(total), 'aria-valuenow': String(state.step + 1) });
    for (var i = 0; i < total; i++) {
      track.appendChild(el('span', { class: 'progress-seg' + (i < state.step ? ' done' : i === state.step ? ' now' : '') }));
    }
    prog.appendChild(track);
    root.appendChild(prog);
  }

  function render() {
    if (!state.lang) return;
    closeSheet(true);
    var root = $('app-root');
    root.innerHTML = '';
    document.body.classList.toggle('on-review', state.step === LAST_STEP);
    renderHeader(root);
    if (state.step === LAST_STEP) renderReview(root);
    else renderStep(root);
  }

  function renderStep(root) {
    var u = U();
    var names = window.NID_STEPS[state.step];
    var main = el('main', { class: 'step no-print' });
    main.appendChild(el('h2', { class: 'step-title', text: u.steps[state.step] }));
    var hasRequired = names.some(function (n) { return FIELD_BY_NAME[n] && FIELD_BY_NAME[n].required; });
    if (hasRequired) main.appendChild(el('p', { class: 'step-note', text: u.requiredNote }));
    var body = el('div', { class: 'step-body' });
    names.forEach(function (n, i) {
      if (FIELD_BY_NAME[n]) body.appendChild(fieldRow(FIELD_BY_NAME[n], i === names.length - 1));
    });
    main.appendChild(body);
    root.appendChild(main);

    var nav = el('nav', { class: 'action-bar no-print' });
    if (state.step > 0) {
      var back = el('button', { class: 'btn btn-quiet', type: 'button', text: u.back });
      back.onclick = onBack;
      nav.appendChild(back);
    }
    var next = el('button', { class: 'btn btn-primary btn-grow', type: 'button',
      text: state.step === LAST_STEP - 1 ? u.finish : u.next });
    next.onclick = onNext;
    nav.appendChild(next);
    root.appendChild(nav);
  }

  // ---------- Review / export ----------
  var A4_W = 794, A4_H = 1123; // A4 in CSS px at 96dpi

  function buildQrString(data) {
    var arr = [];
    for (var prop in data) {
      if (!data.hasOwnProperty(prop)) continue;
      var n = parseInt(prop.substring(1, 3), 10);
      arr[n] = data[prop];
    }
    var out = '';
    for (var i = 1; i < 43; i++) {
      var v = arr[i] === undefined || arr[i] === null ? '' : String(arr[i]);
      out += v.replace(/,/g, '\u060C') + ',';
    }
    out += '1508.1,';
    return out;
  }

  function buildDisplayData(rawData) {
    var display = Object.assign({}, rawData);
    Object.keys(window.NID_RESOLVE_MAP).forEach(function (name) {
      if (display[name]) display[name] = resolveText(window.NID_RESOLVE_MAP[name], display[name]);
    });
    window.NID_DATE_FIELDS.forEach(function (name) {
      if (display[name]) display[name] = String(display[name]).slice(0, 10);
    });
    return display;
  }

  function pval(display, name) { return esc(display[name] || ''); }

  // Printed form. Layout, wording and sizes reproduce the official
  // desktop app's printout (reference PDF) on one A4 page of 794x1123 px.
  function printFormHtml(d, qrDataUrl, s) {
    var P = window.NID_PRINT[state.lang] || window.NID_PRINT.Ara;
    function L(name) { return '<th>' + esc(P.labels[name] || s.labels[name] || '') + '</th>'; }
    function V(name) { return '<td>' + pval(d, name) + '</td>'; }
    function pair(name) { return L(name) + V(name); }
    function title(t, cls) { return '<div class="pf-sec' + (cls ? ' ' + cls : '') + '">' + esc(t) + '</div>'; }

    var h = '<div class="pf-page">';
    h += '<div class="pf-hdr-lines"><div>' + esc(P.head[0]) + '</div><div>' + esc(P.head[1]) +
      '</div><div>' + esc(P.head[2]) + '</div><div>' + esc(P.head[3]) + '</div></div>';
    h += '<img class="pf-logo" src="css/img/irq.png" alt="">';
    h += '<div class="pf-title">' + esc(P.title) + '</div>';

    h += '<div class="pf-top">';
    h += '<img class="pf-qr" src="' + qrDataUrl + '" alt="QR">';
    h += '<table class="pf-t pf-birth"><tr>' + pair('a04birthLoc') + '</tr><tr>' + pair('a05birthDate') + '</tr></table>';
    h += '</div>';

    h += '<table class="pf-t pf-names">';
    h += '<tr>' + pair('a07name1') + pair('a06name2') + '</tr>';
    h += '<tr>' + pair('a09name3') + pair('a08name4') + '</tr>';
    h += '<tr>' + pair('a11motherName') + pair('a10motherFatherName') + '</tr>';
    h += '</table>';

    h += title(P.sec.personal, 'pf-sec-tight');
    h += '<table class="pf-t pf-personal">';
    h += '<tr>' + pair('a01gender') + '</tr>';
    h += '<tr>' + pair('a33religion') + pair('a02mariage') + '</tr>';
    h += '<tr>' + pair('a34job') + pair('a03bloodGroup') + '</tr>';
    h += '<tr>' + pair('a35disabilities') + pair('a31passport') + '</tr>';
    h += '</table>';

    h += title(P.sec.address, 'pf-sec-tight');
    h += '<table class="pf-t pf-address">';
    h += '<tr>' + pair('a39addrCountry') + pair('a38addrProv') + pair('a37addrM') + pair('a36addrStNo') + '</tr>';
    h += '<tr>' + pair('a42addrBuildingNo') + pair('a41addrOther') + pair('a40phone') + '</tr>';
    h += '</table>';

    h += '<div class="pf-cols">';
    h += '<div class="pf-col">' + title(P.sec.residence) + '<table class="pf-t">' +
      '<tr>' + pair('a22addrOffice') + '</tr><tr>' + pair('a23addrFormNo') + '</tr><tr>' + pair('a24addrFromDate') + '</tr></table></div>';
    h += '<div class="pf-col">' + title(P.sec.nationality) + '<table class="pf-t">' +
      ['a15shProv', 'a16shOffice', 'a17shNo', 'a18shDate', 'a19shPageNo', 'a20shYear', 'a21shLawItem']
        .map(function (n) { return '<tr>' + pair(n) + '</tr>'; }).join('') + '</table></div>';
    h += '<div class="pf-col">' + title(P.sec.civil) + '<table class="pf-t">' +
      '<tr>' + pair('a12office') + '</tr><tr>' + pair('a13bookNo') + '</tr><tr>' + pair('a14pageNo') + '</tr></table></div>';
    h += '</div>';

    h += title(P.sec.parents, 'pf-sec-par');
    h += '<table class="pf-t pf-parents">';
    h += '<tr>' + pair('a27fatherIsLive') + pair('a26fatherCountry') + pair('a25fatherBirthLoc') + '</tr>';
    h += '<tr>' + pair('a30motherIsLive') + pair('a29motherCountry') + pair('a28motherBirthLoc') + '</tr>';
    h += '</table>';

    h += '<div class="pf-signs"><div>' + esc(P.sign[0]) + '</div><div>' + esc(P.sign[1]) + '</div><div>' + esc(P.sign[2]) + '</div></div>';
    h += '</div>';
    return h;
  }

  function renderReview(root) {
    var u = U(), s = S();
    var main = el('main', { class: 'review' });
    main.appendChild(el('h2', { class: 'step-title no-print', text: u.steps[LAST_STEP] }));
    main.appendChild(el('p', { class: 'step-note no-print', text: u.reviewNote }));

    var stage = el('div', { class: 'pf-stage', id: 'pf-stage', role: 'button', tabindex: '0', 'aria-label': u.zoomHint });
    var scaler = el('div', { class: 'pf-scaler', id: 'pf-scaler' });
    stage.appendChild(scaler);
    main.appendChild(stage);
    main.appendChild(el('p', { class: 'field-hint center no-print', text: u.zoomHint }));

    var ot = window.NID_OWNER.text[ownerLang()];
    var card = el('div', { class: 'owner-card no-print' });
    var head = el('div', { class: 'owner-card-head' });
    head.appendChild(ownerPhoto(52));
    head.appendChild(el('div', {}, [
      el('p', { class: 'owner-card-name', text: window.NID_OWNER.name[ownerLang()] }),
      el('p', { class: 'owner-card-help', text: ot.help }),
    ]));
    card.appendChild(head);
    var cardBtn = waButton('btn btn-wa btn-block', ot.button);
    cardBtn.addEventListener('click', function () { trackEv('whatsapp_click', { place: 'review_card' }); });
    card.appendChild(cardBtn);
    card.appendChild(el('div', { class: 'owner-social' }, [
      fbLink('btn btn-fb', ot.fbButton, 'review_card'),
      ttLink('btn btn-tt', ot.ttButton, 'review_card'),
    ]));
    main.appendChild(card);


    var again = el('button', { class: 'btn btn-quiet btn-block no-print', type: 'button', text: u.newForm });
    again.onclick = function () {
      if (!confirm(u.confirmNew)) return;
      resetForm();
      history.replaceState({ step: 0 }, '');
      render();
      window.scrollTo(0, 0);
    };
    main.appendChild(again);
    root.appendChild(main);

    var nav = el('nav', { class: 'action-bar action-bar-review no-print' });
    var edit = el('button', { class: 'btn btn-quiet', type: 'button', text: u.edit });
    edit.onclick = onBack;
    var img = el('button', { class: 'btn btn-primary', type: 'button', text: u.saveImage, id: 'btn-img' });
    img.onclick = function () { exportFile('png', img); };
    var pdf = el('button', { class: 'btn btn-primary', type: 'button', text: u.savePdf, id: 'btn-pdf' });
    pdf.onclick = function () { exportFile('pdf', pdf); };
    var pr = el('button', { class: 'btn btn-quiet', type: 'button', text: u.print });
    pr.onclick = function () { trackEv('print'); window.print(); };
    nav.appendChild(edit); nav.appendChild(img); nav.appendChild(pdf); nav.appendChild(pr);
    root.appendChild(nav);

    var raw = Object.assign({}, state.data);
    window.QRCodeLib.toDataURL(buildQrString(raw), { errorCorrectionLevel: 'H', margin: 0, width: 520 })
      .then(function (qr) {
        scaler.innerHTML = printFormHtml(buildDisplayData(raw), qr, s);
        fitPreview();
        var logo = scaler.querySelector('.pf-logo');
        if (logo && !logo.complete) logo.addEventListener('load', fitPreview);
      })
      .catch(function (err) {
        console.error('QR generation failed', err);
        scaler.textContent = 'QR generation failed: ' + err.message;
      });

    stage.addEventListener('click', function () { stage.classList.toggle('zoomed'); fitPreview(); });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stage.click(); }
    });
  }

  // Scale the A4-width form down to the phone's width (or show it at full
  // size with sideways scrolling when the person taps to zoom).
  function fitPreview() {
    var stage = $('pf-stage'), scaler = $('pf-scaler');
    if (!stage || !scaler) return;
    var zoomed = stage.classList.contains('zoomed');
    var avail = stage.clientWidth;
    var scale = zoomed ? 1 : Math.min(1, avail / A4_W);
    scaler.style.transform = 'scale(' + scale + ')';
    scaler.style.height = '';
    var h = scaler.offsetHeight;
    stage.style.height = Math.ceil(h * scale) + 'px';
  }
  window.addEventListener('resize', fitPreview);

  // Render the form on an A4-shaped canvas, independent of screen size.
  function renderA4Canvas() {
    var src = document.querySelector('#pf-scaler .pf-page');
    var host = el('div', { class: 'capture-host' });
    host.appendChild(src.cloneNode(true));
    document.body.appendChild(host);
    var PX = 2.5; // ~240 dpi: sharp in print, still small enough to share
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    return fontsReady.then(function () {
      return window.html2canvas(host.firstChild, {
        scale: PX, backgroundColor: '#ffffff', useCORS: true, logging: false,
        width: A4_W, height: A4_H, windowWidth: A4_W,
      });
    }).then(function (shot) {
      host.parentNode.removeChild(host);
      return shot;
    }, function (err) {
      if (host.parentNode) host.parentNode.removeChild(host);
      throw err;
    });
  }

  // A one-page PDF holding a single JPEG, written by hand (no PDF library).
  function jpegToPdf(jpegBytes, imgW, imgH) {
    var enc = new TextEncoder();
    var parts = [], offsets = [], length = 0;
    function add(p) { var b = typeof p === 'string' ? enc.encode(p) : p; parts.push(b); length += b.length; }
    function obj(n, body) { offsets[n] = length; add(n + ' 0 obj\n' + body + '\nendobj\n'); }
    var pw = 595.28, ph = 841.89;
    add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pw + ' ' + ph + '] ' +
      '/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
    offsets[4] = length;
    add('4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + imgW + ' /Height ' + imgH +
      ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpegBytes.length + ' >>\nstream\n');
    add(jpegBytes);
    add('\nendstream\nendobj\n');
    var content = 'q ' + pw + ' 0 0 ' + ph + ' 0 0 cm /Im0 Do Q';
    obj(5, '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream');
    var xref = length;
    var x = 'xref\n0 6\n0000000000 65535 f \n';
    for (var i = 1; i <= 5; i++) x += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    add(x + 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF');
    return new Blob(parts, { type: 'application/pdf' });
  }

  function canvasToBlob(canvas, type, q) {
    return new Promise(function (res, rej) {
      canvas.toBlob(function (b) { b ? res(b) : rej(new Error('toBlob failed')); }, type, q);
    });
  }

  function fileBaseName() {
    var n = [state.data.a07name1, state.data.a06name2, state.data.a09name3].filter(Boolean).join('-');
    n = n.replace(/[\\/:*?"<>|\s]+/g, '-');
    return (state.lang === 'Kur' ? 'فۆرمی-کارتی-نیشتیمانی' : 'استمارة-البطاقة-الوطنية') + (n ? '-' + n : '');
  }

  function deliver(blob, filename) {
    // iPhone: the share sheet has "Save Image" / "Save to Files". Elsewhere a
    // normal download is the most predictable (it lands in Downloads).
    if (isIOS() && navigator.canShare) {
      var file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file] }).then(function () { return true; }, function (e) {
          if (e && e.name === 'AbortError') return false;
          throw e;
        });
      }
    }
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.parentNode.removeChild(a); }, 4000);
    return Promise.resolve(true);
  }

  var exporting = false;
  function exportFile(kind, btn) {
    if (exporting || !document.querySelector('#pf-scaler .pf-page')) return;
    exporting = true;
    var u = U();
    var label = btn.textContent;
    btn.textContent = u.working;
    btn.disabled = true;
    renderA4Canvas().then(function (page) {
      if (kind === 'png') {
        return canvasToBlob(page, 'image/png').then(function (b) { return deliver(b, fileBaseName() + '.png'); });
      }
      return canvasToBlob(page, 'image/jpeg', 0.92)
        .then(function (b) { return b.arrayBuffer(); })
        .then(function (buf) {
          var pdf = jpegToPdf(new Uint8Array(buf), page.width, page.height);
          return deliver(pdf, fileBaseName() + '.pdf');
        });
    }).then(function (done) {
      if (done) {
        toast(u.saved);
        trackEv(kind === 'png' ? 'saved_image' : 'saved_pdf');
      }
    }).catch(function (err) {
      console.error(err);
      toast(u.saveFailed);
    }).then(function () {
      exporting = false;
      btn.textContent = label;
      btn.disabled = false;
    });
  }

  // ---------- Start ----------
  function askAboutDraft(saved) {
    var u = U();
    var cont = el('button', { class: 'btn btn-primary btn-block', type: 'button', text: u.draftContinue });
    var fresh = el('button', { class: 'btn btn-quiet btn-block', type: 'button', text: u.draftNew });
    cont.onclick = function () {
      closeSheet(true);
      state.data = Object.assign({}, window.NID_HIDDEN_DEFAULTS, saved.data);
      state.step = Math.min(saved.step || 0, LAST_STEP);
      history.replaceState({ step: 0 }, '');
      if (state.step > 0) history.pushState({ step: state.step }, '');
      persist();
      render();
      window.scrollTo(0, 0);
    };
    fresh.onclick = function () {
      closeSheet(true);
      resetForm();
      render();
    };
    openSheet(el('div', { class: 'sheet-body' }, [
      el('h2', { class: 'sheet-title', text: u.draftTitle }),
      el('p', { class: 'sheet-text', text: u.draftBody }),
      cont, fresh,
    ]), { modal: true });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var ob = $('owner-byline');
    if (ob) {
      var o = window.NID_OWNER;
      ob.innerHTML = '';
      ob.appendChild(ownerPhoto(76));
      ob.appendChild(el('p', { class: 'owner-byline-sub', text: o.text.Ara.byline }));
      ob.appendChild(el('p', { class: 'owner-byline-name', text: o.name.Ara }));
    }
    $('lang-ara-btn').onclick = function () { selectLang('Ara'); };
    $('lang-kur-btn').onclick = function () { selectLang('Kur'); };
    history.replaceState({ step: 0 }, '');

    var saved = loadSaved();
    if (saved && (saved.lang === 'Ara' || saved.lang === 'Kur')) {
      state.lang = saved.lang;
      applyLang();
      render();
      if (hasUserData(saved.data)) askAboutDraft(saved);
    } else {
      showLangDialog();
    }
  });

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredInstall = e;
    updateInstall();
  });
  window.addEventListener('appinstalled', function () { deferredInstall = null; updateInstall(); trackEv('app_installed'); });
  function updateInstall() {
    var b = $('install-btn');
    if (b) b.hidden = !canOfferInstall();
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function (e) { console.warn('SW failed', e); });
    });
  }
})();

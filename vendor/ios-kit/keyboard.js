/* Keyboard illustration adapted from kitlangton/ios-kit (MIT).
 * Copyright (c) 2026 Kit Langton. See LICENSE and README.md.
 * Only host lookup is adapted; the upstream keyboard drawing is retained.
 */
(() => {
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue
    if (k === 'class') el.className = v
    else if (k === 'html') el.innerHTML = v
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v)
    else el.setAttribute(k, v === true ? '' : v)
  }
  for (const kid of kids.flat()) if (kid != null) el.append(kid.nodeType ? kid : document.createTextNode(kid))
  return el
}
const S = (d, w = 1.7) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const ICONS = {
  'delete.left': S('M9 5.5h10a1.6 1.6 0 0 1 1.6 1.6v9.8a1.6 1.6 0 0 1-1.6 1.6H9L3.4 12 9 5.5ZM11.6 9.4l5.2 5.2M16.8 9.4l-5.2 5.2', 1.6),
  'face.smiling': '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="9.6" r="1.25" fill="currentColor"/><circle cx="15" cy="9.6" r="1.25" fill="currentColor"/><path d="M7.2 13h9.6a4.8 4.8 0 0 1-9.6 0Z" fill="currentColor"/>',
  'mic': S('M12 2.9a3 3 0 0 1 3 3v6.2a3 3 0 0 1-6 0V5.9a3 3 0 0 1 3-3ZM5.6 11.2a6.4 6.4 0 0 0 12.8 0M12 17.6v3.6M9.2 21.2h5.6', 1.55),
  'arrow.up': S('M12 19.5V4.8M5.6 11.2 12 4.8l6.4 6.4', 2.3),
};
const icon = (name, cls = '') => `<svg class="ios-icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
function keyboard(host, show = true) {
  const screen = host
  let kb = screen.querySelector(':scope > .ios-keyboard')
  if (!kb) {
    kb = h('div', { class: 'ios-keyboard', 'aria-hidden': 'true' })
    const row = (keys, x0) => h('div', { class: 'kr', style: `padding-left:${x0}px` }, ...keys.map((k) => typeof k === 'string' ? h('span', { class: 'k' }, k) : k))
    const key = (cls, html) => h('span', { class: `k ${cls}`, html })
    kb.append(
      h('div', { class: 'sugg' }, h('span', {}, 'I'), h('span', {}, 'The'), h('span', {}, 'I’m')),
      row('QWERTYUIOP'.split(''), 6.7),
      row('ASDFGHJKL'.split(''), 28.2),
      row([key('w fn', '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 3.5 3 12.6h5v7.4h8v-7.4h5Z" fill="currentColor"/></svg>'), h('span', { style: 'width:2.6px' }), ...'ZXCVBNM'.split(''), h('span', { style: 'width:2.6px' }), key('w fn', icon('delete.left'))], 6.7),
      row([key('wide fn', '123'), key('sp', ''), key('ret', icon('arrow.up'))], 6.7),
      h('div', { class: 'kb-bottom', html: `<span>${icon('face.smiling', 'emoji')}</span><span>${icon('mic')}</span>` }),
    )
    screen.append(kb)
  }
  requestAnimationFrame(() => kb.classList.toggle('up', show))
  return kb
}

window.CatpawKeyboardIllustration = keyboard;
})();

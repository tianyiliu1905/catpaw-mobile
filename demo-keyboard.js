/* Desktop-only static keyboard; real mobile devices keep the native keyboard. */
(() => {
  const phone = document.querySelector('#app');
  const panel = document.querySelector('#demo-keyboard');
  const canvas = document.querySelector('#keyboard-canvas');
  const inputs = [document.querySelector('#message'), document.querySelector('#expanded-message')];
  const isNativeMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const designCapture = new URLSearchParams(location.search).has('design-capture');
  if ((isNativeMobile && !designCapture) || !window.CatpawKeyboardIllustration) return;

  window.CatpawKeyboardIllustration(canvas, false);
  let opened = false;
  let movement;
  let keyboardMovement;
  window.CatpawDemoKeyboard = { setOpen, dismiss };
  const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');

  function sizeKeyboard() {
    const scale = phone.clientWidth / 440;
    phone.style.setProperty('--demo-keyboard-scale', String(scale));
    phone.style.setProperty('--demo-keyboard-height', `${344 * scale}px`);
  }
  function setOpen(show, immediate = false) {
    if (show === opened) {
      if (!show && immediate) {
        movement?.cancel();
        keyboardMovement?.cancel();
        if (!panel.hidden) panel.hidden = true;
      }
      return;
    }
    const composer = document.querySelector('.composer-area');
    // Read the currently displayed positions before interrupting either animation.
    const oldTop = composer.getBoundingClientRect().top;
    const keyboardFrom = getComputedStyle(panel).transform;
    movement?.cancel();
    keyboardMovement?.cancel();
    opened = show;
    if (show) { sizeKeyboard(); panel.hidden = false; }
    phone.classList.toggle('keyboard-open', show);
    panel.classList.toggle('is-open', show);
    window.updateInput?.();

    if (immediate || reducedMotion.matches) {
      panel.hidden = !show;
      return;
    }
    // Both transforms start on the same document timeline; no delayed CSS frame.
    const timing = { duration:280, easing:'cubic-bezier(.22,1,.36,1)' };
    const startTime = document.timeline.currentTime;
    const zoom = composer.getBoundingClientRect().width / composer.offsetWidth || 1;
    const delta = (oldTop - composer.getBoundingClientRect().top) / zoom;
    movement = composer.animate(
      [{ transform:`translateY(${delta}px)` }, { transform:'translateY(0)' }], timing
    );
    keyboardMovement = panel.animate(
      [{ transform:keyboardFrom === 'none' ? 'translateY(102%)' : keyboardFrom },
       { transform:show ? 'translateY(0)' : 'translateY(102%)' }], timing
    );
    movement.startTime = startTime;
    keyboardMovement.startTime = startTime;
    keyboardMovement.onfinish = () => { if (!opened) panel.hidden = true; };
  }
  function dismiss(immediate = false) {
    if (inputs.includes(document.activeElement) || document.querySelector('#chat-form').contains(document.activeElement)) document.activeElement.blur();
    setOpen(false, immediate);
  }
  inputs.forEach(input => {
    input.addEventListener('focus', () => setOpen(true));
    // Clicking an already-focused field reopens a manually dismissed keyboard.
    input.addEventListener('click', () => setOpen(true));
  });
  document.querySelector('#chat-form').addEventListener('click', event => {
    if (!event.target.closest('button,.selected-skill,.attachment-preview')) setOpen(true);
  });
  document.querySelector('#keyboard-dismiss').addEventListener('click', () => dismiss());
  // The static illustration should not steal typing focus from the real textarea.
  canvas.addEventListener('pointerdown', event => event.preventDefault());
  document.addEventListener('pointerdown', event => {
    if (!opened) return;
    if (event.target.closest('#chat-form,#editor-layer,#demo-keyboard')) return;
    dismiss(Boolean(event.target.closest('button')));
  }, true);
  document.addEventListener('focusin', event => {
    if (opened && !inputs.includes(event.target) && !panel.contains(event.target) && !event.target.closest('#chat-form')) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && opened && document.querySelector('#editor-layer').hidden) {
      event.preventDefault();dismiss();
    }
  });
  // Opening a sheet, navigation, or a new task also releases the keyboard inset.
  new MutationObserver(() => {
    if (!document.querySelector('#modal-layer').hidden || phone.classList.contains('sidebar-open')) dismiss(true);
    else if (!designCapture && opened && !inputs.includes(document.activeElement) && !panel.contains(document.activeElement) && !document.querySelector('#chat-form').contains(document.activeElement)) setOpen(false);
  }).observe(phone, { attributes:true, attributeFilter:['class','hidden'], subtree:true });
  new ResizeObserver(sizeKeyboard).observe(phone);
  sizeKeyboard();
})();

(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function flash(el, kind) {
    if (!el || reduceMotion) return;
    el.classList.remove('flash', 'flash-good', 'flash-bad', 'flash-warn');
    // Fuerza reflow para repetir la animación si el mismo nodo cambia seguido.
    void el.offsetWidth;
    el.classList.add('flash');
    if (kind) el.classList.add('flash-' + kind);
    window.setTimeout(function () {
      el.classList.remove('flash', 'flash-good', 'flash-bad', 'flash-warn');
    }, 700);
  }

  function kindFor(el) {
    if (!el) return '';
    var cls = el.className || '';
    if (/\b(good|ok)\b/.test(cls)) return 'good';
    if (/\bbad\b/.test(cls)) return 'bad';
    if (/\bwarn\b/.test(cls)) return 'warn';
    return '';
  }

  function observeStatus(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var last = el.textContent;
    var mo = new MutationObserver(function () {
      if (el.textContent === last) return;
      last = el.textContent;
      flash(el, kindFor(el));
    });
    mo.observe(el, { childList: true, characterData: true, subtree: true });
  }

  function addPressFeedback() {
    var buttons = document.querySelectorAll('button, .btn, .pill, .app-nav a');
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('pointerdown', function () {
        btn.classList.add('is-pressed');
      });
      ['pointerup', 'pointerleave', 'blur'].forEach(function (ev) {
        btn.addEventListener(ev, function () {
          btn.classList.remove('is-pressed');
        });
      });
    });
  }

  ready(function () {
    document.documentElement.classList.add('ui-feedback-ready');
    ['status', 'gate', 'arbitroEstado', 'qaEstado', 'validadorStatus', 'validadorRes', 'colorAudit'].forEach(observeStatus);
    addPressFeedback();
  });
})();

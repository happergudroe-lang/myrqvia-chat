/* MYRQVIA Chat 2.0 — icon helpers */
(function () {
  window.MYRQVIA = window.MYRQVIA || {};
  MYRQVIA.icon = function (name, cls) {
    return '<svg class="' + (cls || 'ico') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"></use></svg>';
  };
})();

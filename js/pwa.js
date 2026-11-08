(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
  if (location.pathname.indexOf('/site') === 0) return;

  var reloadKey = 'myrqvia.sw.reloaded';

  function activateWaiting(worker) {
    if (!worker) return;
    try { worker.postMessage({ type: 'SKIP_WAITING' }); } catch (error) { /* noop */ }
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    }).then(function (registration) {
      // Ask for a new worker on every load; it is cheap and keeps typography,
      // cache and auth-shell fixes from being stranded behind an old cache.
      registration.update().catch(function () {});
      if (registration.waiting) activateWaiting(registration.waiting);
      registration.addEventListener('updatefound', function () {
        var installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', function () {
          if (installing.state === 'installed') activateWaiting(registration.waiting || installing);
        });
      });
    }).catch(function () {
      /* PWA is an enhancement, never a blocker. */
    });
  });

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (sessionStorage.getItem(reloadKey) === '1') return;
    try { sessionStorage.setItem(reloadKey, '1'); } catch (error) { /* private mode */ }
    window.location.reload();
  });

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      navigator.serviceWorker.getRegistration().then(function (registration) {
        if (registration) registration.update().catch(function () {});
      }).catch(function () {});
    }
  });
})();

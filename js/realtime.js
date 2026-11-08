/* MYRQVIA Chat — realtime transport adapter (integration-ready).
   Local mode is a safe no-op. Set MYRQVIA_CONFIG.realtimeUrl to a WebSocket
   endpoint to enable live messages, typing and read receipts. */
(function () {
  'use strict';
  var MYRQVIA = window.MYRQVIA = window.MYRQVIA || {};
  var listeners = {};
  var socket = null;
  var mode = 'local';
  var retryTimer = null;
  var retryDelay = 1500;

  function emit(type, payload) {
    (listeners[type] || []).slice().forEach(function (fn) {
      try { fn(payload); } catch (err) { /* keep the prototype alive */ }
    });
  }

  function connect() {
    var config = window.MYRQVIA_CONFIG || {};
    if (!config.realtimeUrl) {
      mode = 'local';
      emit('status', { mode: mode });
      return;
    }
    try {
      socket = new WebSocket(config.realtimeUrl);
    } catch (err) {
      mode = 'local';
      emit('status', { mode: mode, error: String(err) });
      return;
    }
    socket.addEventListener('open', function () {
      mode = 'live';
      retryDelay = 1500;
      emit('status', { mode: mode });
    });
    socket.addEventListener('message', function (event) {
      var data = null;
      try { data = JSON.parse(event.data); } catch (err) { return; }
      if (data && data.type) emit(data.type, data.payload || data);
    });
    socket.addEventListener('close', function () {
      mode = 'offline';
      emit('status', { mode: mode });
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(connect, retryDelay);
      retryDelay = Math.min(retryDelay * 1.8, 20000);
    });
    socket.addEventListener('error', function () {
      emit('status', { mode: 'error' });
    });
  }

  function send(type, payload) {
    if (mode !== 'live' || !socket || socket.readyState !== WebSocket.OPEN) return false;
    try {
      socket.send(JSON.stringify({ type: type, payload: payload }));
      return true;
    } catch (err) {
      return false;
    }
  }

  MYRQVIA.realtime = {
    connect: connect,
    get mode() { return mode; },
    send: send,
    sendMessage: function (payload) { return send('message.send', payload); },
    sendTyping: function (payload) { return send('typing', payload); },
    markRead: function (payload) { return send('message.read', payload); },
    subscribe: function (type, fn) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
      return function () {
        listeners[type] = (listeners[type] || []).filter(function (item) { return item !== fn; });
      };
    }
  };
})();

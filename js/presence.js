/* MYRQVIA presence transport.
   Online is defined by an authenticated, currently open SSE stream.
   No status is seeded, simulated, or time-shifted. If there is no server
   connection, everything is offline instead of pretending to be online. */
(function () {
  'use strict';

  var data = window.MYRQVIA && window.MYRQVIA.data;
  if (!data) return;

  var latest = null;
  var source = null;
  var started = false;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function format(entry) {
    if (!entry) return '离线';
    if (entry.online) return '在线';
    var ts = Number(entry.lastSeenAt || 0);
    if (!ts) return '离线';

    var now = new Date();
    var then = new Date(ts);
    var diff = Math.max(0, Date.now() - ts);

    if (diff < 60 * 1000) return '1 分钟内在线';
    if (diff < 60 * 60 * 1000) {
      return Math.max(1, Math.floor(diff / 60000)) + ' 分钟前在线';
    }

    var hm = pad(then.getHours()) + ':' + pad(then.getMinutes());
    if (then.toDateString() === now.toDateString()) return '今天 ' + hm + ' 在线';

    var yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    if (then.toDateString() === yesterday.toDateString()) return '昨天 ' + hm + ' 在线';

    return (then.getMonth() + 1) + ' 月 ' + then.getDate() + ' 日 ' + hm + ' 在线';
  }

  function decorate(raw) {
    var out = {};
    Object.keys(raw || {}).forEach(function (key) {
      var entry = raw[key] || {};
      out[String(key).toLowerCase()] = {
        online: !!entry.online,
        lastSeenAt: entry.lastSeenAt ? Number(entry.lastSeenAt) : null,
        label: format(entry)
      };
    });
    return out;
  }

  function updateConversation(convo) {
    if (convo.type === 'group') {
      var members = convo.members
        .filter(function (id) { return id !== 'me'; })
        .map(function (id) { return data.people[id]; })
        .filter(Boolean);
      var online = members.filter(function (p) { return p.online; }).length;
      convo.online = online > 0;
      convo.presence = online > 0 ? online + ' 人在线' : members.length + ' 位成员';
    } else {
      var person = data.people[convo.members[0]];
      convo.online = !!(person && person.online);
      convo.presence = person ? person.presence : '离线';
    }
  }

  function updateData(map) {
    Object.keys(data.people).forEach(function (id) {
      var person = data.people[id];
      if (!person) return;
      var entry = person.handle ? map[String(person.handle).toLowerCase()] : null;
      person.online = !!(entry && entry.online);
      person.lastSeenAt = entry && entry.lastSeenAt ? entry.lastSeenAt : null;
      person.presence = entry ? format(entry) : '离线';
    });
    data.conversations.forEach(updateConversation);
  }

  function apply(raw) {
    var map = decorate(raw);
    latest = map;
    updateData(map);
    if (window.MYRQVIA_APP && typeof window.MYRQVIA_APP.applyPresence === 'function') {
      window.MYRQVIA_APP.applyPresence(map);
    } else {
      document.dispatchEvent(new CustomEvent('myrqvia:presence', { detail: map }));
    }
  }

  function offline() {
    // Keep a real last-seen timestamp if one was already received. Never keep
    // an "online" claim without a live stream.
    var map = {};
    Object.keys(data.people).forEach(function (id) {
      var person = data.people[id];
      if (!person) return;
      var key = String(person.handle || '').toLowerCase();
      person.online = false;
      person.presence = format({ online: false, lastSeenAt: person.lastSeenAt });
      if (key) {
        map[key] = {
          online: false,
          lastSeenAt: person.lastSeenAt || null,
          label: person.presence
        };
      }
    });
    data.conversations.forEach(updateConversation);
    latest = map;
    if (window.MYRQVIA_APP && typeof window.MYRQVIA_APP.applyPresence === 'function') {
      window.MYRQVIA_APP.applyPresence(map);
    }
  }

  function keys() {
    var seen = {};
    var list = [];
    Object.keys(data.people).forEach(function (id) {
      var handle = String(data.people[id].handle || '').trim().toLowerCase();
      if (!handle || seen[handle]) return;
      seen[handle] = true;
      list.push(handle);
    });
    return list;
  }

  function connect() {
    if (started || !window.EventSource || location.protocol === 'file:') {
      offline();
      return;
    }
    started = true;
    var list = keys();
    try {
      source = new EventSource('/api/presence/stream?keys=' + encodeURIComponent(list.join(',')));
    } catch (error) {
      offline();
      return;
    }
    source.addEventListener('presence', function (event) {
      try {
        var payload = JSON.parse(event.data || '{}');
        if (payload && payload.presence) apply(payload.presence);
      } catch (error) { /* keep last confirmed snapshot */ }
    });
    source.addEventListener('error', function () {
      // No confirmation means no online claim. EventSource will reconnect.
      offline();
    });
  }

  function refreshLabels() {
    if (!latest) return;
    latest = decorate(latest);
    updateData(latest);
    if (window.MYRQVIA_APP && typeof window.MYRQVIA_APP.applyPresence === 'function') {
      window.MYRQVIA_APP.applyPresence(latest);
    }
  }

  // Clear the demo's seeded status before app.js clones the data.
  offline();
  connect();

  setInterval(refreshLabels, 30000);

  document.addEventListener('myrqvia:app-ready', function () {
    if (latest) window.MYRQVIA_APP && window.MYRQVIA_APP.applyPresence(latest);
  });

  window.MYRQVIA_PRESENCE = {
    refresh: function () {
      if (source) source.close();
      started = false;
      connect();
    },
    state: function () { return latest; }
  };
})();

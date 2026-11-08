/* MYRQVIA auth adapter.
   Remote mode uses the contract in docs/backend-handoff.md.
   The checked-in demo has no server, so an explicit local preview adapter is used. */
(function () {
  'use strict';

  var config = window.MYRQVIA_CONFIG || {};
  var base = String(config.authApiBase || '').replace(/\/+$/, '');
  var remote = config.authMode === 'remote' || (config.authMode !== 'local' && !!base);
  var USERS_KEY = 'myrqvia.auth.users.v1';
  var SESSION_KEY = 'myrqvia.auth.session.v1';
  var DEMO_CODE = '246810';

  function users() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch (error) { return {}; }
  }

  function saveUsers(map) {
    localStorage.setItem(USERS_KEY, JSON.stringify(map));
  }

  function authError(code, message, extra) {
    var error = new Error(message || code || 'auth_error');
    error.code = code || 'auth_error';
    if (extra) Object.keys(extra).forEach(function (key) { error[key] = extra[key]; });
    return error;
  }

  async function request(path, body) {
    var response;
    try {
      response = await fetch(base + path, {
        method: body ? 'POST' : 'GET',
        credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (error) {
      throw authError('network_error', 'Network unavailable');
    }
    var data = {};
    try { data = await response.json(); } catch (error) { data = {}; }
    if (!response.ok || data.ok === false) {
      throw authError(data.error || 'request_failed', data.message || 'Request failed', {
        status: response.status,
        retryAfter: data.retryAfter
      });
    }
    return data;
  }

  function normaliseUser(data) {
    var user = data && data.user ? data.user : data;
    return {
      email: user && user.email ? user.email : '',
      displayName: user && (user.displayName || user.name) ? (user.displayName || user.name) : '',
      username: user && user.username ? user.username : ''
    };
  }

  var service = {
    mode: remote ? 'remote' : 'local',
    demoCode: remote ? null : DEMO_CODE,

    async startEmail(email, purpose) {
      if (remote) {
        return request(purpose === 'recovery' ? '/api/auth/recovery/start' : '/api/auth/email/start', {
          email: email,
          purpose: purpose || 'login'
        });
      }
      var last = Number(localStorage.getItem('myrqvia.auth.lastSend') || 0);
      var elapsed = Math.floor((Date.now() - last) / 1000);
      if (last && elapsed < 60) {
        throw authError('rate_limited', 'Please wait before requesting another code', { retryAfter: 60 - elapsed });
      }
      localStorage.setItem('myrqvia.auth.lastSend', String(Date.now()));
      return { ok: true, retryAfter: 60, localPreview: true };
    },

    async verifyCode(email, code, purpose) {
      if (remote) {
        var url = purpose === 'recovery' ? '/api/auth/recovery/verify' : '/api/auth/email/verify';
        return request(url, { email: email, code: code, purpose: purpose || 'login' });
      }
      if (code !== DEMO_CODE) throw authError('invalid_code', 'The code is incorrect');
      var map = users();
      if (purpose === 'recovery') {
        if (!map[email]) throw authError('account_not_found', 'No MYRQVIA account uses this email');
        return { ok: true, resetToken: 'local-reset:' + email };
      }
      if (purpose === 'register' && map[email]) {
        throw authError('email_exists', 'This email already has a MYRQVIA account');
      }
      return { ok: true, isNewUser: !map[email], user: map[email] || null };
    },

    async checkUsername(value) {
      if (remote) {
        return request('/api/auth/username?value=' + encodeURIComponent(value));
      }
      var regex = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;
      if (!regex.test(value)) return { ok: true, available: false, error: 'invalid_username' };
      var reserved = ['admin', 'root', 'myrqvia', 'support', 'telegram', 'system', 'help'];
      if (reserved.indexOf(value.toLowerCase()) !== -1) return { ok: true, available: false, error: 'reserved_username' };
      var map = users();
      var taken = Object.keys(map).some(function (email) {
        return String(map[email].username || '').toLowerCase() === value.toLowerCase();
      });
      return { ok: true, available: !taken, error: taken ? 'username_taken' : null };
    },

    async register(payload) {
      if (remote) {
        var remoteData = await request('/api/auth/register', payload);
        return remoteData;
      }
      var map = users();
      if (map[payload.email]) throw authError('email_exists', 'This email already has an account');
      var taken = Object.keys(map).some(function (email) {
        return String(map[email].username || '').toLowerCase() === payload.username.toLowerCase();
      });
      if (taken) throw authError('username_taken', 'This username is taken');
      var user = {
        email: payload.email,
        displayName: payload.displayName,
        username: payload.username,
        createdAt: Date.now()
      };
      map[payload.email] = user;
      saveUsers(map);
      return { ok: true, user: user, session: user };
    },

    async recoveryPassword(resetToken, password) {
      if (remote) {
        return request('/api/auth/recovery/password', { resetToken: resetToken, password: password });
      }
      var email = String(resetToken || '').replace('local-reset:', '');
      var map = users();
      if (!map[email]) throw authError('account_not_found', 'No MYRQVIA account uses this email');
      map[email].passwordUpdatedAt = Date.now();
      saveUsers(map);
      return { ok: true };
    },

    async loginWithCode(email, code) {
      return this.verifyCode(email, code, 'login');
    },

    getSession() {
      try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (error) { return null; }
    },

    saveSession(session, token) {
      var safe = {
        email: session.email,
        displayName: session.displayName || session.name || '',
        username: session.username || ''
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(safe));
      if (token) {
        try { sessionStorage.setItem('myrqvia.auth.token', token); } catch (error) { /* noop */ }
      }
      return safe;
    },

    clearSession() {
      localStorage.removeItem(SESSION_KEY);
      try { sessionStorage.removeItem('myrqvia.auth.token'); } catch (error) { /* noop */ }
    }
  };

  window.MYRQVIA_AUTH = service;
})();

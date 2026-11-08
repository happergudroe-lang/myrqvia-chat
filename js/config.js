/* MYRQVIA Chat — deployment configuration.
   The real auth server is same-origin by default (authMode: remote).
   Open login.html directly (file://) or add ?demo=1 to use the local demo. */
(function () {
  'use strict';
  var query = String(location.search || '');
  var forceDemo = /(?:^|[?&])demo=1(?:&|$)/.test(query);
  var filePreview = location.protocol === 'file:';

  window.MYRQVIA_CONFIG = {
    githubUrl: 'https://github.com/',
    myrqviaUrl: 'https://myrqvia.ai/',
    contactEmail: 'happergudroe@gmail.com',
    // Leave empty for the local prototype. Set to wss://... when the server is ready.
    realtimeUrl: '',
    // '' means same-origin. Set to https://your-auth-server.example.com when
    // the frontend is hosted separately from the API.
    authApiBase: '',
    // remote = real email-code API. file:// and ?demo=1 use the local demo.
    authMode: (filePreview || forceDemo) ? 'local' : 'remote',
    // Optional MYRQVIA CORE 1.0 agent bridge, e.g. https://api.example.com/myrqvia
    myrqviaCoreUrl: ''
  };
})();

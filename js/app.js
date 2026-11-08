/* ==========================================================================
   MYRQVIA Chat 2.0 — interaction layer
   A local design prototype. No accounts, no server, no invented capabilities.
   ========================================================================== */
(function () {
  'use strict';

  window.MYRQVIA = window.MYRQVIA || {};

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const icon = (name, cls) => MYRQVIA.icon(name, cls || 'ico');
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const pad = (n) => String(n).padStart(2, '0');

  const STORAGE_KEY = 'myrqvia.messenger.settings.v2';
  const DEFAULT_SETTINGS = {
    theme: 'system',
    chatSize: 'standard',
    reduceMotion: false,
    receipts: true,
    sounds: true,
    noticeBadge: true
  };
  const THEME_LABEL = { system: '跟随系统', light: '浅色', dark: '深色' };
  const SIZE_ORDER = ['small', 'standard', 'large', 'xlarge'];
  const SIZE_LABEL = { small: '小', standard: '标准', large: '大', xlarge: '特大' };
  const REACTIONS = ['❤️', '👍', '😂', '😮', '😢'];
  const STATUS_LABEL = { read: '已读', delivered: '已送达' };

  const STICKER_SETS = {
    emoji: ['😀','😂','🥹','😍','🤔','😎','🥳','😭','😴','🤯','👍','👏','🙏','💪','🔥','✨','❤️','💙','🎉','🌿','☕','🌙','🐱','🐶','🍜','🍰','🎧','📎','💎','🫶','🕊️','🌊'],
    sticker: ['🐱','🐶','🦊','🐼','🐸','🐵','🐧','🦄','🐳','🐻','🐨','🐯','🦁','🐰','🐹','🦋','🌻','🍀','🌈','⭐','🌙','☁️','🍓','🧋','🎧','🎸','📷','🛸','🧸','🫧','💎','🕊️'],
    gif: ['✨','💫','🌊','🔥','🎉','💥','🌈','🫧','🪩','🎬','📽️','🎞️','💿','🎵','🎶','🕺','💃','👏','🫶','❤️‍🔥','💙','🌪️','⭐','🌟']
  };

  const SEARCH_MEDIA = [
    { src: 'assets/gallery/desktop-chat-light.jpg', label: '桌面聊天' },
    { src: 'assets/gallery/mobile-list-light.jpg', label: '会话列表' },
    { src: 'assets/gallery/desktop-contacts.jpg', label: '联系人' },
    { src: 'assets/gallery/mobile-contacts.jpg', label: '联系人 · 手机' },
    { src: 'assets/gallery/desktop-notices.jpg', label: '公告' },
    { src: 'assets/gallery/mobile-me.jpg', label: '我' }
  ];

  const GALLERY = [
    { src: 'assets/gallery/desktop-chat-light.jpg', label: '设计组 · 浅色' },
    { src: 'assets/gallery/mobile-list-light.jpg', label: '会话列表' },
    { src: 'assets/gallery/desktop-contacts.jpg', label: '联系人' },
    { src: 'assets/gallery/desktop-notices.jpg', label: '公告' },
    { src: 'assets/gallery/mobile-me.jpg', label: '我' },
    { src: 'assets/gallery/tablet-chat-light.jpg', label: 'iPad 分栏' },
    { src: 'assets/gallery/mobile-chat-light.jpg', label: '手机聊天' },
    { src: 'assets/gallery/desktop-me.jpg', label: '桌面资料' },
    { src: 'assets/gallery/mobile-notices.jpg', label: '手机公告' }
  ];

  const TRACKS = [
    { title: 'Drift', artist: 'MYRQVIA Sound', src: 'assets/audio/myrqvia-drift.wav', duration: '0:09' },
    { title: 'Night Signal', artist: 'MYRQVIA Sound', src: 'assets/audio/myrqvia-night.wav', duration: '0:09' }
  ];

  const store = {
    people: Object.assign({}, MYRQVIA.data.people),
    conversations: clone(MYRQVIA.data.conversations),
    announcements: clone(MYRQVIA.data.announcements),
    contacts: MYRQVIA.data.contacts.slice(),
    saved: [{
      id: 'saved-1',
      conversationId: 'design',
      conversationName: 'MYRQVIA 设计组',
      fromName: '林深',
      text: '同意，弹窗会打断。未读用一个小蓝点就够。',
      time: '14:18'
    }]
  };

  const state = {
    activeId: 'design',
    route: 'list',
    section: 'messages',
    contactsPageQuery: '',
    replyTo: null,
    forwardMsgId: null,
    search: '',
    contactSearch: '',
    menuMsgId: null,
    activeNoticeId: null,
    noticeOpenCount: 0,
    screen: null,
    scrollTop: false,
    shot: false,
    press: null,
    lastContextAt: 0,
    alertResolve: null,
    toastTimer: null,
    swipe: null,
    suppressChatClick: 0,
    searchTab: 'chat',
    searchQuery: '',
    searchTimer: null,
    stickerTab: 'emoji',
    mediaTab: 'gallery',
    musicIndex: 0,
    typingTimer: null,
    typingResetTimer: null
  };

  let settings = loadSettings();
  let systemThemeMedia = null;
  let audioCtx = null;

  const els = {};

  window.MYRQVIA = window.MYRQVIA || {};
  window.MYRQVIA.features = { openSearch: openSearch, toggleSticker: toggleSticker, openMedia: openMedia, openMusic: openMusic };

  /* ======================================================================
     Boot
     ====================================================================== */

  function remoteSession() {
    try {
      const config = window.MYRQVIA_CONFIG || {};
      if (config.authMode !== 'remote') return null;
      return JSON.parse(localStorage.getItem('myrqvia.auth.session.v1') || 'null');
    } catch (error) {
      return null;
    }
  }

  function clearRemoteDemo() {
    // A real signed-in account must never inherit the design prototype's
    // seeded groups, contacts, saved items or fake messages.
    if (!remoteSession()) return;
    store.conversations = [];
    store.contacts = [];
    store.saved = [];
    store.announcements = [];
    state.activeId = null;
    document.querySelectorAll('.mobile-notice').forEach(function (node) { node.remove(); });
  }

  function contactPerson(profile) {
    const username = String(profile.username || '').toLowerCase();
    const name = String(profile.displayName || username || 'MYRQVIA 用户');
    const tones = ['slate', 'moss', 'clay', 'sand', 'stone'];
    const tone = tones[username.length % tones.length];
    return {
      id: username,
      name,
      handle: username,
      initials: name.slice(0, 1).toUpperCase(),
      tone,
      online: false,
      presence: '离线',
      role: ''
    };
  }

  function upsertRemoteContact(profile) {
    const p = contactPerson(profile);
    store.people[p.id] = p;
    if (!store.contacts.some((entry) => entry.id === p.id)) {
      store.contacts.push({ id: p.id, note: '@' + p.handle });
    }
    return p;
  }

  async function loadRemoteContacts() {
    if (!remoteSession()) return;
    try {
      const res = await fetch('/api/contacts', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      store.contacts = [];
      (data.contacts || []).forEach(upsertRemoteContact);
      renderContactsPage();
      renderList();
      renderTabPages();
    } catch (error) { /* offline */ }
  }

  function init() {
    cacheElements();
    const config = window.MYRQVIA_CONFIG || {};
    if (config.authMode === 'remote' && !remoteSession()) {
      window.location.replace('/login');
      return;
    }
    readQuery();
    applyAllSettings();
    applySessionIdentity();
    clearRemoteDemo();
    bindStaticEvents();
    renderAll();
    renderTabPages();
    loadRemoteContacts();
    if (MYRQVIA.realtime) {
      MYRQVIA.realtime.connect();
      MYRQVIA.realtime.subscribe('message.new', function (payload) {
        if (!payload || !payload.conversationId) return;
        const convo = store.conversations.find(function (c) { return c.id === payload.conversationId; });
        if (!convo) return;
        convo.messages.push(payload.message);
        convo.time = '现在';
        hidePeerTyping();
        if (state.activeId === convo.id) renderChat({ scroll: 'bottom', animate: false });
        renderList();
      });
      MYRQVIA.realtime.subscribe('typing', function (payload) {
        if (!payload || payload.conversationId !== state.activeId) return;
        if (payload.typing) showPeerTyping(payload.conversationId);
        else hidePeerTyping();
      });
    }
    setSection('messages', { silent: true });
    setRoute(initialRoute());
    updateSearchHint();
    document.documentElement.dataset.ready = 'true';
    applyQueryScreen();

    requestAnimationFrame(() => {
      scrollToBottom(true);
      updateJumpButton();
    });
    setTimeout(() => {
      scrollToBottom(true);
      updateJumpButton();
    }, 180);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => scrollToBottom(true)).catch(() => {});
    }
  }

  function applySessionIdentity() {
    try {
      const session = JSON.parse(localStorage.getItem('myrqvia.auth.session.v1') || 'null');
      if (!session || !session.displayName) return;
      const me = store.people.me;
      me.name = session.displayName;
      me.handle = session.username || me.handle;
      me.initials = String(me.name).slice(0, 1);
      document.querySelectorAll('[data-me-name]').forEach(function (el) { el.textContent = me.name; });
      document.querySelectorAll('[data-me-avatar]').forEach(function (el) { el.textContent = me.initials; });
    } catch (err) { /* local prototype */ }
  }

  function cacheElements() {
    els.html = document.documentElement;
    els.app = $('#app');
    els.sidebar = $('#sidebar');
    els.rail = $('#rail');
    els.tabbar = $('#tabbar');
    els.contactsPageList = $('#contacts-page-list');
    els.contactsSearch = $('#contacts-search');
    els.contactsCount = $('#contacts-count');
    els.friendForm = $('#friend-form');
    els.friendHandle = $('#friend-handle');
    els.friendError = $('#friend-error');
    els.friendSubmit = $('#friend-submit');
    els.noticesPageList = $('#notices-page-list');
    els.meThemeValue = $('#me-theme-value');
    els.meFontValue = $('#me-font-value');
    els.meMotionValue = $('#me-motion-value');
    els.railNoticeDot = $('#rail-notice-dot');
    els.tabNoticeDot = $('#tab-notice-dot');
    els.archiveRow = $('#archive-row');
    els.archiveCount = $('#archive-count');
    els.archiveList = $('#archive-list');
    els.savedList = $('#saved-list');
    els.meSavedCount = $('#me-saved-count');
    els.profileAvatar = $('#profile-avatar');
    els.profileName = $('#profile-name');
    els.profileHandle = $('#profile-handle');
    els.profileUsername = $('#profile-username');
    els.profileId = $('#profile-id');
    els.profileNote = $('#profile-note');
    els.profileSeen = $('#profile-seen');
    els.profileMessage = $('#profile-message');
    els.searchLayer = $('#search-layer');
    els.searchAll = $('#search-all');
    els.searchBody = $('#search-body');
    els.searchClear = $('#search-clear');
    els.stickerPanel = $('#sticker-panel');
    els.stickerGrid = $('#sticker-grid');
    els.emojiBtn = $('#emoji-btn');
    els.musicPlay = $('#music-play');
    els.mediaLayer = $('#media-layer');
    els.mediaContent = $('#media-content');
    els.musicLayer = $('#music-layer');
    els.musicTitle = $('#music-title');
    els.musicArtist = $('#music-artist');
    els.musicSeek = $('#music-seek');
    els.musicCurrent = $('#music-current');
    els.musicDuration = $('#music-duration');
    els.musicList = $('#music-list');
    els.cameraInput = $('#camera-input');
    els.cameraVideo = $('#camera-video');
    els.cameraCanvas = $('#camera-canvas');
    els.cameraStatus = $('#camera-status');
    els.cameraShutter = $('#camera-shutter');
    els.cameraSwitch = $('#camera-switch');
    els.cameraFallback = $('#camera-fallback');
    els.chatList = $('#chat-list');
    els.search = $('#search-input');
    els.chat = $('#chat');
    els.chatScroll = $('#chat-scroll');
    els.chatInner = $('#chat-inner');
    els.messages = $('#messages');
    els.chatDay = $('#chat-day');
    els.peerName = $('#peer-name');
    els.peerSub = $('#peer-sub');
    els.input = $('#message-input');
    els.composer = $('#composer');
    els.send = $('#send-btn');
    els.plus = $('#plus-btn');
    els.replyPreview = $('#reply-preview');
    els.replyLabel = $('#reply-label');
    els.replyText = $('#reply-text');
    els.replyClose = $('#reply-close');
    els.jump = $('#jump-bottom');
    els.toast = $('#toast');
    els.toastText = $('#toast-text');
    els.noticeDot = $('#notice-dot');
    els.mobileNoticeDot = $('#mobile-notice-dot');
    els.noticeBody = $('#notice-body');
    els.infoBody = $('#info-body');
    els.contactList = $('#contact-list');
    els.contactSearch = $('#contact-search');
    els.composeTitle = $('#compose-title');
    els.contextLayer = $('#context-layer');
    els.contextMenu = $('#context-menu');
    els.reactionBar = $('#reaction-bar');
    els.contextActions = $('#context-actions');
    els.attachLayer = $('#attach-layer');
    els.attachMenu = $('#attach-menu');
    els.actionSheet = $('#action-sheet');
    els.alertTitle = $('#alert-title');
    els.alertBody = $('#alert-body');
    els.alertConfirm = $('#alert-confirm');
    els.photoInput = $('#photo-input');
    els.fileInput = $('#file-input');
    els.networkBar = $('#network-bar');
    els.messagesEl = els.messages;
  }

  /* ======================================================================
     Query parameters — deterministic states for screenshots & review
     ====================================================================== */

  function readQuery() {
    const params = new URLSearchParams(location.search);
    state.screen = params.get('screen');
    state.scrollTop = params.get('scroll') === 'top';
    state.shot = params.get('shot') === '1';

    if (state.shot) els.html.dataset.shot = 'true';
    if (params.get('safe') === '1') {
      els.html.style.setProperty('--safe-top', '54px');
      els.html.style.setProperty('--safe-bottom', '34px');
    }
    const theme = params.get('theme');
    if (theme === 'light' || theme === 'dark' || theme === 'system') settings.theme = theme;
    if (params.get('motion') === 'reduce') settings.reduceMotion = true;
    if (params.get('chat') && store.conversations.some((c) => c.id === params.get('chat'))) {
      state.activeId = params.get('chat');
    }
    if (params.get('notice')) state.activeNoticeId = params.get('notice');
    state.queryMsg = params.get('msg') || 'd13';
    state.recallFrame = params.has('recallFrame') ? clamp(Number(params.get('recallFrame')) || 0, 0, 1740) : null;
  }

  function initialRoute() {
    if (!isMobile()) return 'chat';
    if (state.screen === 'chat' || state.screen === 'info' || state.screen === 'context') return 'chat';
    return 'list';
  }

  function applyQueryScreen() {
    const screen = state.screen;
    if (state.recallFrame !== null) {
      setRoute('chat');
      requestAnimationFrame(function () {
        const row = els.messages.querySelector('.msg[data-id=d13]');
        if (!row) return;
        const bubble = row.querySelector('.bubble');
        if (!bubble) return;
        els.chatScroll.scrollTop = Math.max(0, row.offsetTop - els.chatScroll.clientHeight / 2 + row.offsetHeight / 2);
        row.classList.add('is-recalling');
        if (window.MYRQVIA && MYRQVIA.recall) {
          MYRQVIA.recall.play(bubble, { host: els.chatInner, freezeAt: state.recallFrame });
        }
      });
      return;
    }
    if (!screen) {
      if (state.scrollTop) els.chatScroll.scrollTop = 0;
      return;
    }
    if (screen === 'list') { setRoute('list'); return; }
    if (screen === 'contacts' || screen === 'notices' || screen === 'toolbox' || screen === 'me') { setSection(screen); setRoute('list'); return; }
    if (screen === 'chat') { setRoute('chat'); return; }
    if (screen === 'settings') { openSettings(); return; }
    if (screen === 'notice') { openNotices(state.activeNoticeId || 'beta'); return; }
    if (screen === 'info') { openInfo(); return; }
    if (screen === 'compose') { openCompose('new'); return; }
    if (screen === 'context') {
      setRoute('chat');
      openContextAfterScroll(state.queryMsg);
      return;
    }
    if (state.scrollTop) els.chatScroll.scrollTop = 0;
  }

  function openContextAfterScroll(msgId) {
    const row = els.messages.querySelector('.msg[data-id="' + cssEscape(msgId) + '"]');
    if (!row) return;
    const targetTop = row.offsetTop - els.chatScroll.clientHeight / 2 + row.offsetHeight / 2;
    els.chatScroll.scrollTop = Math.max(0, targetTop);
    requestAnimationFrame(() => openContext(msgId));
  }

  /* ======================================================================
     Settings
     ====================================================================== */

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.assign({}, DEFAULT_SETTINGS);
      return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw));
    } catch (err) {
      return Object.assign({}, DEFAULT_SETTINGS);
    }
  }

  function saveSettings() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (err) { /* private mode */ }
  }

  function applyAllSettings() {
    applyTheme();
    applyMotion();
    applyChatSize();
    syncSettingsUI();
    updateBadges();
    renderMe();
  }

  function effectiveTheme() {
    if (settings.theme === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return settings.theme === 'dark' ? 'dark' : 'light';
  }

  function applyTheme() {
    const theme = effectiveTheme();
    els.html.dataset.theme = theme;
    els.html.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff');
    $$('.segmented [data-theme-choice]').forEach((btn) => {
      const active = btn.dataset.themeChoice === settings.theme;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-checked', active ? 'true' : 'false');
    });
  }

  function applyMotion() {
    els.html.dataset.reduceMotion = settings.reduceMotion ? 'true' : 'false';
  }

  function applyChatSize() {
    els.html.dataset.chatSize = settings.chatSize;
    const index = Math.max(0, SIZE_ORDER.indexOf(settings.chatSize));
    const range = $('#chat-size-range');
    if (range) {
      range.value = String(index);
      updateRangeFill(range);
    }
    const label = $('#chat-size-label');
    if (label) label.textContent = SIZE_LABEL[settings.chatSize] || '标准';
  }

  function updateRangeFill(range) {
    const min = Number(range.min) || 0;
    const max = Number(range.max) || 3;
    const pct = ((Number(range.value) - min) / (max - min)) * 100;
    range.style.setProperty('--fill', pct + '%');
  }

  function syncSettingsUI() {
    $$('[data-theme-choice]').forEach((btn) => {
      const active = btn.dataset.themeChoice === settings.theme;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-checked', active ? 'true' : 'false');
    });
    const toggleMap = {
      'reduce-motion': 'reduceMotion',
      receipts: 'receipts',
      sounds: 'sounds',
      'notice-badge': 'noticeBadge'
    };
    Object.keys(toggleMap).forEach((key) => {
      const el = document.querySelector('[data-toggle="' + key + '"]');
      if (el) el.setAttribute('aria-checked', settings[toggleMap[key]] ? 'true' : 'false');
    });
    applyChatSize();
    applyMotion();
    updateBadges();
    syncMePage();
  }

  function setToggle(key) {
    const map = {
      'reduce-motion': 'reduceMotion',
      receipts: 'receipts',
      sounds: 'sounds',
      'notice-badge': 'noticeBadge'
    };
    const prop = map[key];
    if (!prop) return;
    settings[prop] = !settings[prop];
    saveSettings();
    if (prop === 'reduceMotion') applyMotion();
    if (prop === 'noticeBadge') updateBadges();
    if (prop === 'receipts') renderChat({ scroll: 'preserve', animate: false });
    if (prop === 'sounds' && settings.sounds) playSound('send');
    syncSettingsUI();
  }

  function setTheme(choice) {
    if (!THEME_LABEL[choice]) return;
    settings.theme = choice;
    saveSettings();
    applyTheme();
    syncSettingsUI();
  }

  function updateBadges() {
    const unread = store.announcements.some((a) => a.unread);
    const visible = unread && settings.noticeBadge;
    if (els.noticeDot) els.noticeDot.hidden = !visible;
    if (els.mobileNoticeDot) els.mobileNoticeDot.hidden = !visible;
    if (els.railNoticeDot) els.railNoticeDot.hidden = !visible;
    if (els.tabNoticeDot) els.tabNoticeDot.hidden = !visible;
  }

  function renderMe() {
    const me = store.people.me;
    $$('[data-me-name]').forEach((el) => { el.textContent = me.name; });
    $$('[data-me-avatar]').forEach((el) => {
      el.textContent = me.initials;
      el.className = el.className.replace(/tone-\w+/g, 'tone-' + me.tone);
    });
  }

  /* ======================================================================
     Render — list, chat, components
     ====================================================================== */

  function renderAll() {
    renderMe();
    renderList();
    renderChat({ animate: !state.shot, scroll: 'bottom' });
    syncSettingsUI();
    updateBadges();
  }

  function activeConversation() {
    return store.conversations.find((c) => c.id === state.activeId) || null;
  }

  function person(id) {
    return store.people[id] || { id: id, name: '未知', initials: '?', tone: 'stone', online: false };
  }

  function avatarHTML(id, cls, withDot) {
    const p = person(id);
    return '<span class="avatar ' + (cls || '') + ' tone-' + p.tone + '">' + esc(p.initials) +
      (withDot && p.online ? '<span class="online-dot"></span>' : '') + '</span>';
  }

  function convoAvatarHTML(convo, cls) {
    if (convo.type === 'group') {
      return '<span class="avatar-stack">' +
        convo.members.slice(0, 3).map((id) => avatarHTML(id, '', false)).join('') +
        '</span>';
    }
    const p = person(convo.members[0]);
    return avatarHTML(p.id, cls || '', !!convo.online);
  }

  function previewOfMessage(msg) {
    if (!msg) return '';
    if (msg.recalled) return '消息已撤回';
    if (msg.kind === 'file') return '文件 · ' + (msg.fileName || '附件');
    if (msg.kind === 'image') return '图片';
    return String(msg.text || '').replace(/\s+/g, ' ').trim();
  }

  function previewFor(convo) {
    const last = convo.messages[convo.messages.length - 1];
    if (!last) return '开始对话';
    let body = previewOfMessage(last);
    if (last.recalled) {
      const who = last.from === 'me' ? '你' : person(last.from).name;
      return who + '撤回了一条消息';
    }
    if (convo.type === 'group') {
      return (last.from === 'me' ? '你：' : person(last.from).name + '：') + body;
    }
    return last.from === 'me' ? '你：' + body : body;
  }

  function truncate(text, max) {
    const s = String(text || '');
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  }

  function renderList() {
    const sorted = store.conversations.slice().sort((a, b) => {
      if (a.pinned === b.pinned) return 0;
      return a.pinned ? -1 : 1;
    });
    const query = state.search.trim().toLowerCase();
    const visible = sorted.filter((convo) => {
      if (convo.archived) return false;
      if (!query) return true;
      const haystack = [
        convo.name,
        previewFor(convo),
        convo.members.map((id) => person(id).name).join(' ')
      ].join(' ').toLowerCase();
      return haystack.indexOf(query) !== -1;
    });

    if (!visible.length) {
      els.chatList.innerHTML = '<div class="list-empty">' + icon('search') +
        '<span>' + (store.conversations.length ? '没有找到相关会话<br>试试搜索联系人名字' : '还没有对话<br>去「联系人」添加好友') + '</span></div>';
      updateArchiveEntry();
      updateSavedCount();
      return;
    }

    els.chatList.innerHTML = visible.map((convo) => {
      const active = convo.id === state.activeId;
      const unread = convo.unread > 0;
      const flags = [];
      if (convo.muted) flags.push(icon('muted'));
      if (unread) flags.push('<span class="unread-dot"></span>');
      const pin = convo.pinned ? icon('pin', 'ico chat-row-pin') : '';
      return '<div class="chat-row-shell" role="listitem" data-shell="' + esc(convo.id) + '">' +
        '<button type="button" class="chat-row' +
        (active ? ' is-active' : '') + (unread ? ' is-unread' : '') +
        '" data-chat="' + esc(convo.id) + '"' + (active ? ' aria-current="true"' : '') + '>' +
        convoAvatarHTML(convo) +
        '<span class="chat-row-main">' +
          '<span class="chat-row-top">' +
            '<span class="chat-row-name-wrap">' +
              '<span class="chat-row-name">' + esc(convo.name) + '</span>' + pin +
            '</span>' +
            '<span class="chat-row-time">' + esc(convo.time || '') + '</span>' +
          '</span>' +
          '<span class="chat-row-bottom">' +
            '<span class="chat-row-preview">' + esc(previewFor(convo)) + '</span>' +
            '<span class="chat-row-flags">' + flags.join('') + '</span>' +
          '</span>' +
        '</span>' +
      '</button>' +
        '<button type="button" class="chat-row-archive" data-archive-id="' + esc(convo.id) + '">归档</button>' +
      '</div>';
    }).join('');
    updateArchiveEntry();
    updateSavedCount();
  }

  /* ======================================================================
     Archive / favourites
     ====================================================================== */

  function updateArchiveEntry() {
    const count = store.conversations.filter((c) => c.archived).length;
    if (els.archiveRow) els.archiveRow.hidden = !count;
    if (els.archiveCount) els.archiveCount.textContent = count + ' 个会话';
  }

  function updateSavedCount() {
    if (els.meSavedCount) {
      els.meSavedCount.textContent = store.saved.length + ' 条';
    }
  }

  function renderArchiveList() {
    if (!els.archiveList) return;
    const items = store.conversations.filter((c) => c.archived);
    if (!items.length) {
      els.archiveList.innerHTML = '<div class="archive-empty">没有已归档的会话</div>';
      return;
    }
    els.archiveList.innerHTML = items.map((convo) => {
      return '<div class="archive-item">' +
        '<button type="button" class="archive-open" data-archive-open="' + esc(convo.id) + '">' +
          convoAvatarHTML(convo) +
          '<span class="archive-item-main"><span class="archive-item-name">' + esc(convo.name) + '</span>' +
          '<span class="archive-item-preview">' + esc(previewFor(convo)) + '</span></span>' +
        '</button>' +
        '<button type="button" class="archive-unarchive" data-unarchive="' + esc(convo.id) + '" aria-label="取消归档">' +
          icon('undo') + '</button>' +
      '</div>';
    }).join('');
  }

  function openArchive() {
    renderArchiveList();
    openLayer('archive');
  }

  function archiveConversation(id) {
    const convo = store.conversations.find((c) => c.id === id);
    if (!convo || convo.archived) return;
    convo.archived = true;
    if (state.activeId === id) {
      const next = store.conversations.find((c) => !c.archived);
      if (next) state.activeId = next.id;
      else state.activeId = null;
      setRoute('list');
    }
    renderList();
    renderArchiveList();
    updateArchiveEntry();
    showToast('已归档到「已归档」');
  }

  function unarchiveConversation(id) {
    const convo = store.conversations.find((c) => c.id === id);
    if (!convo) return;
    convo.archived = false;
    renderList();
    renderArchiveList();
    updateArchiveEntry();
    showToast('已取消归档');
  }

  function renderSavedList() {
    if (!els.savedList) return;
    if (!store.saved.length) {
      els.savedList.innerHTML = '<div class="saved-empty">还没有收藏的消息<br>长按任意消息，选择「收藏」</div>';
      updateSavedCount();
      return;
    }
    els.savedList.innerHTML = store.saved.map((item) => {
      return '<div class="saved-item">' +
        '<span class="saved-icon">' + icon('star') + '</span>' +
        '<button type="button" class="saved-main" data-saved-open="' + esc(item.conversationId) + '">' +
          '<span class="saved-meta">' + esc(item.conversationName) + ' · ' + esc(item.fromName) + ' · ' + esc(item.time) + '</span>' +
          '<span class="saved-text">' + esc(item.text) + '</span>' +
        '</button>' +
        '<button type="button" class="saved-remove" data-saved-remove="' + esc(item.id) + '" aria-label="取消收藏">' +
          icon('x') + '</button>' +
      '</div>';
    }).join('');
    updateSavedCount();
  }

  function openSaved() {
    renderSavedList();
    openLayer('saved');
  }

  function saveMessage(msg) {
    const convo = activeConversation();
    if (!convo || !msg) return;
    const exists = store.saved.some((item) => item.conversationId === convo.id && item.messageId === msg.id);
    if (exists) { showToast('这条消息已在收藏中'); return; }
    const text = msg.kind === 'file' ? '[文件] ' + (msg.fileName || '') :
      msg.kind === 'image' ? '[图片]' : (msg.text || '');
    store.saved.unshift({
      id: uid(),
      messageId: msg.id,
      conversationId: convo.id,
      conversationName: convo.name,
      fromName: msg.from === 'me' ? '你' : person(msg.from).name,
      text: text,
      time: msg.time || nowTime()
    });
    updateSavedCount();
    renderSavedList();
    showToast('已收藏');
  }

  function showPeerTyping(conversationId) {
    const convo = activeConversation();
    if (!convo || (conversationId && convo.id !== conversationId)) return;
    if (state.typingTimer) clearTimeout(state.typingTimer);
    hidePeerTyping();
    const row = document.createElement('div');
    row.className = 'msg typing-row';
    row.setAttribute('aria-label', '对方正在输入');
    const typingPerson = convo.type === 'dm' ? convo.members[0] : (convo.members || [])[0];
    row.innerHTML = '<span class="msg-gutter">' + (typingPerson ? avatarHTML(typingPerson, 'avatar', true) : '') + '</span>' +
      '<div class="msg-content"><div class="typing-bubble"><i></i><i></i><i></i></div></div>';
    els.messages.appendChild(row);
    scrollToBottom(true);
    const listRow = els.chatList.querySelector('[data-chat="' + cssEscape(convo.id) + '"]');
    if (listRow) listRow.classList.add('is-peer-typing');
    state.typingTimer = setTimeout(hidePeerTyping, 2600);
  }

  function hidePeerTyping() {
    if (state.typingTimer) { clearTimeout(state.typingTimer); state.typingTimer = null; }
    const row = els.messages.querySelector('.typing-row');
    if (row) row.remove();
    els.chatList.querySelectorAll('.is-peer-typing').forEach(function (item) { item.classList.remove('is-peer-typing'); });
  }

  function notifyTyping() {
    if (!MYRQVIA.realtime) return;
    MYRQVIA.realtime.sendTyping({ conversationId: state.activeId, typing: true });
    if (state.typingResetTimer) clearTimeout(state.typingResetTimer);
    state.typingResetTimer = setTimeout(function () {
      MYRQVIA.realtime.sendTyping({ conversationId: state.activeId, typing: false });
    }, 1400);
  }

  /* ======================================================================
     Search, stickers, attachments, music
     ====================================================================== */

  function openSearch() {
    state.searchQuery = '';
    if (els.searchAll) els.searchAll.value = '';
    renderSearch();
    openLayer('search');
    setTimeout(function () { try { els.searchAll.focus(); } catch (e) {} }, 120);
  }

  function renderSearch(skeleton) {
    if (!els.searchBody) return;
    if (skeleton) {
      els.searchBody.innerHTML = '<div class="search-skeleton">' +
        '<div class="skeleton-row"><span class="skeleton-circle"></span><span class="skeleton-lines"><span class="skeleton-line"></span><span class="skeleton-line short"></span></span></div>' +
        '<div class="skeleton-row"><span class="skeleton-circle"></span><span class="skeleton-lines"><span class="skeleton-line"></span><span class="skeleton-line short"></span></span></div>' +
        '<div class="skeleton-row"><span class="skeleton-circle"></span><span class="skeleton-lines"><span class="skeleton-line"></span><span class="skeleton-line short"></span></span></div>' +
        '</div>';
      return;
    }
    const q = (state.searchQuery || '').trim().toLowerCase();
    const tab = state.searchTab;
    if (!q && tab === 'chat') {
      els.searchBody.innerHTML = '<p class="search-hint-title">最近联系</p>' +
        store.conversations.slice(0, 4).map(function (convo) {
          return '<button type="button" class="search-result" data-search-chat="' + esc(convo.id) + '">' +
            convoAvatarHTML(convo) + '<span class="search-result-copy"><b>' + esc(convo.name) + '</b><span>' + esc(previewFor(convo)) + '</span></span>' + icon('chevron', 'ico row-chevron') + '</button>';
        }).join('');
      return;
    }
    if (!q && tab === 'contacts') {
      els.searchBody.innerHTML = '<p class="search-hint-title">联系人</p>' +
        store.contacts.slice(0, 6).map(function (entry) {
          const personData = person(entry.id);
          return '<button type="button" class="search-result" data-search-contact="' + esc(entry.id) + '">' +
            avatarHTML(entry.id, 'avatar', true) + '<span class="search-result-copy"><b>' + esc(personData.name) + '</b><span>@' + esc(personData.handle) + '</span></span>' + icon('chevron', 'ico row-chevron') + '</button>';
        }).join('');
      return;
    }
    if (tab === 'media') {
      els.searchBody.innerHTML = '<p class="search-hint-title">最近媒体</p><div class="search-media-grid">' +
        SEARCH_MEDIA.map(function (item) {
          return '<button type="button" data-search-media="' + esc(item.src) + '"><img src="' + esc(item.src) + '" alt="' + esc(item.label) + '" loading="lazy"></button>';
        }).join('') + '</div>';
      return;
    }
    if (tab === 'files') {
      const rows = [];
      store.conversations.forEach(function (convo) {
        convo.messages.forEach(function (msg) {
          if (msg.kind === 'file') rows.push({ convo: convo, msg: msg });
        });
      });
      els.searchBody.innerHTML = rows.length ? rows.map(function (item) {
        return '<button type="button" class="search-file-row" data-search-chat="' + esc(item.convo.id) + '">' + icon('file') +
          '<span><b>' + esc(item.msg.fileName || '附件') + '</b><small>' + esc(item.convo.name) + ' · ' + esc(item.msg.time || '') + '</small></span></button>';
      }).join('') : '<div class="search-empty">没有文件</div>';
      return;
    }
    if (tab === 'chat') {
      const rows = store.conversations.filter(function (convo) {
        return !q || (convo.name + ' ' + previewFor(convo)).toLowerCase().indexOf(q) !== -1;
      });
      els.searchBody.innerHTML = rows.length ? rows.map(function (convo) {
        return '<button type="button" class="search-result" data-search-chat="' + esc(convo.id) + '">' +
          convoAvatarHTML(convo) + '<span class="search-result-copy"><b>' + esc(convo.name) + '</b><span>' + esc(previewFor(convo)) + '</span></span>' + icon('chevron', 'ico row-chevron') + '</button>';
      }).join('') : '<div class="search-empty">没有匹配的聊天</div>';
    }
  }

  function scheduleSearch() {
    state.searchQuery = els.searchAll ? els.searchAll.value : '';
    if (state.searchTimer) clearTimeout(state.searchTimer);
    renderSearch(true);
    state.searchTimer = setTimeout(function () { renderSearch(false); }, 180);
  }

  function renderStickers() {
    if (!els.stickerGrid) return;
    const list = STICKER_SETS[state.stickerTab] || STICKER_SETS.emoji;
    els.stickerGrid.innerHTML = list.map(function (value) {
      const large = state.stickerTab !== 'emoji';
      return '<button type="button" class="sticker-item' + (large ? ' is-large' : '') + (state.stickerTab === 'gif' ? ' is-gif' : '') + '" data-sticker="' + esc(value) + '">' + value + '</button>';
    }).join('');
    $$('.sticker-tabs button').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.stickerTab === state.stickerTab);
    });
  }

  function toggleSticker(force) {
    if (!els.stickerPanel) return;
    const next = typeof force === 'boolean' ? force : els.stickerPanel.hidden;
    els.stickerPanel.hidden = !next;
    if (next) renderStickers();
  }

  function openMedia(tab) {
    state.mediaTab = tab || 'gallery';
    renderMedia();
    openLayer('media');
    toggleSticker(false);
  }

  function renderMedia() {
    if (!els.mediaContent) return;
    $$('#media-tabs button').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.mediaTab === state.mediaTab);
    });
    if (state.mediaTab === 'gallery') {
      els.mediaContent.innerHTML = '<div class="media-gallery-top"><p class="media-title">最近照片</p><button class="media-camera-btn" type="button" id="media-camera">' + icon('camera') + '拍照</button></div><div class="media-gallery">' +
        GALLERY.map(function (item) {
          return '<button type="button" data-media-image="' + esc(item.src) + '"><img src="' + esc(item.src) + '" alt="' + esc(item.label) + '" loading="lazy"></button>';
        }).join('') + '</div>';
    } else if (state.mediaTab === 'gift') {
      els.mediaContent.innerHTML = '<p class="media-title">礼物</p><div class="media-gift-grid">' +
        ['🎁','🌹','🧸','🍰','☕','💎','🕊️','🎧'].map(function (gift) {
          return '<button type="button" data-media-send="' + gift + ' 送给你"><span>' + gift + '</span>发送</button>';
        }).join('') + '</div>';
    } else if (state.mediaTab === 'file') {
      els.mediaContent.innerHTML = '<div class="media-file-card">' + icon('file') + '<div><b>从设备选择文件</b><small>本地预览，不上传服务器</small></div></div>' +
        '<button type="button" class="media-action-btn" id="media-file-pick">选择文件</button>';
    } else if (state.mediaTab === 'wallet') {
      els.mediaContent.innerHTML = '<div class="media-action-card"><h3>MYRQVIA Wallet</h3><p>本地演示余额 · 0.10 Gram<br>真实支付未接入。</p><button type="button" class="media-action-btn" data-media-send="💎 0.1 Gram（本地演示）">发送 0.1 Gram</button></div>';
    } else if (state.mediaTab === 'location') {
      els.mediaContent.innerHTML = '<p class="media-title">当前位置</p><div class="media-location"></div><div class="media-action-card"><h3>上海 · 静安</h3><p>共享位置为本地演示，不会上传坐标。</p><button type="button" class="media-action-btn" data-media-send="📍 位置：上海 · 静安">发送位置</button></div>';
    } else if (state.mediaTab === 'music') {
      els.mediaContent.innerHTML = '<p class="media-title">MYRQVIA Sound</p>' + TRACKS.map(function (track, index) {
        return '<button type="button" class="media-track" data-music-index="' + index + '"><span class="track-art">' + icon('music') + '</span><span><b>' + esc(track.title) + '</b><small>' + esc(track.artist) + ' · ' + esc(track.duration) + '</small></span></button>';
      }).join('');
    }
  }

  function sendMediaText(text) {
    addOutgoing({ kind: 'text', text: text });
    closeLayer('media');
  }

  let audioPlayer = null;

  function getAudio() {
    if (audioPlayer) return audioPlayer;
    audioPlayer = new Audio();
    audioPlayer.addEventListener('timeupdate', function () {
      if (!audioPlayer.duration) return;
      els.musicSeek.value = String(Math.round((audioPlayer.currentTime / audioPlayer.duration) * 1000));
      els.musicCurrent.textContent = formatTime(audioPlayer.currentTime);
      els.musicDuration.textContent = formatTime(audioPlayer.duration);
    });
    audioPlayer.addEventListener('loadedmetadata', function () {
      els.musicDuration.textContent = formatTime(audioPlayer.duration);
    });
    audioPlayer.addEventListener('play', function () {
      els.musicPlay.querySelector('use').setAttribute('href', '#i-pause');
      els.musicPlay.setAttribute('aria-label', '暂停');
    });
    audioPlayer.addEventListener('pause', function () {
      els.musicPlay.querySelector('use').setAttribute('href', '#i-play');
      els.musicPlay.setAttribute('aria-label', '播放');
    });
    audioPlayer.addEventListener('ended', function () { loadTrack((state.musicIndex + 1) % TRACKS.length, true); });
    return audioPlayer;
  }

  function formatTime(seconds) {
    const value = Math.max(0, Math.floor(seconds || 0));
    return Math.floor(value / 60) + ':' + String(value % 60).padStart(2, '0');
  }

  function loadTrack(index, autoplay) {
    const audio = getAudio();
    state.musicIndex = (index + TRACKS.length) % TRACKS.length;
    const track = TRACKS[state.musicIndex];
    audio.src = track.src;
    els.musicTitle.textContent = track.title;
    els.musicArtist.textContent = track.artist;
    els.musicCurrent.textContent = '0:00';
    els.musicDuration.textContent = track.duration;
    els.musicSeek.value = '0';
    els.musicList.innerHTML = TRACKS.map(function (item, i) {
      return '<button type="button" class="music-track' + (i === state.musicIndex ? ' is-active' : '') + '" data-music-track="' + i + '"><span class="track-index">' + String(i + 1).padStart(2, '0') + '</span><span><b>' + esc(item.title) + '</b><small>' + esc(item.artist) + '</small></span><span class="track-dur">' + esc(item.duration) + '</span></button>';
    }).join('');
    if (autoplay) audio.play().catch(function () {});
  }

  function openMusic(index) {
    openLayer('music');
    loadTrack(index || 0, true);
  }

  function pauseMusic() {
    if (audioPlayer) audioPlayer.pause();
  }

  function toggleMusic() {
    const audio = getAudio();
    if (audio.paused) audio.play().catch(function () {});
    else audio.pause();
  }

  let cameraStream = null;
  let cameraFacing = 'environment';
  let cameraTimer = null;

  function showCameraStatus(text) {
    if (els.cameraStatus) els.cameraStatus.textContent = text || '';
  }

  function stopCamera() {
    if (cameraTimer) { clearTimeout(cameraTimer); cameraTimer = null; }
    if (cameraStream) {
      cameraStream.getTracks().forEach(function (track) { track.stop(); });
      cameraStream = null;
    }
    if (els.cameraVideo) {
      els.cameraVideo.pause();
      els.cameraVideo.srcObject = null;
    }
    if (els.cameraShutter) els.cameraShutter.disabled = true;
  }

  function openCamera() {
    openLayer('camera');
    showCameraStatus('正在打开摄像头…');
    if (els.cameraShutter) els.cameraShutter.disabled = true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showCameraStatus('当前浏览器不支持摄像头调用。\n请使用 localhost / HTTPS，或点下方「使用系统相机」。');
      return;
    }
    if (!window.isSecureContext) {
      showCameraStatus('摄像头需要 HTTPS 或 localhost。\n也可以点下方「使用系统相机」直接调用手机相机。');
      return;
    }
    if (cameraTimer) clearTimeout(cameraTimer);
    cameraTimer = setTimeout(function () {
      if (!cameraStream) showCameraStatus('摄像头没有响应。\n请检查权限，或点下方「使用系统相机」。');
    }, 5000);
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: cameraFacing }, width: { ideal: 1280 }, height: { ideal: 1600 } }
    }).then(function (stream) {
      cameraStream = stream;
      if (cameraTimer) { clearTimeout(cameraTimer); cameraTimer = null; }
      els.cameraVideo.srcObject = stream;
      els.cameraVideo.play().catch(function () {});
      showCameraStatus('');
      if (els.cameraShutter) els.cameraShutter.disabled = false;
    }).catch(function () {
      showCameraStatus('没有拿到摄像头权限。\n可以点下方「使用系统相机」用系统相机拍一张。');
    });
  }

  function captureCameraPhoto() {
    if (!cameraStream || !els.cameraVideo.videoWidth) return;
    const video = els.cameraVideo;
    const max = 1280;
    const scale = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight));
    const canvas = els.cameraCanvas || document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const src = canvas.toDataURL('image/jpeg', 0.86);
    addOutgoing({ kind: 'image', imageSrc: src, text: '' });
    closeLayer('camera');
  }

  function switchCamera() {
    cameraFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    stopCamera();
    openCamera();
  }

  function useSystemCamera() {
    closeLayer('camera');
    setTimeout(function () { if (els.cameraInput) els.cameraInput.click(); }, 180);
  }

  function handleCameraFile(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      addOutgoing({ kind: 'image', imageSrc: String(reader.result || ''), text: '' });
      closeLayer('camera');
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  function bindFeatureEvents() {
    if (els.searchAll) {
      els.searchAll.addEventListener('input', scheduleSearch);
      els.searchAll.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') { event.preventDefault(); closeLayer('search'); }
      });
    }
    if (els.searchClear) els.searchClear.addEventListener('click', function () {
      els.searchAll.value = '';
      state.searchQuery = '';
      renderSearch(false);
      els.searchAll.focus();
    });
    els.search.addEventListener('focus', function () {
      if (!isMobile()) return;
      setTimeout(function () { els.search.blur(); openSearch(); }, 0);
    });
    const searchField = document.querySelector('.search-field');
    if (searchField) {
      searchField.addEventListener('click', function (event) {
        if (!isMobile()) return;
        event.preventDefault();
        openSearch();
      });
    }
    if (els.emojiBtn) els.emojiBtn.addEventListener('click', function () { toggleSticker(); });
    if (els.cameraShutter) els.cameraShutter.addEventListener('click', captureCameraPhoto);
    if (els.cameraSwitch) els.cameraSwitch.addEventListener('click', switchCamera);
    if (els.cameraFallback) els.cameraFallback.addEventListener('click', useSystemCamera);
    if (els.cameraInput) els.cameraInput.addEventListener('change', function () { handleCameraFile(els.cameraInput); });
    const stickerClose = $('#sticker-close');
    if (stickerClose) stickerClose.addEventListener('click', function () { toggleSticker(false); });
    if (els.stickerGrid) {
      els.stickerGrid.addEventListener('click', function (event) {
        const item = event.target.closest('[data-sticker]');
        if (!item) return;
        addOutgoing({ kind: state.stickerTab === 'emoji' ? 'text' : 'sticker', text: item.dataset.sticker });
      });
    }
    $$('.sticker-tabs button').forEach(function (button) {
      button.addEventListener('click', function () {
        state.stickerTab = button.dataset.stickerTab;
        renderStickers();
      });
    });
    $$('#media-tabs button').forEach(function (button) {
      button.addEventListener('click', function () {
        state.mediaTab = button.dataset.mediaTab;
        renderMedia();
      });
    });
    const musicPlay = $('#music-play');
    const musicPrev = $('#music-prev');
    const musicNext = $('#music-next');
    if (musicPlay) musicPlay.addEventListener('click', toggleMusic);
    if (musicPrev) musicPrev.addEventListener('click', function () { loadTrack(state.musicIndex - 1, true); });
    if (musicNext) musicNext.addEventListener('click', function () { loadTrack(state.musicIndex + 1, true); });
    if (els.musicSeek) {
      els.musicSeek.addEventListener('input', function () {
        const audio = getAudio();
        if (audio.duration) audio.currentTime = (Number(els.musicSeek.value) / 1000) * audio.duration;
      });
    }
    document.addEventListener('click', function (event) {
      const tab = event.target.closest('[data-search-tab]');
      if (tab) {
        state.searchTab = tab.dataset.searchTab;
        $$('.search-tabs button').forEach(function (b) { b.classList.toggle('is-active', b.dataset.searchTab === state.searchTab); });
        renderSearch(false);
        return;
      }
      const chat = event.target.closest('[data-search-chat]');
      if (chat) { closeLayer('search'); openChat(chat.dataset.searchChat); return; }
      const contact = event.target.closest('[data-search-contact]');
      if (contact) { closeLayer('search'); startChatWith(contact.dataset.searchContact); return; }
      const mediaImage = event.target.closest('[data-media-image]');
      if (mediaImage) {
        addOutgoing({ kind: 'image', imageSrc: mediaImage.dataset.mediaImage, text: '' });
        closeLayer('media');
        return;
      }
      const mediaSend = event.target.closest('[data-media-send]');
      if (mediaSend) { sendMediaText(mediaSend.dataset.mediaSend); return; }
      const mediaCamera = event.target.closest('#media-camera');
      if (mediaCamera) { closeLayer('media'); setTimeout(openCamera, 160); return; }
      const mediaFile = event.target.closest('#media-file-pick');
      if (mediaFile) { closeLayer('media'); setTimeout(function () { els.fileInput.click(); }, 220); return; }
      const mediaMusic = event.target.closest('[data-music-index]');
      if (mediaMusic) { closeLayer('media'); openMusic(Number(mediaMusic.dataset.musicIndex)); return; }
      const track = event.target.closest('[data-music-track]');
      if (track) { loadTrack(Number(track.dataset.musicTrack), true); return; }
      const searchMedia = event.target.closest('[data-search-media]');
      if (searchMedia) { closeLayer('search'); openMedia('gallery'); return; }
    });
  }

  function renderNoChat() {
    els.chat.dataset.type = 'dm';
    els.peerName.textContent = 'MYRQVIA Chat';
    els.peerSub.textContent = '添加联系人后开始对话';
    els.chatDay.hidden = true;
    els.messages.innerHTML = '<div class="chat-empty-state"><div><strong>还没有对话</strong>' +
      '<span>打开「联系人」，按完整的 @用户名 添加好友。不会显示任何演示群组或虚构消息。</span></div></div>';
    if (els.input) {
      els.input.disabled = true;
      els.input.placeholder = '先添加好友';
    }
    if (els.send) els.send.disabled = true;
    updateJumpButton();
  }

  function renderChat(opts) {
    const options = opts || {};
    const convo = activeConversation();
    if (!convo) { renderNoChat(); return; }
    if (els.input) {
      els.input.disabled = false;
      els.input.placeholder = '消息';
    }

    els.chat.dataset.type = convo.type;
    els.peerName.textContent = convo.name;
    const onlineDot = convo.online || (convo.type === 'dm' && person(convo.members[0]).online);
    els.peerSub.innerHTML = (onlineDot ? '<i class="online-dot"></i>' : '') + esc(convo.presence || '');

    const scrollEl = els.chatScroll;
    const distance = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;

    if (!convo.messages.length) {
      els.chatDay.hidden = true;
      els.messages.classList.remove('no-anim');
      els.messages.innerHTML = emptyChatHTML(convo);
      if (options.scroll !== 'none') scrollToBottom(true);
      updateJumpButton();
      return;
    }

    els.chatDay.hidden = false;
    els.chatDay.textContent = convo.day || '今天';
    const lastMineId = (function () {
      for (let i = convo.messages.length - 1; i >= 0; i -= 1) {
        if (convo.messages[i].from === 'me' && !convo.messages[i].recalled) return convo.messages[i].id;
      }
      return null;
    })();

    const html = convo.messages.map((msg, index) => {
      if (msg.recalled) return systemRecallHTML(msg);
      const prev = convo.messages[index - 1];
      const next = convo.messages[index + 1];
      const clustered = canCluster(prev, msg);
      const clusterLast = !canCluster(msg, next);
      return messageHTML(convo, msg, {
        clustered: clustered,
        clusterLast: clusterLast,
        lastMineId: lastMineId,
        msgIndex: index
      });
    }).join('');

    els.messages.innerHTML = html;
    els.messages.classList.toggle('no-anim', options.animate === false);

    if (options.scroll === 'preserve') {
      scrollEl.scrollTop = scrollEl.scrollHeight - scrollEl.clientHeight - Math.max(0, distance);
    } else if (options.scroll !== 'none') {
      scrollToBottom(true);
    }
    updateJumpButton();
  }

  function canCluster(a, b) {
    if (!a || !b || a.recalled || b.recalled) return false;
    if (a.from !== b.from) return false;
    const diff = Math.abs(timeToMinutes(b.time) - timeToMinutes(a.time));
    return diff <= 3;
  }

  function timeToMinutes(value) {
    if (!value || value.indexOf(':') === -1) return 0;
    const parts = value.split(':');
    return Number(parts[0]) * 60 + Number(parts[1]);
  }

  function systemRecallHTML(msg) {
    return '<div class="msg-system" data-system-id="' + esc(msg.id) + '">' +
      icon('spark') + '<span>你撤回了一条消息</span></div>';
  }

  function emptyChatHTML(convo) {
    const isGroup = convo.type === 'group';
    const firstMember = convo.members[0];
    return '<div class="chat-empty">' +
      (isGroup ? convoAvatarHTML(convo) : avatarHTML(firstMember, 'avatar-64')) +
      '<div class="chat-empty-title">' + esc(convo.name) + '</div>' +
      '<div class="chat-empty-text">' + (isGroup
        ? '群聊已创建，发条消息开始吧'
        : '这是你和' + esc(person(firstMember).name) + '的对话') + '</div>' +
      '<div class="chat-empty-hint">消息仅保存在当前浏览器</div>' +
    '</div>';
  }

  function replyQuoteHTML(convo, msg) {
    if (!msg.replyTo) return '';
    const target = convo.messages.find((item) => item.id === msg.replyTo);
    if (!target || target.recalled) return '';
    const name = target.from === 'me' ? '你' : person(target.from).name;
    return '<div class="bubble-quote">' +
      '<span class="bubble-quote-name">' + esc(name) + '</span>' +
      '<span class="bubble-quote-text">' + esc(previewOfMessage(target)) + '</span>' +
    '</div>';
  }

  function forwardLabelHTML(msg) {
    if (!msg.forwardedFrom) return '';
    return '<div class="fwd-label">' + icon('arrow-right') + '<span>转发自 ' + esc(msg.forwardedFrom) + '</span></div>';
  }

  function messageHTML(convo, msg, meta) {
    const isMine = msg.from === 'me';
    const classes = ['msg'];
    if (isMine) classes.push('is-mine');
    if (meta.clustered) classes.push('is-cluster');
    if (meta.clusterLast) classes.push('is-cluster-last');
    const senderName = person(msg.from).name;
    const sender = (!meta.clustered && convo.type === 'group' && !isMine)
      ? '<span class="msg-sender">' + esc(senderName) + '</span>' : '';

    let content = '';
    const quote = replyQuoteHTML(convo, msg);
    const forward = forwardLabelHTML(msg);

    if (msg.kind === 'file') {
      const ext = (msg.fileName || 'FILE').split('.').pop().slice(0, 4).toUpperCase();
      content = '<div class="bubble bubble-file">' + forward + quote +
        '<div class="file-card">' +
          '<span class="file-glyph">' + icon('file') + '<span>' + esc(ext) + '</span></span>' +
          '<span class="file-meta">' +
            '<span class="file-name">' + esc(msg.fileName || '附件') + '</span>' +
            '<span class="file-size">' + esc(msg.fileSize || '') + '</span>' +
          '</span>' +
        '</div>' +
      '</div>';
    } else if (msg.kind === 'image') {
      content = '<div class="bubble bubble-image"><img src="' + esc(msg.imageSrc || '') + '" alt="图片" draggable="false"></div>';
    } else if (msg.kind === 'sticker') {
      content = '<div class="bubble bubble-sticker">' + esc(msg.text || '') + '</div>';
    } else {
      content = '<div class="bubble">' + forward + quote + esc(msg.text || '') + '</div>';
    }

    const reactions = (msg.reactions && msg.reactions.length)
      ? '<div class="msg-reactions">' + msg.reactions.map((r) =>
          '<button type="button" class="reaction-pill' + (r.me ? ' is-mine' : '') +
          '" data-reaction-msg="' + esc(msg.id) + '" aria-label="' + esc(r.emoji) + ' 回应 ' + r.count + ' 个">' +
          '<span>' + esc(r.emoji) + '</span><span>' + r.count + '</span></button>').join('') + '</div>'
      : '';

    const showMeta = isMine && (msg.id === meta.lastMineId || msg.status === 'sending' || msg.status === 'failed');
    const metaHTML = showMeta ? messageMetaHTML(msg) : '';

    const gutter = isMine ? '' : '<span class="msg-gutter">' +
      (meta.clusterLast ? avatarHTML(msg.from, '', false) : avatarHTML(msg.from, '', false)) + '</span>';

    return '<div class="' + classes.join(' ') + '" data-id="' + esc(msg.id) + '">' +
      gutter +
      '<div class="msg-content">' + sender + content + reactions + metaHTML + '</div>' +
    '</div>';
  }

  function messageMetaHTML(msg) {
    if (msg.status === 'sending') {
      return '<div class="msg-meta">' + icon('clock', 'ico status-ico') + '<span>发送中…</span></div>';
    }
    if (msg.status === 'failed') {
      return '<div class="msg-meta"><span class="is-failed">' + icon('alert', 'ico status-ico') +
        '未发送</span><button type="button" class="retry-btn" data-retry="' + esc(msg.id) + '">重试</button></div>';
    }
    if (!settings.receipts) return '';
    if (!msg.status) return '';
    return '<div class="msg-meta"><span>' + esc(STATUS_LABEL[msg.status] || '') + '</span></div>';
  }

  function refreshMessageMeta(msg) {
    const row = els.messages.querySelector('.msg[data-id="' + cssEscape(msg.id) + '"]');
    if (!row) return;
    const content = row.querySelector('.msg-content');
    if (!content) return;
    const existing = content.querySelector('.msg-meta');
    const html = messageMetaHTML(msg);
    if (existing) {
      if (html) existing.outerHTML = html;
      else existing.remove();
    } else if (html) {
      content.insertAdjacentHTML('beforeend', html);
    }
  }

  /* ======================================================================
     Navigation
     ====================================================================== */

  /* ======================================================================
     Section navigation — 消息 / 联系人 / 公告 / 我
     ====================================================================== */

  const SECTION_PAGES = { contacts: 'page-contacts', notices: 'page-notices', toolbox: 'page-toolbox', me: 'page-me' };

  function setSection(section, options) {
    const valid = ['messages', 'contacts', 'notices', 'toolbox', 'me'];
    if (valid.indexOf(section) === -1) section = 'messages';
    const opts = options || {};
    state.section = section;
    els.app.dataset.section = section;

    Object.keys(SECTION_PAGES).forEach((name) => {
      const page = document.getElementById(SECTION_PAGES[name]);
      if (!page) return;
      if (name === section) {
        page.hidden = false;
        page.classList.remove('is-active');
        void page.offsetWidth;
        page.classList.add('is-active');
      } else {
        page.hidden = true;
        page.classList.remove('is-active');
      }
    });

    $$('[data-tab]').forEach((button) => {
      const active = button.dataset.tab === section;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });

    if (section === 'contacts') renderContactsPage();
    if (section === 'notices') renderNoticesPage();
    if (section === 'toolbox') applyConfigLinks();
    if (section === 'me') syncMePage();
    if (section !== 'messages') closeContext();
    if (isMobile() && !opts.keepRoute) setRoute('list');
  }

  function applyConfigLinks() {
    const config = window.MYRQVIA_CONFIG || {};
    const map = [
      ['toolbox-github', 'githubUrl', 'github'],
      ['toolbox-myrqvia', 'myrqviaUrl', 'myrqvia']
    ];
    map.forEach((item) => {
      const link = document.getElementById(item[0]);
      const label = document.querySelector('[data-toolbox-label="' + item[2] + '"]');
      if (!link) return;
      if (config[item[1]]) link.href = config[item[1]];
      if (label) {
        try { label.firstChild.textContent = new URL(config[item[1]] || link.href).hostname.replace(/^www\./, ''); }
        catch (err) { /* keep static label */ }
      }
    });
    const mail = document.getElementById('toolbox-mail');
    if (mail && config.contactEmail) mail.href = 'mailto:' + config.contactEmail;
  }

  function renderTabPages() {
    applyConfigLinks();
    renderContactsPage();
    renderNoticesPage();
    syncMePage();
  }

  function renderContactsPage() {
    if (!els.contactsPageList) return;
    const query = (state.contactsPageQuery || '').trim().toLowerCase();
    const rows = store.contacts.filter((entry) => {
      const p = person(entry.id);
      return !query || (p.name + ' ' + p.handle + ' ' + (entry.note || '')).toLowerCase().indexOf(query) !== -1;
    });
    if (els.contactsCount) els.contactsCount.textContent = rows.length + ' 位';
    els.contactsPageList.innerHTML = rows.length ? rows.map((entry) => {
      const p = person(entry.id);
      return '<button type="button" class="contact-page-row" data-contact-page="' + esc(p.id) + '">' +
        '<span class="contact-profile-hit" data-profile="' + esc(p.id) + '">' + avatarHTML(p.id, 'avatar', true) + '</span>' +
        '<span class="contact-page-meta"><span class="contact-page-name">' + esc(p.name) + '</span>' +
        '<span class="contact-page-status">' + esc(p.presence || '离线') + '</span></span>' +
        icon('chevron', 'ico row-chevron') +
      '</button>';
    }).join('') : '<p class="page-note">' + (store.contacts.length ? '没有找到联系人。' : '还没有联系人。点击右上角 +，输入完整的 @用户名 添加。') + '</p>';
  }

  function renderNoticesPage() {
    if (!els.noticesPageList) return;
    if (!store.announcements.length) {
      els.noticesPageList.innerHTML = '<p class="page-note">暂无公告。</p>';
      return;
    }
    els.noticesPageList.innerHTML = store.announcements.map((item) => {
      return '<button type="button" class="notice-page-card' + (item.unread ? ' is-unread' : '') + '" data-notice-page="' + esc(item.id) + '">' +
        '<span class="notice-page-meta">' + (item.tag ? '<span class="notice-page-tag">' + esc(item.tag) + '</span>' : '') +
          '<span>' + esc(item.date) + '</span></span>' +
        '<span class="notice-page-arrow">' + icon('chevron', 'ico') + '</span>' +
        '<h3 class="notice-page-title">' + esc(item.title) + '</h3>' +
        '<p class="notice-page-excerpt">' + esc(item.excerpt) + '</p>' +
      '</button>';
    }).join('');
  }

  function syncMePage() {
    if (els.meThemeValue) els.meThemeValue.textContent = THEME_LABEL[settings.theme] || '跟随系统';
    if (els.meFontValue) els.meFontValue.textContent = SIZE_LABEL[settings.chatSize] || '标准';
    if (els.meMotionValue) els.meMotionValue.textContent = settings.reduceMotion ? '开启' : '关闭';
  }

  function openProfile(personId) {
    const isMe = personId === 'me';
    const p = isMe ? store.people.me : person(personId);
    if (!p) return;
    state.profileId = personId;
    if (els.profileAvatar) {
      els.profileAvatar.className = 'avatar avatar-88 tone-' + (p.tone || 'slate');
      els.profileAvatar.textContent = p.initials || (p.name || '?').slice(0, 1);
    }
    if (els.profileName) els.profileName.textContent = p.name || 'MYRQVIA 用户';
    if (els.profileHandle) els.profileHandle.textContent = '@' + (p.handle || 'myrqvia');
    if (els.profileUsername) els.profileUsername.textContent = '@' + (p.handle || 'myrqvia');
    if (els.profileId) els.profileId.textContent = isMe ? '1688' : String((p.handle || 'myrqvia').length * 137);
    if (els.profileNote) {
      const entry = store.contacts.find(function (item) { return item.id === personId; });
      els.profileNote.textContent = isMe ? '本人' : (entry && entry.note) || p.role || '—';
    }
    if (els.profileSeen) els.profileSeen.textContent = isMe ? '在线' : (p.presence || '离线');
    if (els.profileMessage) els.profileMessage.hidden = isMe;
    openLayer('profile');
  }

  function setRoute(route) {
    if (route === 'list') toggleSticker(false);
    state.route = route;
    els.app.dataset.route = route;
    if (route === 'list') {
      document.activeElement && document.activeElement.blur && document.activeElement.blur();
      closeContext();
    }
  }

  function openChat(id, options) {
    const opts = options || {};
    const convo = store.conversations.find((c) => c.id === id);
    if (!convo) return;
    if (state.section !== 'messages') setSection('messages', { keepRoute: true });
    state.activeId = id;
    convo.unread = 0;
    state.replyTo = null;
    hideReplyPreview();
    renderList();
    renderChat({ animate: opts.animate !== false, scroll: 'bottom' });
    setRoute('chat');
    if (opts.focus) {
      setTimeout(() => {
        try { els.input.focus(); } catch (err) { /* noop */ }
      }, 420);
    }
  }

  function backToList() {
    setRoute('list');
    renderList();
  }

  /* ======================================================================
     Composer / sending
     ====================================================================== */

  function resizeComposer() {
    const value = els.input.value;
    els.input.style.height = 'auto';
    els.input.style.height = Math.min(els.input.scrollHeight, 132) + 'px';
    els.composer.classList.toggle('has-text', value.trim().length > 0);
  }

  function sendCurrent() {
    const text = els.input.value.trim();
    if (!text) return;
    els.input.value = '';
    resizeComposer();
    addOutgoing({ kind: 'text', text: text });
  }

  function addOutgoing(payload) {
    const convo = activeConversation();
    if (!convo) return;
    const msg = Object.assign({
      id: uid(),
      from: 'me',
      time: nowTime(),
      status: 'sending'
    }, payload);
    if (state.replyTo) msg.replyTo = state.replyTo.id;
    convo.messages.push(msg);
    convo.time = '现在';
    state.replyTo = null;
    hideReplyPreview();
    renderChat({ animate: false, scroll: 'bottom' });
    renderList();
    const lastRow = els.messages.lastElementChild;
    if (lastRow && lastRow.classList.contains('msg')) lastRow.classList.add('msg-enter');
    playSound('send');
    requestAnimationFrame(() => scrollToBottom(true));
    if (MYRQVIA.realtime && MYRQVIA.realtime.sendMessage) {
      MYRQVIA.realtime.sendMessage({ conversationId: convo.id, message: msg });
    }
    setTimeout(function () {
      if (convo.id === state.activeId) showPeerTyping(convo.id);
    }, 520);

    if (!navigator.onLine) {
      msg.status = 'failed';
      refreshMessageMeta(msg);
      showToast('未连接网络，消息未发送', 'alert');
      return;
    }

    const deliveredDelay = 620 + Math.round(Math.random() * 380);
    setTimeout(() => {
      if (msg.status !== 'sending') return;
      msg.status = 'delivered';
      refreshMessageMeta(msg);
    }, deliveredDelay);
    setTimeout(() => {
      if (msg.status === 'sending' || msg.status === 'delivered') {
        msg.status = 'read';
        refreshMessageMeta(msg);
      }
    }, deliveredDelay + 820);
  }

  function retryMessage(id) {
    const convo = activeConversation();
    const msg = convo && convo.messages.find((item) => item.id === id);
    if (!msg) return;
    msg.status = 'sending';
    refreshMessageMeta(msg);
    if (!navigator.onLine) {
      setTimeout(() => {
        msg.status = 'failed';
        refreshMessageMeta(msg);
        showToast('仍未连接网络', 'alert');
      }, 500);
      return;
    }
    setTimeout(() => { msg.status = 'delivered'; refreshMessageMeta(msg); }, 650);
    setTimeout(() => { msg.status = 'read'; refreshMessageMeta(msg); }, 1500);
  }

  function setReply(msg) {
    if (!msg) return;
    state.replyTo = msg;
    els.replyLabel.textContent = '回复 ' + (msg.from === 'me' ? '你' : person(msg.from).name);
    els.replyText.textContent = previewOfMessage(msg);
    els.replyPreview.hidden = false;
    els.input.focus();
    requestAnimationFrame(() => scrollToBottom(true));
  }

  function hideReplyPreview() {
    els.replyPreview.hidden = true;
    els.replyText.textContent = '';
  }

  /* ======================================================================
     Attachments (local only, no upload)
     ====================================================================== */

  function openAttach() {
    openMedia('gallery');
  }

  function closeAttach() {
    closeLayer('attach');
  }

  function openActionSheet() {
    els.actionSheet.hidden = false;
    if (state.shot) els.actionSheet.classList.add('is-open');
    else {
      void els.actionSheet.offsetWidth;
      els.actionSheet.classList.add('is-open');
    }
  }

  function closeActionSheet() {
    if (els.actionSheet.hidden) return;
    els.actionSheet.classList.remove('is-open');
    setTimeout(() => {
      if (!els.actionSheet.classList.contains('is-open')) els.actionSheet.hidden = true;
    }, state.shot ? 0 : 340);
  }

  function choosePhoto() {
    closeAttach();
    closeActionSheet();
    setTimeout(() => els.photoInput.click(), 30);
  }

  function chooseFile() {
    closeAttach();
    closeActionSheet();
    setTimeout(() => els.fileInput.click(), 30);
  }

  function handlePhoto(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const src = URL.createObjectURL(file);
    addOutgoing({ kind: 'image', imageSrc: src, text: '' });
    input.value = '';
  }

  function handleFile(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    addOutgoing({ kind: 'file', fileName: file.name, fileSize: formatSize(file.size) });
    input.value = '';
  }

  function formatSize(bytes) {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /* ======================================================================
     Message layout helpers / context menu
     ====================================================================== */

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/["\\]/g, '\\$&');
  }

  function findMessage(convo, msgId) {
    if (!convo) return null;
    return convo.messages.find((msg) => msg.id === msgId) || null;
  }

  function openContext(msgId) {
    const convo = activeConversation();
    const msg = findMessage(convo, msgId);
    const row = els.messages.querySelector('.msg[data-id="' + cssEscape(msgId) + '"]');
    if (!msg || !row || msg.recalled) return;
    if (state.menuMsgId === msgId && !els.contextLayer.hidden) return;

    state.menuMsgId = msgId;
    state.lastContextAt = Date.now();
    const bubble = row.querySelector('.bubble');
    if (!bubble) return;

    const picked = {};
    (msg.reactions || []).forEach((r) => { if (r.me) picked[r.emoji] = true; });
    els.reactionBar.innerHTML = REACTIONS.map((emoji) =>
      '<button type="button" data-reaction="' + emoji + '"' + (picked[emoji] ? ' class="is-picked"' : '') +
      ' aria-label="用 ' + emoji + ' 回应">' + emoji + '</button>').join('');

    const actions = [];
    actions.push({ key: 'reply', icon: 'reply', label: '回复' });
    if (msg.kind !== 'image') actions.push({ key: 'copy', icon: 'copy', label: '复制' });
    actions.push({ key: 'save', icon: 'star', label: '收藏' });
    actions.push({ key: 'forward', icon: 'arrow-right', label: '转发' });
    actions.push({ sep: true });
    if (msg.from === 'me') actions.push({ key: 'recall', icon: 'undo', label: '撤回' });
    actions.push({ key: 'delete', icon: 'trash', label: '删除', destructive: true });

    els.contextActions.innerHTML = actions.map((item) => {
      if (item.sep) return '<div class="ctx-sep"></div>';
      return '<button type="button" role="menuitem" class="ctx-item' + (item.destructive ? ' is-destructive' : '') +
        '" data-ctx="' + item.key + '">' + icon(item.icon) + '<span>' + item.label + '</span></button>';
    }).join('');

    row.classList.add('is-pressed');
    els.contextLayer.hidden = false;
    requestAnimationFrame(() => {
      positionContext(row, bubble);
      if (state.shot) {
        els.contextLayer.classList.add('is-open');
      } else {
        requestAnimationFrame(() => {
          if (state.menuMsgId === msgId) els.contextLayer.classList.add('is-open');
        });
      }
    });
  }

  function positionContext(row, bubble) {
    if (els.contextLayer.hidden) return;
    const menu = els.contextMenu;
    const anchor = bubble.getBoundingClientRect();
    const rect = menu.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 10;
    let left = anchor.left + anchor.width / 2 - rect.width / 2;
    left = clamp(left, pad, vw - rect.width - pad);
    let top = anchor.top - rect.height - 10;
    let originY = '100%';
    if (top < pad) {
      top = Math.min(anchor.bottom + 10, vh - rect.height - pad);
      originY = '0%';
    }
    top = Math.max(pad, top);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    const originX = clamp(anchor.left + anchor.width / 2 - left, 22, rect.width - 22);
    menu.style.setProperty('--ctx-origin', originX + 'px ' + originY);
  }

  function closeContext() {
    if (els.contextLayer.hidden) return;
    els.contextLayer.classList.remove('is-open');
    if (state.menuMsgId) {
      const row = els.messages.querySelector('.msg[data-id="' + cssEscape(state.menuMsgId) + '"]');
      if (row) row.classList.remove('is-pressed');
    }
    state.menuMsgId = null;
    const delay = state.shot ? 0 : 190;
    setTimeout(() => {
      if (!els.contextLayer.classList.contains('is-open')) els.contextLayer.hidden = true;
    }, delay);
  }

  function handleContextAction(action) {
    const convo = activeConversation();
    const msg = findMessage(convo, state.menuMsgId);
    closeContext();
    if (!msg) return;
    if (action === 'reply') {
      setReply(msg);
    } else if (action === 'copy') {
      copyText(previewOfMessage(msg));
    } else if (action === 'save') {
      saveMessage(msg);
    } else if (action === 'forward') {
      state.forwardMsgId = msg.id;
      openCompose('forward');
    } else if (action === 'recall') {
      recallMessage(msg);
    } else if (action === 'delete') {
      deleteMessage(msg);
    }
  }

  function toggleReaction(msgId, emoji) {
    const convo = activeConversation();
    const msg = findMessage(convo, msgId);
    if (!msg) return;
    msg.reactions = msg.reactions || [];
    const existing = msg.reactions.find((r) => r.emoji === emoji);
    if (existing) {
      if (existing.me) {
        existing.me = false;
        existing.count -= 1;
      } else {
        existing.me = true;
        existing.count += 1;
      }
      if (existing.count <= 0) msg.reactions = msg.reactions.filter((r) => r !== existing);
    } else {
      msg.reactions.push({ emoji: emoji, count: 1, me: true });
    }
    closeContext();
    renderChat({ scroll: 'preserve', animate: false });
    requestAnimationFrame(() => {
      const row = els.messages.querySelector('.msg[data-id="' + cssEscape(msgId) + '"]');
      if (!row) return;
      const pill = row.querySelector('.reaction-pill');
      if (pill && !effectiveReduce()) {
        pill.animate(
          [{ transform: 'scale(.55)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }],
          { duration: 320, easing: 'cubic-bezier(.34,1.3,.64,1)' }
        );
      }
    });
  }

  function recallMessage(msg) {
    const convo = activeConversation();
    const row = els.messages.querySelector('.msg[data-id="' + cssEscape(msg.id) + '"]');
    if (!row) return;
    const bubble = row.querySelector('.bubble');
    row.classList.add('is-recalling');

    const finish = () => {
      msg.recalled = true;
      msg.reactions = [];
      delete msg.imageSrc;
      msg.kind = 'text';
      msg.text = '';
      msg.replyTo = null;
      renderChat({ scroll: 'preserve', animate: false });
      renderList();
    };

    const reduced = effectiveReduce();
    const canRecallWithParticles = !reduced && msg.kind !== 'image' && window.MYRQVIA.recall && bubble;
    if (canRecallWithParticles) {
      MYRQVIA.recall.play(bubble, {
        host: els.chatInner,
        reduceMotion: false
      }).then(finish).catch(() => {
        if (bubble) bubble.style.opacity = '0';
        setTimeout(finish, 220);
      });
    } else {
      if (bubble) {
        bubble.style.transition = 'opacity .22s ease, transform .22s ease';
        bubble.style.opacity = '0';
        bubble.style.transform = 'scale(.985)';
      }
      setTimeout(finish, reduced ? 240 : 260);
    }
  }

  function deleteMessage(msg) {
    const convo = activeConversation();
    const row = els.messages.querySelector('.msg[data-id="' + cssEscape(msg.id) + '"]');
    if (row) row.classList.add('is-removing');
    setTimeout(() => {
      convo.messages = convo.messages.filter((item) => item.id !== msg.id);
      if (convo.messages.length) {
        const last = convo.messages[convo.messages.length - 1];
        convo.time = '现在';
        convo.day = convo.day || '今天';
        void last;
      }
      renderChat({ scroll: 'preserve', animate: false });
      renderList();
      showToast('消息已删除');
    }, effectiveReduce() ? 0 : 180);
  }

  function effectiveReduce() {
    return settings.reduceMotion || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ======================================================================
     Copy / toast / sound
     ====================================================================== */

  function copyText(text) {
    const value = String(text || '');
    const fallback = function () {
      const area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', 'readonly');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); } catch (err) { /* noop */ }
      document.body.removeChild(area);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(() => showToast('已复制')).catch(() => {
        fallback();
        showToast('已复制');
      });
    } else {
      fallback();
      showToast('已复制');
    }
  }

  function showToast(text, iconName) {
    els.toastText.textContent = text;
    const use = els.toast.querySelector('use');
    if (use) use.setAttribute('href', iconName === 'alert' ? '#i-alert' : '#i-check');
    clearTimeout(state.toastTimer);
    els.toast.hidden = false;
    void els.toast.offsetWidth;
    els.toast.classList.add('is-visible');
    state.toastTimer = setTimeout(() => {
      els.toast.classList.remove('is-visible');
      setTimeout(() => { if (!els.toast.classList.contains('is-visible')) els.toast.hidden = true; }, 260);
    }, 1800);
  }

  function playSound(kind) {
    if (!settings.sounds) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(kind === 'send' ? 660 : 780, t);
      osc.frequency.exponentialRampToValueAtTime(kind === 'send' ? 520 : 640, t + 0.09);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.035, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch (err) { /* audio unavailable */ }
  }

  /* ======================================================================
     Scroll
     ====================================================================== */

  function scrollToBottom(instant) {
    if (!els.chatScroll) return;
    if (instant) els.chatScroll.scrollTop = els.chatScroll.scrollHeight;
    else els.chatScroll.scrollTo({ top: els.chatScroll.scrollHeight, behavior: effectiveReduce() ? 'auto' : 'smooth' });
    updateJumpButton();
  }

  function updateJumpButton() {
    if (!els.jump) return;
    const distance = els.chatScroll.scrollHeight - els.chatScroll.scrollTop - els.chatScroll.clientHeight;
    const show = distance > 180;
    els.jump.hidden = !show;
  }

  /* ======================================================================
     Settings / info / announcements / compose layers
     ====================================================================== */

  const MAJOR_LAYERS = ['settings', 'notice', 'info', 'compose', 'friend', 'archive', 'saved', 'profile', 'search', 'media', 'music', 'camera'];

  function layerElement(name) {
    return document.getElementById(name + '-layer');
  }

  function openLayer(name, options) {
    const layer = layerElement(name);
    if (!layer) return;
    if (MAJOR_LAYERS.indexOf(name) !== -1) {
      MAJOR_LAYERS.forEach((other) => { if (other !== name) closeLayer(other); });
    }
    layer.hidden = false;
    if (state.shot || (options && options.instant)) {
      layer.classList.add('is-open');
    } else {
      void layer.offsetWidth;
      layer.classList.add('is-open');
    }
  }

  function closeLayer(name) {
    if (name === 'music') pauseMusic();
    if (name === 'camera') stopCamera();
    const layer = layerElement(name);
    if (!layer || layer.hidden) return;
    layer.classList.remove('is-open');
    const delay = state.shot ? 0 : (name === 'context' ? 190 : 220);
    setTimeout(() => {
      if (!layer.classList.contains('is-open')) layer.hidden = true;
    }, delay);
  }

  function openSettings() {
    syncSettingsUI();
    openLayer('settings');
    const body = $('#settings-layer .sheet-body');
    if (body) body.scrollTop = 0;
  }

  function openNotices(id) {
    let target = null;
    if (id) target = store.announcements.find((a) => a.id === id) || null;
    if (!target) target = store.announcements.find((a) => a.id === state.activeNoticeId) || store.announcements[0];
    if (!target) return;
    state.activeNoticeId = target.id;
    target.unread = false;
    renderNotices();
    renderNoticesPage();
    openLayer('notice');
    updateBadges();
  }

  function renderNotices() {
    const active = store.announcements.find((a) => a.id === state.activeNoticeId) || store.announcements[0];
    if (!active) return;
    const blocks = (active.body || []).map((block) => {
      if (block.type === 'list') {
        return '<ul class="notice-list">' + block.items.map((item) => '<li>' + esc(item) + '</li>').join('') + '</ul>';
      }
      if (block.type === 'quote') {
        return '<blockquote class="notice-quote">' + esc(block.text) + '</blockquote>';
      }
      return '<p class="notice-p">' + esc(block.text) + '</p>';
    }).join('');
    const more = store.announcements.filter((a) => a.id !== active.id);
    const authorIsTeam = /MYRQVIA|团队/.test(active.author);
    const authorAvatar = authorIsTeam
      ? '<span class="avatar avatar-official"><svg class="official-spark" aria-hidden="true"><use href="#i-spark"></use></svg></span>'
      : '<span class="avatar tone-clay">棠</span>';

    els.noticeBody.innerHTML = '<article class="notice-article">' +
      '<div class="notice-meta">' + (active.tag ? '<span class="notice-tag">' + esc(active.tag) + '</span>' : '') +
        '<span>' + esc(active.date) + '</span></div>' +
      '<h1 class="notice-title">' + esc(active.title) + '</h1>' +
      '<div class="notice-byline">' + authorAvatar + '<span>' + esc(active.author) + '</span></div>' +
      '<div class="notice-copy">' + blocks + '</div>' +
    '</article>' +
    (more.length ? '<div class="notice-more"><div class="notice-more-label">更多公告</div>' +
      more.map((item) => '<button type="button" class="notice-more-row" data-notice="' + esc(item.id) + '">' +
        '<span class="notice-more-title">' + esc(item.title) + '</span>' +
        '<span class="notice-more-date">' + esc(item.date) + '</span>' +
        icon('chevron') + '</button>').join('') + '</div>' : '');

    els.noticeBody.scrollTop = 0;
  }

  function openInfo() {
    const convo = activeConversation();
    if (!convo) return;
    renderInfo();
    openLayer('info');
    const body = $('#info-layer .sheet-body');
    if (body) body.scrollTop = 0;
  }

  function renderInfo() {
    const convo = activeConversation();
    if (!convo) return;
    const isGroup = convo.type === 'group';
    let hero = '';
    if (isGroup) {
      const members = convo.members.slice(0, 3);
      hero = '<div class="info-hero">' +
        '<div class="info-avatar-stack">' + members.map((id) => avatarHTML(id, 'avatar')).join('') + '</div>' +
        '<div class="info-name">' + esc(convo.name) + '</div>' +
        '<div class="info-sub">' + convo.members.length + ' 位成员 · ' + (convo.presence || '') + '</div>' +
      '</div>';
    } else {
      const p = person(convo.members[0]);
      hero = '<div class="info-hero">' + avatarHTML(p.id, 'avatar-64', false) +
        '<div class="info-name">' + esc(p.name) + '</div>' +
        '<div class="info-sub">' + esc(convo.presence || p.presence || '离线') + '</div>' +
      '</div>';
    }

    const settingsGroup = '<div class="info-group"><div class="group">' +
      '<div class="info-row"><span class="info-label">消息免打扰</span>' +
        '<button type="button" class="switch" role="switch" aria-checked="' + (convo.muted ? 'true' : 'false') +
        '" data-info-toggle="muted"><span></span></button></div>' +
      '<div class="info-row"><span class="info-label">置顶聊天</span>' +
        '<button type="button" class="switch" role="switch" aria-checked="' + (convo.pinned ? 'true' : 'false') +
        '" data-info-toggle="pinned"><span></span></button></div>' +
      (isGroup ? '<button type="button" class="info-row" data-info-action="notice">' +
        '<span class="info-label">群公告</span><span class="info-value">查看公告' +
        icon('chevron', 'ico row-chevron') + '</span></button>' : '') +
    '</div></div>';

    const membersHTML = isGroup ? '<div class="info-section">群成员 · ' + convo.members.length + '</div>' +
      '<div class="info-members">' + convo.members.map((id) => {
        const p = person(id);
        const role = id === 'me' ? '我' : (p.role || '');
        return '<div class="info-member">' + avatarHTML(id, 'avatar-36') +
          '<div class="info-member-meta"><span class="info-member-name">' + esc(p.name) + '</span>' +
          '<span class="info-member-sub">' + (p.presence || '离线') + '</span></div>' +
          (role ? '<span class="info-member-role">' + esc(role) + '</span>' : '') + '</div>';
      }).join('') + '</div>' : '';

    const dmMeta = !isGroup ? '<div class="info-section">账号</div>' +
      '<div class="info-group"><div class="group"><div class="info-row">' +
        '<span class="info-label">MYRQVIA ID</span><span class="info-value">@' +
        esc(person(convo.members[0]).handle || 'myrqvia') + '</span></div></div></div>' : '';

    els.infoBody.innerHTML = hero + settingsGroup + membersHTML + dmMeta +
      '<div class="info-danger"><button type="button" class="info-row" data-info-action="clear">清空聊天记录</button></div>' +
      '<p class="info-foot">联系人来自服务器账号；当前消息记录仍只保存在这台浏览器。</p>';
  }

  function openFriend() {
    if (!els.friendForm) return;
    els.friendHandle.value = '';
    els.friendError.textContent = '';
    els.friendSubmit.disabled = false;
    els.friendSubmit.textContent = '添加好友';
    openLayer('friend');
    setTimeout(function () { try { els.friendHandle.focus(); } catch (error) {} }, 240);
  }

  async function submitFriend(event) {
    event.preventDefault();
    if (!els.friendHandle) return;
    const raw = els.friendHandle.value.trim();
    els.friendError.textContent = '';
    if (!/^@[A-Za-z][A-Za-z0-9_]{4,31}$/.test(raw)) {
      els.friendError.textContent = '请输入完整的 @用户名，例如 @happergudroe。';
      els.friendHandle.focus();
      return;
    }
    if (!remoteSession()) {
      els.friendError.textContent = '请先登录 MYRQVIA 账号。';
      return;
    }
    els.friendSubmit.disabled = true;
    els.friendSubmit.textContent = '添加中…';
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: raw })
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        const messages = {
          user_not_found: '没有找到这个 @用户名。',
          contact_exists: '这个好友已经在你的联系人里。',
          cannot_add_self: '不能添加自己。',
          invalid_username: '用户名格式不正确。',
          unauthenticated: '登录已失效，请重新登录。'
        };
        throw new Error(messages[data.error] || '添加失败，请稍后再试。');
      }
      const profile = data.contact;
      upsertRemoteContact(profile);
      renderContactsPage();
      renderList();
      renderTabPages();
      closeLayer('friend');
      showToast('已添加 @' + profile.username);
      startChatWith(profile.username);
    } catch (error) {
      els.friendError.textContent = error.message || '添加失败，请稍后再试。';
    } finally {
      els.friendSubmit.disabled = false;
      els.friendSubmit.textContent = '添加好友';
    }
  }

  function openCompose(mode) {
    state.forwardMsgId = mode === 'forward' ? state.forwardMsgId : null;
    state.contactSearch = '';
    els.contactSearch.value = '';
    els.composeTitle.textContent = mode === 'forward' ? '转发给' : '新消息';
    els.contactSearch.placeholder = mode === 'forward' ? '搜索会话' : '搜索联系人';
    renderComposeList(mode);
    openLayer('compose');
    if (isMobile()) state.contactSearchMode = mode;
  }

  function renderComposeList(mode) {
    const query = state.contactSearch.trim().toLowerCase();
    if (mode === 'forward') {
      const rows = store.conversations.filter((convo) => {
        if (!query) return true;
        return (convo.name + ' ' + previewFor(convo)).toLowerCase().indexOf(query) !== -1;
      });
      els.contactList.innerHTML = rows.length ? rows.map((convo) =>
        '<button type="button" class="contact-row" data-forward-to="' + esc(convo.id) + '">' +
          convoAvatarHTML(convo) +
          '<span class="contact-meta"><span class="contact-name">' + esc(convo.name) + '</span>' +
          '<span class="contact-note">' + esc(truncate(previewFor(convo), 34)) + '</span></span>' +
          icon('chevron', 'ico row-chevron') +
        '</button>').join('') : '<div class="compose-empty">没有找到会话</div>';
      return;
    }
    const rows = store.contacts.filter((entry) => {
      const p = person(entry.id);
      return !query || (p.name + ' ' + p.handle + ' ' + entry.note).toLowerCase().indexOf(query) !== -1;
    });
    els.contactList.innerHTML = rows.length ? rows.map((entry) => {
      const p = person(entry.id);
      return '<button type="button" class="contact-row" data-contact="' + esc(p.id) + '">' +
        avatarHTML(p.id, 'avatar') +
        '<span class="contact-meta"><span class="contact-name">' + esc(p.name) + '</span>' +
        '<span class="contact-note">' + esc(p.presence || '离线') + '</span></span>' +
        icon('chevron', 'ico row-chevron') +
      '</button>';
    }).join('') : '<div class="compose-empty">没有找到联系人</div>';
  }

  function startChatWith(personId) {
    const existing = store.conversations.find((c) => c.type === 'dm' && c.members[0] === personId);
    if (existing) {
      closeLayer('compose');
      openChat(existing.id, { focus: true });
      return;
    }
    const p = person(personId);
    const convo = {
      id: 'dm-' + personId,
      type: 'dm',
      name: p.name,
      members: [personId],
      pinned: false,
      muted: false,
      unread: 0,
      time: '现在',
      preview: '开始对话',
      online: !!p.online,
      presence: p.presence || '离线',
      day: '今天',
      messages: []
    };
    store.conversations.unshift(convo);
    closeLayer('compose');
    openChat(convo.id, { focus: true });
  }

  function forwardMessage(msgId, convoId) {
    const source = activeConversation();
    const msg = findMessage(source, msgId);
    const target = store.conversations.find((c) => c.id === convoId);
    if (!msg || !target) return;
    const copyMsg = {
      id: uid(),
      from: 'me',
      time: nowTime(),
      status: 'read',
      forwardedFrom: msg.from === 'me' ? '你' : person(msg.from).name,
      kind: msg.kind,
      text: msg.text,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      imageSrc: msg.imageSrc
    };
    target.messages.push(copyMsg);
    target.time = '现在';
    closeLayer('compose');
    renderList();
    if (state.activeId === target.id) renderChat({ scroll: 'bottom', animate: false });
    showToast('已转发给 ' + target.name);
    state.forwardMsgId = null;
  }

  /* ======================================================================
     Alerts
     ====================================================================== */

  function askConfirm(options) {
    const opts = options || {};
    els.alertTitle.textContent = opts.title || '确认操作';
    els.alertBody.textContent = opts.body || '';
    els.alertConfirm.textContent = opts.confirm || '确认';
    els.alertConfirm.classList.toggle('alert-btn-destructive', opts.destructive !== false);
    openLayer('alert');
    return new Promise((resolve) => {
      state.alertResolve = resolve;
    });
  }

  function resolveAlert(value) {
    const resolve = state.alertResolve;
    state.alertResolve = null;
    closeLayer('alert');
    if (resolve) resolve(!!value);
  }

  function resetDemo() {
    askConfirm({
      title: '清除本地演示数据？',
      body: '将重置演示消息、公告阅读状态与所有偏好设置，此操作无法撤销。',
      confirm: '清除'
    }).then((confirmed) => {
      if (!confirmed) return;
      try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* noop */ }
      store.conversations = clone(MYRQVIA.data.conversations);
      store.announcements = clone(MYRQVIA.data.announcements);
      settings = Object.assign({}, DEFAULT_SETTINGS);
      state.activeId = 'design';
      state.search = '';
      state.replyTo = null;
      state.forwardMsgId = null;
      state.activeNoticeId = null;
      els.search.value = '';
      closeLayer('settings');
      closeLayer('notice');
      closeLayer('info');
      closeLayer('compose');
      applyAllSettings();
      renderAll();
      setRoute(isMobile() ? 'list' : 'chat');
      showToast('演示数据已重置');
    });
  }

  function clearChat() {
    const convo = activeConversation();
    if (!convo) return;
    askConfirm({
      title: '清空聊天记录？',
      body: '将清除「' + convo.name + '」在当前浏览器里的演示消息，无法恢复。',
      confirm: '清空'
    }).then((confirmed) => {
      if (!confirmed) return;
      convo.messages = [];
      convo.time = '';
      state.replyTo = null;
      hideReplyPreview();
      closeLayer('info');
      renderChat({ scroll: 'bottom', animate: false });
      renderList();
      showToast('聊天记录已清空');
    });
  }

  /* ======================================================================
     Static event wiring
     ====================================================================== */

  function bindStaticEvents() {
    bindFeatureEvents();
    if (els.friendForm) els.friendForm.addEventListener('submit', submitFriend);
    document.addEventListener('click', onDocumentClick);
    els.chatList.addEventListener('click', onChatListClick);
    els.chatList.addEventListener('pointerdown', onListPointerDown);
    window.addEventListener('pointermove', onListPointerMove, { passive: false });
    window.addEventListener('pointerup', onListPointerUp);
    window.addEventListener('pointercancel', cancelListSwipe);
    els.messages.addEventListener('click', onMessagesClick);
    els.chatScroll.addEventListener('scroll', onChatScroll, { passive: true });
    els.jump.addEventListener('click', () => scrollToBottom(false));
    els.search.addEventListener('input', () => {
      state.search = els.search.value;
      renderList();
    });
    if (els.contactsSearch) {
      els.contactsSearch.addEventListener('input', () => {
        state.contactsPageQuery = els.contactsSearch.value;
        renderContactsPage();
      });
    }
    els.search.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        els.search.value = '';
        state.search = '';
        renderList();
        els.search.blur();
      }
    });
    els.contactSearch.addEventListener('input', () => {
      state.contactSearch = els.contactSearch.value;
      renderComposeList(state.forwardMsgId ? 'forward' : 'new');
    });
    els.input.addEventListener('input', function () {
      resizeComposer();
      notifyTyping();
    });
    els.input.addEventListener('keydown', onComposerKeydown);
    els.composer.addEventListener('submit', (event) => {
      event.preventDefault();
      sendCurrent();
    });
    els.replyClose.addEventListener('click', () => {
      state.replyTo = null;
      hideReplyPreview();
    });
    els.plus.addEventListener('click', openAttach);
    els.photoInput.addEventListener('change', () => handlePhoto(els.photoInput));
    els.fileInput.addEventListener('change', () => handleFile(els.fileInput));
    els.noticeBody.addEventListener('click', (event) => {
      const row = event.target.closest('[data-notice]');
      if (!row) return;
      state.activeNoticeId = row.dataset.notice;
      const target = store.announcements.find((a) => a.id === state.activeNoticeId);
      if (target) target.unread = false;
      renderNotices();
      updateBadges();
    });
    els.infoBody.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-info-toggle]');
      if (toggle) {
        const convo = activeConversation();
        if (!convo) return;
        const key = toggle.dataset.infoToggle;
        convo[key] = !convo[key];
        toggle.setAttribute('aria-checked', convo[key] ? 'true' : 'false');
        renderList();
        return;
      }
      const action = event.target.closest('[data-info-action]');
      if (!action) return;
      if (action.dataset.infoAction === 'notice') {
        closeLayer('info');
        openNotices();
      } else if (action.dataset.infoAction === 'clear') {
        clearChat();
      }
    });
    els.contactList.addEventListener('click', (event) => {
      const contactRow = event.target.closest('[data-contact]');
      if (contactRow) { startChatWith(contactRow.dataset.contact); return; }
      const forwardRow = event.target.closest('[data-forward-to]');
      if (forwardRow && state.forwardMsgId) forwardMessage(state.forwardMsgId, forwardRow.dataset.forwardTo);
    });

    const sizeRange = $('#chat-size-range');
    if (sizeRange) {
      sizeRange.addEventListener('input', () => {
        const next = SIZE_ORDER[clamp(Number(sizeRange.value), 0, SIZE_ORDER.length - 1)];
        settings.chatSize = next;
        saveSettings();
        updateRangeFill(sizeRange);
        const label = $('#chat-size-label');
        if (label) label.textContent = SIZE_LABEL[next] || '标准';
        els.html.dataset.chatSize = next;
        syncMePage();
      });
    }

    els.contextActions.addEventListener('click', (event) => {
      const button = event.target.closest('[data-ctx]');
      if (!button) return;
      handleContextAction(button.dataset.ctx);
    });
    els.reactionBar.addEventListener('click', (event) => {
      const button = event.target.closest('[data-reaction]');
      if (!button) return;
      toggleReaction(state.menuMsgId, button.dataset.reaction);
    });

    document.addEventListener('keydown', onKeydown);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerup', cancelPress);
    document.addEventListener('pointercancel', cancelPress);
    els.messages.addEventListener('contextmenu', onContextMenu);

    window.addEventListener('online', () => {
      updateNetwork();
      showToast('网络已恢复');
    });
    window.addEventListener('offline', () => {
      updateNetwork();
      showToast('网络已断开，消息将保留在本地', 'alert');
    });
    updateNetwork();

    systemThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemTheme = () => { if (settings.theme === 'system') applyTheme(); };
    if (systemThemeMedia.addEventListener) systemThemeMedia.addEventListener('change', onSystemTheme);
    else if (systemThemeMedia.addListener) systemThemeMedia.addListener(onSystemTheme);

    window.addEventListener('resize', () => {
      if (!isMobile() && state.route === 'list') setRoute('chat');
      updateJumpButton();
    });

    if (window.visualViewport) {
      const syncViewport = () => {
        if (!isMobile()) return;
        const vv = window.visualViewport;
        const keyboard = window.innerHeight - vv.height > 130;
        els.html.dataset.keyboard = keyboard ? 'true' : 'false';
        els.html.style.setProperty('--vv-height', vv.height + 'px');
        els.html.style.setProperty('--vv-top', vv.offsetTop + 'px');
        if (keyboard) requestAnimationFrame(() => scrollToBottom(true));
      };
      window.visualViewport.addEventListener('resize', syncViewport);
      window.visualViewport.addEventListener('scroll', syncViewport);
    }

    els.input.addEventListener('focus', () => {
      if (isMobile()) setTimeout(() => scrollToBottom(true), 280);
    });
  }

  function onDocumentClick(event) {
    const tabButton = event.target.closest('[data-tab]');
    if (tabButton) {
      setSection(tabButton.dataset.tab);
      return;
    }
    const archiveAction = event.target.closest('[data-archive-id]');
    if (archiveAction) {
      archiveConversation(archiveAction.dataset.archiveId);
      return;
    }
    const unarchive = event.target.closest('[data-unarchive]');
    if (unarchive) {
      unarchiveConversation(unarchive.dataset.unarchive);
      return;
    }
    const archiveOpen = event.target.closest('[data-archive-open]');
    if (archiveOpen) {
      closeLayer('archive');
      openChat(archiveOpen.dataset.archiveOpen);
      return;
    }
    const savedOpen = event.target.closest('[data-saved-open]');
    if (savedOpen) {
      closeLayer('saved');
      openChat(savedOpen.dataset.savedOpen);
      return;
    }
    const savedRemove = event.target.closest('[data-saved-remove]');
    if (savedRemove) {
      store.saved = store.saved.filter((item) => item.id !== savedRemove.dataset.savedRemove);
      renderSavedList();
      showToast('已取消收藏');
      return;
    }
    const profileTarget = event.target.closest('[data-profile]');
    if (profileTarget) {
      openProfile(profileTarget.dataset.profile);
      return;
    }
    const profileMessage = event.target.closest('#profile-message');
    if (profileMessage && state.profileId) {
      closeLayer('profile');
      if (state.profileId === 'me') return;
      startChatWith(state.profileId);
      return;
    }
    const contactPageRow = event.target.closest('[data-contact-page]');
    if (contactPageRow) {
      startChatWith(contactPageRow.dataset.contactPage);
      return;
    }
    const noticePageCard = event.target.closest('[data-notice-page]');
    if (noticePageCard) {
      openNotices(noticePageCard.dataset.noticePage);
      return;
    }
    const closeTarget = event.target.closest('[data-close]');
    if (closeTarget) {
      const name = closeTarget.dataset.close;
      event.preventDefault();
      if (name === 'alert') resolveAlert(false);
      else if (name === 'context') closeContext();
      else if (name === 'attach') closeAttach();
      else if (name === 'action-sheet') closeActionSheet();
      else closeLayer(name);
      return;
    }

    const themeChoice = event.target.closest('[data-theme-choice]');
    if (themeChoice) {
      setTheme(themeChoice.dataset.themeChoice);
      return;
    }

    const toggle = event.target.closest('[data-toggle]');
    if (toggle) {
      setToggle(toggle.dataset.toggle);
      return;
    }

    const attach = event.target.closest('[data-attach]');
    if (attach) {
      if (attach.dataset.attach === 'photo') choosePhoto();
      else chooseFile();
      return;
    }

    const alertButton = event.target.closest('[data-alert]');
    if (alertButton) {
      resolveAlert(alertButton.dataset.alert === 'confirm');
      return;
    }

    const actionEl = event.target.closest('[data-action]');
    if (actionEl) {
      const action = actionEl.dataset.action;
      if (action === 'archive') openArchive();
      else if (action === 'saved') openSaved();
      else if (action === 'settings') openSettings();
      else if (action === 'announcements') openNotices();
      else if (action === 'new-chat') openCompose('new');
      else if (action === 'add-friend') openFriend();
      else if (action === 'info') openInfo();
      else if (action === 'back') backToList();
      else if (action === 'reset-demo') resetDemo();
      else if (action === 'home') {
        if (isMobile()) setRoute('list');
        else { els.search.value = ''; state.search = ''; renderList(); }
      }
    }
  }

  function onChatListClick(event) {
    if (Date.now() < state.suppressChatClick) {
      event.preventDefault();
      return;
    }
    const row = event.target.closest('[data-chat]');
    if (!row) return;
    openChat(row.dataset.chat);
  }

  function onListPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const row = event.target.closest('.chat-row');
    if (!row || event.target.closest('[data-archive-id]')) return;
    state.swipe = {
      row: row,
      shell: row.parentElement,
      startX: event.clientX,
      startY: event.clientY,
      dx: 0,
      active: false,
      id: row.dataset.chat
    };
  }

  function onListPointerMove(event) {
    const swipe = state.swipe;
    if (!swipe) return;
    const dx = event.clientX - swipe.startX;
    const dy = event.clientY - swipe.startY;
    if (!swipe.active) {
      if (Math.abs(dx) < 9 || Math.abs(dx) <= Math.abs(dy)) return;
      swipe.active = true;
      swipe.shell.classList.add('is-swiping');
    }
    if (event.cancelable) event.preventDefault();
    swipe.dx = Math.max(-96, Math.min(0, dx));
    swipe.row.style.transform = 'translateX(' + swipe.dx + 'px)';
  }

  function finishListSwipe(commit) {
    const swipe = state.swipe;
    state.swipe = null;
    if (!swipe) return;
    if (!swipe.active) return;
    state.suppressChatClick = Date.now() + 420;
    if (commit && swipe.dx < -52) {
      swipe.shell.classList.add('is-archiving');
      setTimeout(() => archiveConversation(swipe.id), 170);
    } else {
      swipe.row.style.transform = '';
      swipe.shell.classList.remove('is-swiping');
    }
  }

  function onListPointerUp() { finishListSwipe(true); }
  function cancelListSwipe() { finishListSwipe(false); }

  function onMessagesClick(event) {
    const retry = event.target.closest('[data-retry]');
    if (retry) {
      event.stopPropagation();
      retryMessage(retry.dataset.retry);
      return;
    }
    const reaction = event.target.closest('[data-reaction-msg]');
    if (reaction) {
      const row = reaction.closest('.msg');
      const msg = findMessage(activeConversation(), row && row.dataset.id);
      if (!msg) return;
      const pill = msg.reactions && msg.reactions.find((r) => r.emoji === reaction.querySelector('span').textContent);
      if (pill) toggleReaction(msg.id, pill.emoji);
    }
  }

  function onComposerKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      sendCurrent();
    }
  }

  function onChatScroll() {
    updateJumpButton();
    if (!els.contextLayer.hidden) closeContext();
  }

  function onKeydown(event) {
    const meta = event.metaKey || event.ctrlKey;
    if (meta && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (MAJOR_LAYERS.some((name) => { const el = layerElement(name); return el && !el.hidden; })) {
        MAJOR_LAYERS.forEach((name) => closeLayer(name));
      }
      els.search.focus();
      els.search.select();
      return;
    }
    if (event.key !== 'Escape') return;
    if (state.alertResolve) { resolveAlert(false); return; }
    if (!els.contextLayer.hidden) { closeContext(); return; }
    if (!els.attachLayer.hidden) { closeAttach(); return; }
    if (!els.actionSheet.hidden) { closeActionSheet(); return; }
    const openMajor = MAJOR_LAYERS.find((name) => {
      const el = layerElement(name);
      return el && !el.hidden;
    });
    if (openMajor) { closeLayer(openMajor); return; }
    if (document.activeElement === els.search) {
      els.search.value = '';
      state.search = '';
      renderList();
      els.search.blur();
    }
  }

  /* ---- long press ------------------------------------------------------ */

  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const row = event.target.closest('.msg');
    if (!row || row.closest('.msg-system')) return;
    if (event.target.closest('button, a')) return;
    cancelPress();
    state.press = {
      row: row,
      x: event.clientX,
      y: event.clientY,
      timer: setTimeout(() => {
        const current = state.press;
        state.press = null;
        if (!current) return;
        if (navigator.vibrate) { try { navigator.vibrate(8); } catch (err) { /* noop */ } }
        openContext(current.row.dataset.id);
      }, 430)
    };
  }

  function onPointerMove(event) {
    if (!state.press) return;
    const dx = event.clientX - state.press.x;
    const dy = event.clientY - state.press.y;
    if (Math.sqrt(dx * dx + dy * dy) > 8) cancelPress();
  }

  function cancelPress() {
    if (!state.press) return;
    clearTimeout(state.press.timer);
    state.press = null;
  }

  function onContextMenu(event) {
    const row = event.target.closest('.msg');
    if (!row || row.closest('.msg-system')) return;
    if (Date.now() - state.lastContextAt < 400) { event.preventDefault(); return; }
    event.preventDefault();
    openContext(row.dataset.id);
  }

  /* ---- network --------------------------------------------------------- */

  function updateNetwork() {
    if (!els.networkBar) return;
    els.networkBar.hidden = navigator.onLine;
  }

  /* ======================================================================
     Utilities
     ====================================================================== */

  function uid() {
    return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function nowTime() {
    const d = new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function isMobile() {
    return window.matchMedia('(max-width: 820px)').matches;
  }

  function updateSearchHint() {
    const hint = document.querySelector('.search-hint');
    if (!hint) return;
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || '');
    hint.textContent = isMac ? '⌘K' : 'Ctrl K';
  }

  /* ---- live presence UI ------------------------------------------------- */

  function refreshPresenceUI() {
    renderList();
    const convo = activeConversation();
    if (convo) {
      const onlineDot = convo.online || (convo.type === 'dm' && person(convo.members[0]).online);
      els.peerSub.innerHTML = (onlineDot ? '<i class="online-dot"></i>' : '') + esc(convo.presence || '');
    }
    if (state.section === 'contacts') renderContactsPage();
  }

  function applyPresence(map) {
    Object.keys(store.people).forEach(function (id) {
      const p = store.people[id];
      if (!p) return;
      const entry = p.handle ? map[String(p.handle).toLowerCase()] : null;
      p.online = !!(entry && entry.online);
      p.lastSeenAt = entry && entry.lastSeenAt ? entry.lastSeenAt : null;
      p.presence = entry && entry.label ? entry.label : '离线';
    });
    store.conversations.forEach(function (convo) {
      if (convo.type === 'group') {
        const members = convo.members.filter(function (id) { return id !== 'me'; })
          .map(function (id) { return store.people[id]; }).filter(Boolean);
        const online = members.filter(function (p) { return p.online; }).length;
        convo.online = online > 0;
        convo.presence = online > 0 ? online + ' 人在线' : members.length + ' 位成员';
      } else {
        const p = store.people[convo.members[0]];
        convo.online = !!(p && p.online);
        convo.presence = p ? p.presence : '离线';
      }
    });
    refreshPresenceUI();
  }

  // exposed for the design-system page's live component examples
  MYRQVIA.messenger = {
    settings: function () { return Object.assign({}, settings); },
    effectiveTheme: effectiveTheme,
    openSettings: openSettings,
    openNotices: openNotices,
    placeholders: { REACTIONS: REACTIONS.slice() }
  };

  init();

  window.MYRQVIA_APP = {
    store: store,
    applyPresence: applyPresence,
    refreshPresenceUI: refreshPresenceUI
  };
  document.dispatchEvent(new CustomEvent('myrqvia:app-ready'));
})();


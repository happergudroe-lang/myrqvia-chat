/* MYRQVIA Chat 2.0 — local design-prototype data.
   Chat content lives in the browser. Presence is real and comes from the authenticated SSE service; no status is seeded or simulated. */
(function () {
  'use strict';

  window.MYRQVIA = window.MYRQVIA || {};

  const people = {
    me:       { id: 'me',       name: '陈屿', initials: '屿', tone: 'slate', handle: 'myrqvia_1688', online: false },
    linshen:  { id: 'linshen',  name: '林深', initials: '林', tone: 'sage',  handle: 'linshen',    online: false,  role: '群主' },
    zhoutang: { id: 'zhoutang', name: '周棠', initials: '棠', tone: 'clay',  handle: 'tang_2',     online: false,  role: '动效' },
    suwan:    { id: 'suwan',    name: '苏晚', initials: '晚', tone: 'sand',  handle: 'suwan',      online: false },
    chenmo:   { id: 'chenmo',   name: '陈默', initials: '默', tone: 'stone', handle: 'chenmo',     online: false },
    xuyizhou: { id: 'xuyizhou', name: '许一舟', initials: '舟', tone: 'ink', handle: 'yizhou',     online: false },
    mama:     { id: 'mama',     name: '妈妈', initials: '妈', tone: 'rose',  handle: 'family_lin', online: false },
    laozhao:  { id: 'laozhao',  name: '老赵', initials: '赵', tone: 'sage',  handle: 'zhao_badm',  online: false }
  };

  const conversations = [
    {
      id: 'design',
      type: 'group',
      name: 'MYRQVIA 设计组',
      members: ['linshen', 'zhoutang', 'me'],
      pinned: true,
      muted: false,
      unread: 0,
      time: '14:24',
      preview: '林深：稳。',
      online: false,
      presence: '3 位成员',
      day: '今天 14:02',
      messages: [
        { id: 'd1', from: 'linshen', text: '2.0 的第一版交互稿我过了一遍，信息层级比上一版干净很多。', time: '14:02' },
        { id: 'd2', from: 'me', text: '会话列表的密度又压了一点，桌面端 72 的行高刚好。', time: '14:03', status: 'read' },
        { id: 'd3', from: 'zhoutang', text: '撤回动画那版我看了三遍。粒子从右上角散开的感觉对了，但后半段有点急。', time: '14:05', reactions: [{ emoji: '❤️', count: 2, me: true }] },
        { id: 'd4', from: 'me', text: '把三批粒子的间隔调到 180ms 了，慢一点，层次更清楚。', time: '14:06', status: 'read' },
        { id: 'd5', from: 'linshen', text: '浅色模式的气泡灰可以再冷半度，现在和侧栏有一点糊在一起。', time: '14:10' },
        { id: 'd6', from: 'me', text: '收到，我调成 #EBEBEF，侧栏保持 #F5F5F7。', time: '14:12', status: 'read', reactions: [{ emoji: '👍', count: 1, me: false }] },
        { id: 'd7', from: 'zhoutang', text: '长按菜单的行高用 44 吧，触控面积稳一点。', time: '14:13' },
        { id: 'd8', from: 'zhoutang', kind: 'file', fileName: '撤回动效-分镜.pdf', fileSize: '2.4 MB', time: '14:14' },
        { id: 'd9', from: 'me', text: '好。还有公告页，我打算做成一张可扫读的卡片，不做弹窗。', time: '14:15', status: 'read' },
        { id: 'd10', from: 'linshen', text: '同意，弹窗会打断。未读用一个小蓝点就够。', time: '14:18' },
        { id: 'd11', from: 'me', text: '今晚我把 iPhone 和桌面两套并在一起发群里。', time: '14:20', status: 'read' },
        { id: 'd12', from: 'zhoutang', replyTo: 'd11', text: '记得留减少动态效果的降级。', time: '14:21' },
        { id: 'd13', from: 'me', text: '已经做了，系统级 prefers-reduced-motion 也接上了。', time: '14:22', status: 'read' },
        { id: 'd14', from: 'linshen', text: '稳。', time: '14:24' }
      ]
    },
    {
      id: 'linshen',
      type: 'dm',
      name: '林深',
      members: ['linshen'],
      pinned: false,
      muted: false,
      unread: 1,
      time: '14:21',
      preview: '那版深色模式的对比度我再看一下',
      online: false,
      presence: '离线',
      day: '今天 13:58',
      messages: [
        { id: 'l1', from: 'linshen', text: '深色模式下的次级文字，我总觉得压得有点低。', time: '13:58' },
        { id: 'l2', from: 'me', text: '现在是 #98989F，在白底上是 5.4:1，黑底上是 4.9:1。', time: '14:01', status: 'read' },
        { id: 'l3', from: 'linshen', text: '那版深色模式的对比度我再看一下，晚点给你结论。', time: '14:21' }
      ]
    },
    {
      id: 'zhoutang',
      type: 'dm',
      name: '周棠',
      members: ['zhoutang'],
      pinned: false,
      muted: false,
      unread: 0,
      time: '13:48',
      preview: '撤回动画的缓动曲线发我一下',
      online: false,
      presence: '离线',
      day: '今天 13:40',
      messages: [
        { id: 'z1', from: 'me', text: '分镜收到，第三批粒子的密度我降了一点。', time: '13:40', status: 'read' },
        { id: 'z2', from: 'zhoutang', text: '看到了，消散的边界更干净。', time: '13:44' },
        { id: 'z3', from: 'zhoutang', text: '撤回动画的缓动曲线发我一下，我想在文档里标注。', time: '13:48' }
      ]
    },
    {
      id: 'product',
      type: 'group',
      name: '产品同步',
      members: ['suwan', 'linshen', 'chenmo', 'me'],
      pinned: false,
      muted: true,
      unread: 0,
      time: '昨天',
      preview: '苏晚：周五的评审改到 15:30',
      online: false,
      presence: '4 位成员',
      day: '昨天 18:12',
      messages: [
        { id: 'p1', from: 'suwan', text: '周五的评审改到 15:30，会议室还是 3F 白板间。', time: '18:12' },
        { id: 'p2', from: 'linshen', text: '收到。我把 2.0 的视觉稿提前一版发群里。', time: '18:16' },
        { id: 'p3', from: 'chenmo', text: '需要我准备数据那部分吗？', time: '18:22' },
        { id: 'p4', from: 'me', text: '先不用，这轮只看交互和视觉。', time: '18:24', status: 'read' }
      ]
    },
    {
      id: 'chenmo',
      type: 'dm',
      name: '陈默',
      members: ['chenmo'],
      pinned: false,
      muted: false,
      unread: 0,
      time: '昨天',
      preview: '收到，我晚点回你',
      online: false,
      presence: '离线',
      day: '昨天 16:00',
      messages: [
        { id: 'c1', from: 'me', text: '帮我看一眼会话列表的截屏，行高是不是太松了？', time: '16:00', status: 'read' },
        { id: 'c2', from: 'chenmo', text: '收到，我晚点回你。', time: '16:02' }
      ]
    },
    {
      id: 'xuyizhou',
      type: 'dm',
      name: '许一舟',
      members: ['xuyizhou'],
      pinned: false,
      muted: false,
      unread: 0,
      time: '周二',
      preview: '文件：MYRQVIA 品牌规范 v2.pdf',
      online: false,
      presence: '离线',
      day: '周二 11:20',
      messages: [
        { id: 'x1', from: 'xuyizhou', kind: 'file', fileName: 'MYRQVIA 品牌规范 v2.pdf', fileSize: '8.6 MB', time: '11:20' },
        { id: 'x2', from: 'xuyizhou', text: '品牌规范更新了，字标间距统一到 0.18em。', time: '11:21' },
        { id: 'x3', from: 'me', text: '收到，我同步到设计系统里。', time: '11:26', status: 'read' }
      ]
    },
    {
      id: 'mama',
      type: 'dm',
      name: '妈妈',
      members: ['mama'],
      pinned: false,
      muted: true,
      unread: 1,
      time: '周一',
      preview: '到了记得说一声',
      online: false,
      presence: '离线',
      day: '周一 20:40',
      messages: [
        { id: 'm1', from: 'mama', text: '降温了，外套带上。', time: '20:40' },
        { id: 'm2', from: 'mama', text: '到了记得说一声。', time: '20:41' },
        { id: 'm3', from: 'me', text: '好，我明天到。', time: '20:52', status: 'read' }
      ]
    },
    {
      id: 'badminton',
      archived: true,
      type: 'group',
      name: '周末羽毛球',
      members: ['laozhao', 'chenmo', 'me'],
      pinned: false,
      muted: true,
      unread: 0,
      time: '周日',
      preview: '老赵：场地订好了',
      online: false,
      presence: '3 位成员',
      day: '周日 19:08',
      messages: [
        { id: 'b1', from: 'laozhao', text: '场地订好了，周日晚上七点，2 号场。', time: '19:08' },
        { id: 'b2', from: 'chenmo', text: '收到。', time: '19:10' },
        { id: 'b3', from: 'me', text: '我可能晚十分钟。', time: '19:12', status: 'read' }
      ]
    }
  ];

  const announcements = [
    {
      id: 'beta',
      tag: '置顶',
      title: 'MYRQVIA Chat 2.0 设计内测',
      date: '2026年11月5日',
      author: 'MYRQVIA 设计团队',
      unread: true,
      excerpt: '新的会话层级、撤回动效与深浅色系统。',
      body: [
        { type: 'p', text: '2.0 不是一次换皮。我们重写了会话列表的信息密度、移动端的层级关系，以及每一条消息从出现到撤回的动效语言。' },
        { type: 'p', text: '这次内测可以体验：' },
        { type: 'list', items: [
          '重新设计的会话列表与聊天页，桌面、平板与手机共用一套规范。',
          '长按消息后的原生操作菜单，回应、回复、复制与撤回都在原位完成。',
          '撤回动效：粒子从气泡右上角出发，分三批向左下消散。',
          '完整的浅色与深色模式，以及跟随系统的自动切换。'
        ] },
        { type: 'p', text: '内测期间，部分能力仍是设计原型。我们会在验证后逐步开放，而不是先做出看起来能用、实际不能用的入口。' },
        { type: 'quote', text: '撤回不是消失，而是一次有秩序的退场。' },
        { type: 'p', text: '如果你在体验里发现任何不自然的地方，可以直接告诉我们。' }
      ]
    },
    {
      id: 'recall',
      tag: '',
      title: '撤回动效的三条原则',
      date: '2026年11月3日',
      author: '周棠 · 动效设计',
      unread: false,
      excerpt: '慢一点，但不要让人等待。',
      body: [
        { type: 'p', text: '撤回是聊天里少数带有情绪的动作。它不应该像一次系统删除，而更像一句话安静地退场。' },
        { type: 'p', text: '我们给这个动效定了三条原则：' },
        { type: 'list', items: [
          '方向明确：粒子从气泡右上角出发，向左下扩散，和阅读方向相反。',
          '节奏有层次：三批粒子间隔 180ms，总时长控制在 1.6 秒内。',
          '尊重系统：开启减少动态效果时，只保留一次 200ms 的淡出。'
        ] },
        { type: 'p', text: '动画不能阻塞滚动，也不能让下一条消息跟着抖动。这是底线。' },
        { type: 'quote', text: '慢一点，但不要让人等待。' }
      ]
    },
    {
      id: 'prototype',
      tag: '',
      title: '现在的 MYRQVIA 接入了什么',
      date: '2026年11月8日',
      author: 'MYRQVIA 设计团队',
      unread: false,
      excerpt: '真实邮箱验证码、会话和在线状态已经接入；即时通讯后端仍未完成。',
      body: [
        { type: 'p', text: 'MYRQVIA 已经不再是纯本地原型。通过 Node 服务，登录使用真实 Gmail 邮箱验证码，账号会话由服务端 Cookie 管理，在线状态通过 SSE 实时同步。' },
        { type: 'p', text: '可以真实使用：邮箱验证码登录与注册、用户名唯一性、服务端会话、真实在线与最后在线、九语言界面、主题与字体设置、消息操作。' },
        { type: 'p', text: '仍未实现：WebSocket 实时消息、消息持久化与跨设备同步、真实好友关系、通话、管理员权限、系统推送。界面不会用「点击后弹一句提示」来假装这些功能存在。' },
        { type: 'p', text: '消息记录与偏好仍保存在浏览器；刷新后本地演示消息会重置。真实账号与在线状态保存在本地 Node 服务的数据文件中。' }
      ]
    }
  ];

  const contacts = [
    { id: 'linshen', note: '在线' },
    { id: 'zhoutang', note: '在线' },
    { id: 'suwan', note: '离线' },
    { id: 'chenmo', note: '在线' },
    { id: 'xuyizhou', note: '离线' },
    { id: 'mama', note: '家人' },
    { id: 'laozhao', note: '球友' }
  ];

  MYRQVIA.data = {
    people,
    conversations,
    announcements,
    contacts
  };
})();


# MYRQVIA Chat 2.0

> 一款以 iMessage 的阅读手感、Telegram 的结构与资料页为参照的现代即时通讯产品。
> 邮箱验证码账号体系 · 五栏移动导航 · 圆润窗口 · 实时交互预留层。

MYRQVIA Chat 2.0 不是一张漂亮的聊天截图，也不是套着苹果皮肤的后台模板。它是一套完整、可交互、可逐项检查的设计交付：桌面端、iPhone、浅色与深色、真实的组件状态，以及只属于 MYRQVIA 的消息撤回动效。

**建议从这里开始：** 打开 [`showcase.html`](showcase.html) 查看完整设计交付。  
**想直接体验：** 打开 [`index.html`](index.html)。无需安装、无需构建、无外链依赖。

---

## 1. 交付入口

| 页面 | 内容 |
|---|---|
| [`showcase.html`](showcase.html) | 设计交付总览：桌面端、iPhone、浅/深色、撤回动画、规范与交付索引 |
| [`login/`](login/) | 中央式登录 / 邮箱验证码 / 注册 / 找回密码（`/login` 无 `.html`） |
| [`index.html`](index.html) | 可交互的 MYRQVIA Chat 原型（桌面 + iPhone 响应式） |
| [`design-system.html`](design-system.html) | 视觉规范：品牌、色彩、字体、布局、组件状态、动效参数 |
| [`recall-lab.html`](recall-lab.html) | 撤回动效实验台：播放、慢放、逐帧定格、减少动态效果 |
| [`screens/`](screens/) | 真实渲染的界面截图（含 2× 资源） |
| [`docs/recall-animation.md`](docs/recall-animation.md) | 撤回动效的技术与设计说明 |
| [`docs/backend-handoff.md`](docs/backend-handoff.md) | 邮箱验证码、实时通讯、归档与 MYRQVIA CORE 1.0 的后端契约 |
| [`README.md`](README.md) | 本文件：设计说明、边界与验收清单 |

直接双击 HTML 即可。若浏览器对 `file://` 下的脚本有限制，可在本目录运行任意静态服务器，例如 `python -m http.server 8080`，再访问 `http://127.0.0.1:8080/`。

---

## 1.1 手机端新增（本轮）

- 搜索页：圆角搜索框、聊天 / 联系人 / 媒体 / 文件分类、输入时骨架屏、真实过滤结果。
- 表情面板：表情 / 贴纸 / GIF 三栏，点击直接发送。
- 附件底部菜单：相册、礼物、文件、钱包、位置、音乐，全部有内容或真实动作，不是空壳。
- 音乐播放器：本地 WAV 演示曲、播放 / 暂停 / 上一首 / 下一首 / 拖动进度、播放列表。
- 相机：附件 → 相册 → 拍照，调用摄像头并拍成图片消息；无权限/非 HTTPS 时自动提供「使用系统相机」兜底。
- 相册选择后会作为图片消息进入聊天；位置、钱包、礼物为本地演示，不接真实支付或坐标服务。

截图：[拍照](screens/mobile-camera.png) · [搜索](screens/mobile-search.png) · [表情](screens/mobile-sticker.png) · [附件](screens/mobile-media.png) · [音乐](screens/mobile-music.png)

---

## 1.2 品牌 Logo

MYRQVIA 的独立标识是 **The Quiet Orbit**：一个开口轨道 + 一个卫星点。它不使用 Telegram 纸飞机、不使用单独字母 N、也不使用常见聊天气泡。

- 展示板：`brand/myrqvia-identity.png`
- 主 Logo：`brand/myrqvia-logo-primary.svg`
- App Icon：`brand/myrqvia-app-icon.svg`
- 完整文件与使用说明：`brand/README.md`

Logo 已应用到登录页、favicon 和 App Icon。商业使用前仍需自行做 **MYRQVIA 名称与图形的商标检索**；原创绘制不等于法律上的不侵权保证。

## 1.3 真实邮箱验证码

仓库内已加入零依赖 Node 服务：`server/server.mjs`。

```bash
cd server
cp .env.example .env
# 填 AUTH_SECRET；本地测试先 EMAIL_PROVIDER=console
node server.mjs
```

打开 `http://localhost:8787/login`，验证码会打印在服务端终端。

真实发信使用 Gmail（需要 Google 应用专用密码，不是登录密码）：

```env
EMAIL_PROVIDER=gmail
GMAIL_USER=your-account@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
GMAIL_SMTP_PORT=587
```

也支持 Resend 或自有 webhook。完整配置、API 契约、限流与安全说明见 `server/README.md`。

- 直接双击 `login.html` 仍是本地演示模式。
- 通过服务访问时 `js/config.js` 自动使用真实 API。
- `?demo=1` 可以强制本地演示。
- 远程模式不再显示固定验证码 `246810`。

## 1.4 真实在线状态

在线状态不再来自原型里的 `online: true` 假数据。

- 登录后的浏览器会建立带 Cookie 的 SSE：`GET /api/presence/stream?keys=...`
- 只有当前真正持有 SSE 连接的账号才显示「在线」
- 关闭最后一个标签页后，服务端写入真实的 `lastSeenAt`
- 界面按时间显示：`1 分钟内在线`、`N 分钟前在线`、`今天 HH:MM 在线`、`昨天 HH:MM 在线`
- 没有真实的 last seen 时间时只显示「离线」，不虚构「最近在线」
- 群聊显示真实在线人数；没有人在线时显示成员数，不伪造在线
- 服务重启、断网或未登录时，全部回落到离线

要让「许一舟」显示在线，必须有账号用户名为 `yizhou` 的真人登录并保持页面打开；只开一个窗口时其他联系人离线是正确行为。

## 2. 设计定位

MYRQVIA 不复制任何一个产品，而是吸收它们的原则：

- **层级优先于装饰。** 每个页面只有一个视觉主角，其他元素后退为结构。
- **原生触感。** 44pt 触控行高、系统级圆角、真实安全区、iOS 风格的推入与弹性曲线。
- **低饱和。** 中性背景、一个克制的 iMessage 蓝、少量语义色；液态玻璃只用于导航与浮层，正文保持实底，没有紫蓝渐变和发光边框。
- **留白是设计。** 桌面端 318px 会话栏 + 752px 聊天阅读列；不常驻资料栏。
- **真实交互。** 所有可见按钮都有真实行为；没有服务端支持的能力不出现。
- **统一气质。** 所有页面共享同一套 token；浅色与深色是同一套关系，而不是两套设计。

### 明确的「不做」

紫色 / 蓝紫大面积渐变 · 整页玻璃拟态 · 毛玻璃卡片堆叠 · AI Dashboard · 发光边框 · 夸张阴影 · 玩具感超圆按钮 · 无意义装饰图标 · 过多分割线 · 机械式模板动画 · 无差别的 Telegram 皮肤复制 · 点击只弹提示的假功能。

---

## 3. 视觉系统速览

完整规范见 [`design-system.html`](design-system.html)。

**颜色（Light / Dark）**

| Token | Light | Dark | 用途 |
|---|---|---|---|
| `--bg-app` | `#FFFFFF` | `#000000` | 聊天背景 |
| `--bg-sidebar` | `#F5F5F7` | `#0B0B0D` | 会话栏 / 分组背景 |
| `--bubble-in` | `#EAEAEE` | `#26262B` | 对方气泡 |
| `--bubble-out` / `--accent` | `#0A7CFF` | `#0A84FF` | 自己气泡 / 主操作 |
| `--text-primary` | `#111113` | `#F2F2F5` | 主文字 |
| `--text-secondary` | `#6F6F78` | `#98989F` | 次级文字 |
| `--red` | `#FF3B30` | `#FF453A` | 删除 / 错误 |
| `--green` | `#34C759` | `#30D158` | 在线 / 开关 |

**字体**

`SF Pro / Segoe UI Variable / Noto Sans SC` 系统字体栈，无外部字体请求。  
聊天正文 16 / 23；列表名称 13.8 / 18；时间与状态 10.5；展示标题 34–44。字重只用 400 / 500 / 600 / 700。

**布局与形状**

318px 桌面会话栏 · 752px 聊天阅读列 · 68px 聊天头 · 72px 桌面会话行 · 19px 气泡圆角（集群最后一颗收至 6px）· 4/8pt 间距节奏 · 仅用发丝线（7.5% / 13% 黑）构建结构。

**动效 token**

120ms（按压）/ 200ms（状态）/ 300ms（面板）/ 360ms（iPhone 推入）。  
曲线：`cubic-bezier(.32,.72,0,1)`（iOS）、`cubic-bezier(.22,1,.36,1)`（out）、`cubic-bezier(.34,1.3,.64,1)`（spring）。  
所有动效尊重 `prefers-reduced-motion` 与应用内的「减少动态效果」开关。

---

## 4. 页面与交互

### 桌面端

- 左侧 318px 会话列表：置顶、未读小蓝点、静音、群头像堆叠、搜索结果。
- 右侧聊天：752px 阅读列、日期分隔、发送者与集群、回应 pill、文件卡片、回复引用、已读回执。
- 设置 / 公告 / 资料 / 长按菜单以独立 sheet 或右侧抽屉出现，不常驻。
- 快捷键：`Ctrl/Cmd + K` 搜索，`Enter` 发送，`Shift + Enter` 换行，`Esc` 关闭当前层。

### iPhone

- 全屏聊天 + 原生导航栏：返回、居中聊天对象与在线状态、详细信息入口。
- 安全区适配：顶部 `env(safe-area-inset-top)`、底部 composer 与 home indicator；键盘弹出时通过 `visualViewport` 调整可视高度并保持输入区可见。
- 会话列表 → 聊天：360ms 推入转场，返回真正回到会话列表。
- 设置与公告在手机上为全屏页面；在桌面上为居中 sheet。

### 2.4 iMessage 圆润窗口

- 所有浮层、菜单、页面卡片、导航栏统一使用 18–36px 的大圆角。
- 桌面侧栏与聊天区各自成为独立的圆角窗口，浮在浅灰画布上；移动端 tab bar 是悬浮玻璃胶囊。
- 页面内容改为浅灰画布 + 白色分组卡片，贴近 iOS 设置 / iMessage 的阅读节奏。
- 上一版的衬线、编号、两栏编辑部式页面已撤掉，不做“杂志感”的实验。

### 导航分栏（本次新增）

- **iPhone**：底部悬浮式液态玻璃菜单栏，固定四个栏位：消息 / 联系人 / 公告 / 我。
- 进入聊天详情后菜单栏自动退场，返回会话列表时恢复；切换栏位有轻微上浮淡入。
- **桌面端**：左侧玻璃导航栏，与移动端共用四个栏位；会话区仍是「导航栏 + 会话栏 + 聊天列」。
- **联系人**：搜索、在线状态、从联系人发起会话。
- **公告**：未读、置顶、阅读状态；点击打开公告详情。
- **我**：账户信息、外观 / 聊天字体 / 减少动态效果摘要，以及设计规范与动效实验台入口。

### 登录系统重构（本轮）

- 已移除左右分屏，改为中央式 430px 登录卡；MYRQVIA Logo、品牌标语与副标题位于卡片上方。
- 四步流程：Email → Verification code → Profile → Success。
- `js/login.js` 负责页面状态、验证码输入、倒计时、加载与错误；`js/auth-service.js` 是认证适配层。
- 远端模式使用 `docs/backend-handoff.md` 的 `/api/auth/*` 契约；设置 `js/config.js` 的 `authApiBase` 即切换。
- 当前仓库没有后端服务，因此默认仍是本地预览模式（验证码 `246810`，卡片底部会明确标注 Local preview）；真实邮件、过期校验、服务端限流与 Session 尚未在本仓库验证。
- 字体使用 Apple system stack（SF Pro / PingFang / Hiragino / Apple SD Gothic Neo），不可用时回退系统字体。
- 支持 9 种语言：简体中文、繁體中文、English、日本語、한국어、Español、Français、Deutsch、Português；语言选择保存在 `myrqvia.locale`。
- Help / Privacy 是真实弹层：帮助含验证码、注册、找回密码说明；隐私说明本地数据、密码、摄像头与清除本地数据入口。
- 验证码页提供明确的 MYRQVIA 蓝色返回箭头；点击后验证码页向右滑出、邮箱页从左侧进入。资料/成功页不显示返回，资料页切换账号用「Change email」。
- 高保真动效示例：`screens/myrqvia-motion-01-email.png`、`-02-verification.png`、`-03-back-transition.png`、`-04-edge-swipe.png`。

### 登录页设计参考

登录页的结构参考了 GitHub 上两个开源项目的信息组织方式，再按 MYRQVIA 的静态技术栈重写，没有引入 React 依赖：

- [archestra-ai/better-auth-ui](https://github.com/archestra-ai/better-auth-ui) — 分组表单、步骤和状态的处理方式
- [PBhadoo/telegram-tt](https://github.com/PBhadoo/telegram-tt) — Telegram Web A 的登录氛围与纸飞机符号

### 账号、工具箱与归档

- **登录**：Telegram 风格的独立 `login.html`，只支持**邮箱 + 验证码**，没有手机号字段。
- 注册时设置**全站唯一的 @用户名**：5–32 位，字母开头，字母 / 数字 / 下划线。
- **忘记密码**：邮箱 + 验证码验证后设置新的备用密码；日常登录仍以邮箱验证码为主。
- **工具箱**：底部菜单第五栏，包含 GitHub、MYRQVIA CORE 1.0、联系与问题反馈（happergudroe@gmail.com）。
- **归档**：会话列表可左滑归档；顶部「已归档」进入归档窗口，可取消归档。
- **我的收藏**：长按消息选择「收藏」，从「我」页面进入收藏窗口。
- **个人资料**：点击「我」的资料卡或联系人头像打开圆角资料窗口。
- **iMessage 输入指示**：发送后出现三点气泡；已读回执使用 `已读` 状态。
- **实时适配层**：`js/config.js` 填入 WebSocket 地址即可接真实服务；当前默认本地演示。

### 真实可用的交互

发送消息（本地）· 长按 / 右键消息 · 回应 · 回复 · 复制 · 转发 · 撤回 · 删除 · 搜索会话 · 新建会话 · 查看群资料 · 置顶 / 静音 · 查看公告并标记已读 · 切换主题 · 调整聊天字体大小 · 减少动态效果 · 已读回执 / 提示音 / 公告提醒开关 · 选择本地照片或文件并预览 · 清空聊天记录 · 重置演示数据。

发送状态（发送中 / 已送达 / 已读 / 失败重试）由本地定时模拟；撤回、删除与转发只作用于当前浏览器内存。它们不是服务端能力的伪装，原型内也有明确说明。

---

## 5. MYRQVIA 撤回动效

> 撤回不是消失，而是一次有秩序的退场。

设计目标：不是淡出、缩小或随机粒子爆炸，而是**消息本体从右上角开始，沿对角线分三批向左下解体**，过程缓慢、连续、有层次，并且不影响其他消息滚动。

### 节奏

| 批次 | 时间窗 | 区域（到右上角的归一化距离） |
|---|---|---|
| 第一波 | 150–410 ms | `d < 0.30` |
| 第二波 | 430–700 ms | `0.30 – 0.66` |
| 第三波 | 720–970 ms | `d > 0.66` |
| 整体收束 | ≈ 1740 ms | 粒子全部淡出；业务层替换为系统行 |

- 消息在最初约 150ms 内保持完整，避免「一开始就整体变淡」的廉价感。
- 三波在时间上轻微重叠；前一波尚未完全消失，下一波已从更靠左下的位置起笔。
- 每个碎片为 3–4 CSS px 的材质 cell，释放后向左下漂移、旋转 ≤ 7°、缩至约 0.4 并淡出；另有少量 1–2px 细尘。
- 动画结束后由业务层插入居中的系统行「你撤回了一条消息」，而不是简单移除行高。

### 实现

- [`js/recall.js`](js/recall.js) 暴露：

```js
MYRQVIA.recall.play(bubbleEl, {
  host: chatInner,        // canvas 挂载的滚动内容容器
  reduceMotion: false,
  speed: 1,
  freezeAt: null,         // 实验台逐帧定格
  onProgress: null
}).then(() => { /* 由业务层替换该消息 */ });
```

- 优先通过 SVG `foreignObject` 将真实气泡（含文字、文件卡片、圆角与颜色）捕获为位图；失败时回退到几何近似，保证动画始终有正确素材。
- Canvas 以 DPR 上限 2 创建，绝对定位在滚动内容内，随内容滚动；播放期间不改变滚动高度、不拦截指针事件，结束后清理 DOM 与 rAF。
- 减少动态效果：不产生粒子，改为 200ms 安静淡出。
- 实验台：[`recall-lab.html`](recall-lab.html)；技术说明：[`docs/recall-animation.md`](docs/recall-animation.md)。

---

## 6. 边界与诚实说明

**登录、账号和在线状态已经连接真实服务，消息层仍是本地演示。**

已经实现：

- Gmail 邮箱验证码发送、10 分钟有效、60 秒重发限制、每小时上限
- 服务端账号与会话 Cookie
- 真实在线状态：认证 SSE 连接存在才显示在线；最后断开时写入真实 last seen
- 用户名唯一性、注册、找回密码的服务端接口
- **一个邮箱只能有一个账号**；重复注册返回 `email_exists`
- **联系人保存在服务端**，添加好友必须输入完整的 `@用户名`，不支持昵称模糊搜索

仍未实现、因此也没有展示：

- 真实 WebSocket 消息推送、消息持久化、跨设备已读与归档
- MYRQVIA CORE 1.0 智能体的真实 API 调用与凭据
- 音视频通话、管理员权限、真实公告下发
- 云端文件上传；照片与文件仅通过 `File` / `ObjectURL` 在当前页面预览

直接打开 `login.html` 时仍是本地演示（验证码 `246810`）。通过 `node server/server.mjs` 打开 `http://localhost:8787/login` 时使用真实 Gmail 验证码。完整配置见 [`server/README.md`](server/README.md)。

刷新页面后，演示消息、会话改动、公告阅读状态与撤回结果会恢复初始状态；主题、字体大小与开关偏好保存在 `localStorage`。发送状态与「已读」仍是本地模拟，用于展示完整的状态设计。

MYRQVIA 不承诺事实正确、不收集数据、不假装拥有未实现的能力。

---

## 7. 文件结构

```text
MYRQVIA Chat 2.0/
├─ showcase.html                 设计交付总览
├─ login.html                    Telegram 风格邮箱验证码登录
├─ index.html                    可交互原型
├─ design-system.html            视觉规范
├─ recall-lab.html               撤回动效实验台
├─ css/
│  ├─ tokens.css                 设计 token（颜色 / 字体 / 间距 / 动效）
│  ├─ app.css                    原型样式（桌面 + iPhone）
│  ├─ imessage.css               iMessage 圆润窗口 / 分组卡片覆盖层
│  ├─ login.css                  登录 / 注册 / 找回密码
│  ├─ showcase.css               交付页样式
│  └─ design-system.css          规范页样式
├─ js/
│  ├─ config.js                  部署配置（GitHub / MYRQVIA / WebSocket）
│  ├─ icons.js                   SVG 图标 helper
│  ├─ data.js                    本地演示数据
│  ├─ realtime.js                WebSocket 实时适配层
│  ├─ login.js                   登录 / 注册 / 找回密码逻辑
│  ├─ app.js                     交互、状态、路由与渲染
│  └─ recall.js                  撤回粒子引擎
├─ screens/                      真实渲染截图（2×）
├─ assets/                       图标、QA 截图与临时预览
├─ scripts/
│  ├─ shoot.mjs                  Edge CDP 确定性截图
│  └─ crop_recall.py             撤回帧裁切
└─ docs/
   ├─ recall-animation.md        撤回动效说明
   ├─ backend-handoff.md         账号 / 实时 / MYRQVIA CORE 1.0 后端契约
   └─（设计说明见本 README）
```

---

## 8. 截图索引

**账号 / 工具**

- [登录 · 桌面](screens/login-desktop.png) · [登录 · 手机](screens/login-mobile.png) · [验证码错误](screens/login-code-error.png) · [成功](screens/login-success.png)
- [桌面工具箱](screens/desktop-toolbox.png) · [iPhone 工具箱](screens/mobile-toolbox.png)

**桌面端**

- [浅色聊天](screens/desktop-chat-light.png) · [深色聊天](screens/desktop-chat-dark.png)
- [设置](screens/desktop-settings-light.png) · [公告](screens/desktop-notice-light.png)
- [长按菜单](screens/desktop-context-light.png) · [详细信息](screens/desktop-info-light.png)

**iPhone**

- [聊天 · Light](screens/mobile-chat-light.png) · [聊天 · Dark](screens/mobile-chat-dark.png)
- [会话列表 · Light](screens/mobile-list-light.png) · [会话列表 · Dark](screens/mobile-list-dark.png)
- [长按菜单](screens/mobile-context-light.png) · [设置 · Light](screens/mobile-settings-light.png) · [设置 · Dark](screens/mobile-settings-dark.png)
- [公告 · Light](screens/mobile-notice-light.png) · [公告 · Dark](screens/mobile-notice-dark.png)
- [iPad 分栏布局](screens/tablet-chat-light.png)
- [iPhone 联系人](screens/mobile-contacts.png) · [公告](screens/mobile-notices.png) · [我](screens/mobile-me.png)
- [桌面联系人](screens/desktop-contacts.png) · [桌面公告](screens/desktop-notices.png) · [桌面我](screens/desktop-me.png)

**动效**

- [200ms](screens/mobile-recall-200.png) · [600ms](screens/mobile-recall-600.png) · [1000ms](screens/mobile-recall-1000.png)
- 逐帧检视：[recall-lab.html](recall-lab.html)

---

## 9. 验收清单

- [x] iPhone 聊天首页（Light / Dark）
- [x] iPhone 会话列表（Light / Dark）
- [x] 桌面端聊天界面（Light / Dark）
- [x] 消息长按操作菜单（iPhone + 桌面）
- [x] 设置界面（Light / Dark）
- [x] 公告展示界面（Light / Dark）
- [x] Light Mode / Dark Mode / 跟随系统
- [x] 关键页面切换：iPhone 推入 / 返回，桌面 sheet 弹性出现
- [x] MYRQVIA 专属撤回粒子动画 + 减少动态效果降级
- [x] 统一设计规范、组件状态与真实可用的演示交互
- [x] 移动端五栏底部菜单 + 桌面端玻璃导航栏（消息 / 联系人 / 公告 / 工具箱 / 我）
- [x] Telegram 风格邮箱验证码登录 / 注册 / 找回密码
- [x] 左滑归档、归档窗口、我的收藏
- [x] 个人资料窗口、iMessage 输入指示、已读回执
- [x] 2× 截图、交付页、规范页、动效实验台
- [x] 无外链字体 / CDN / 网络依赖

**验证环境：** Microsoft Edge 156（Chromium）headless，1440 × 900 与 390 × 844 @2×；截图由真实页面通过 CDP 渲染，不是后期拼贴。建议在 Safari / Chrome 中再体验一次动效与安全区效果。

---

## 10. 明文源码（给 ChatGPT / 其他 AI）

所有 HTML / CSS / JS 都是 UTF-8 明文，可直接作为附件或粘贴发送。为方便整份发送，已额外拼好：

- [HTML + CSS 明文包](MYRQVIA-Chat-2.0-HTML-CSS-明文.txt) — 5 个 HTML + 6 个 CSS，约 505 KB
- [全部源码明文包](MYRQVIA-Chat-2.0-ALL-SOURCE-明文.txt) — HTML + CSS + JS，约 702 KB
- [JS 明文包](MYRQVIA-Chat-2.0-JS-明文.txt) — 交互与撤回引擎，约 198 KB
- [明文源码说明](MYRQVIA-Chat-2.0-明文源码说明.txt) — 文件清单与发送方式
- [给 ChatGPT 的说明](给ChatGPT的说明.txt) — 产品背景、附件清单、评审提示与真实边界
- [逐文件明文目录](MYRQVIA-Chat-2.0-明文源码/) — 11 个 HTML/CSS 的独立 .txt

每个文件之间以 `===== FILE NN/NN: 相对路径 =====` 分隔，ChatGPT 可以直接按文件读取。  
截图与图标在 `screens/`、`assets/`，不属于 HTML/CSS 源码；需要视觉参考时请一并发送。

---

## 11. 设计说明

MYRQVIA 的「高级感」不来自效果，而来自约束：

- 一个蓝色，只在真正需要行动的地方出现。
- 一套灰阶，把层级交给字号、字重、留白与发丝线，而不是阴影和卡片。
- 一套圆角与间距，让所有页面像同一个产品。
- 动画只发生在有意义的地方：消息出现、面板弹出、页面推入、撤回退场。
- 任何装饰性元素都必须回答「它帮助用户理解什么」。

最终目标不是看起来像 Apple，而是让 MYRQVIA 拥有一套自己的、稳定的、可维护的产品气质。

---

MYRQVIA Design · 2026.11  
本地优先。先把交互做真，再把界面做美。

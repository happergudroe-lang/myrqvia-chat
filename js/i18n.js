/* MYRQVIA auth UI — locale catalogue. Brand wordmark/slogan stays English by design. */
(function () {
  'use strict';

  var LOCALES = [
    { id: 'zh-Hans', label: '简体中文', html: 'zh-Hans' },
    { id: 'zh-Hant', label: '繁體中文', html: 'zh-Hant' },
    { id: 'en', label: 'English', html: 'en' },
    { id: 'ja', label: '日本語', html: 'ja' },
    { id: 'ko', label: '한국어', html: 'ko' },
    { id: 'es', label: 'Español', html: 'es' },
    { id: 'fr', label: 'Français', html: 'fr' },
    { id: 'de', label: 'Deutsch', html: 'de' },
    { id: 'pt', label: 'Português', html: 'pt' }
  ];

  var en = {
    'brand.sub': 'A quieter place. A better conversation.',
    'progress.email': 'Email',
    'progress.verify': 'Verify',
    'progress.profile': 'Profile',
    'progress.done': 'Done',
    'progress.password': 'Password',
    'label.email': 'Email address',
    'label.code': 'Verification code',
    'label.name': 'Display name',
    'label.username': 'Username',
    'label.newPassword': 'New password',
    'label.confirmPassword': 'Confirm password',
    'placeholder.email': 'you@example.com',
    'placeholder.name': 'Your name',
    'placeholder.username': 'yourname',
    'placeholder.password': 'At least 8 characters',
    'placeholder.confirm': 'Repeat the password',
    'hint.sending': 'Sending your verification code…',
      'send.note': 'Connecting to the mail service…', 'send.sentTitle': 'Code sent', 'send.sentNote': 'Opening the code entry…',
  'hint.code': 'Enter the 6-digit code. It can take a moment to arrive.',
    'hint.codeLocal': 'Local preview code: {code} · 10 minute validity in production.',
    'hint.username': '5–32 characters, starts with a letter, letters, numbers, and underscores only.',
    'hint.password': 'Use at least 8 characters with letters and numbers. Passwords are never stored by this page.',
    'button.continue': 'Continue',
    'button.verify': 'Verify code',
    'button.create': 'Create account',
    'button.save': 'Save new password',
    'button.enter': 'Enter MYRQVIA Chat',
    'button.backSignIn': 'Back to sign in',
    'link.forgot': 'Forgot password?',
    'link.create': 'Create an account',
    'link.resend': 'Resend code',
    'link.change': 'Change email',
    'link.help': 'Help',
    'link.privacy': 'Privacy',
    'link.back': 'Back to Chat',
    'code.sent': 'Code sent to',
    'code.verified': 'Email verified',
      'code.success': 'Verification successful',
      'code.verifiedNext': 'Taking you to the next step…',
    'resend.countdown': 'Resend in {seconds}s',
    'resend.sending': 'Sending…',
    'mode.local': 'Local preview · demo code {code}',
    'mode.secure': 'Secure email verification',
    'checking': 'Checking…',
    'available': 'Available',
    'unavailable': 'Unavailable',
    'couldNotCheck': 'Could not check',
    'title.welcome': 'Sign in to MYRQVIA Chat',
    'sub.welcome': 'Sign in or create your account with email.',
    'title.create': 'Create your MYRQVIA account',
    'sub.create': 'Start with your email address.',
    'title.check': 'Check your email',
    'sub.check': 'We sent a verification code to your email address.',
    'title.profile': 'Create your account',
    'sub.profile': 'Choose how you appear across MYRQVIA.',
    'title.reset': 'Reset your password',
    'sub.reset': 'Enter the email address linked to your MYRQVIA account.',
    'title.password': 'Set a new password',
    'sub.password': 'Your email is verified. Choose a new password.',
    'title.success': 'Welcome to MYRQVIA',
    'sub.success': 'Your account is ready.',
    'title.passwordUpdated': 'Password updated',
    'sub.passwordUpdated': 'Your MYRQVIA account is ready to use again.',
    'success.welcome': 'Welcome, {name}. Your account is ready to continue the conversation.',
    'success.recovery': 'Your password has been changed. You can sign in with email or use your new password the next time it is requested.',
    'error.email': 'Enter a valid email address.',
    'error.codeLength': 'Enter all 6 digits.',
    'error.invalidCode': 'That code is incorrect or was replaced by a newer email. Use the newest code.',
    'error.expiredCode': 'That code has expired. Request a new code.',
    'error.rateLimit': 'Too many requests. Please wait before requesting another code.',
    'error.accountNotFound': 'No MYRQVIA account uses this email address.',
    'error.emailExists': 'This email already has a MYRQVIA account. Sign in with a code instead.',
    'error.usernameTaken': 'That username is already taken. Try another one.',
    'error.usernameReserved': 'That username is reserved by MYRQVIA.',
    'error.usernameFormat': 'Usernames must be 5–32 characters, start with a letter, and use only letters, numbers, or underscores.',
    'error.network': 'Network unavailable. Check your connection and try again.',
    'error.emailConfig': 'Email delivery is not configured yet. Contact the MYRQVIA operator.',
    'error.emailSend': 'The verification email could not be sent. Try again shortly.',
    'error.resetToken': 'This reset link has expired. Start again.',
    'error.generic': 'Something went wrong. Please try again.',
    'error.name': 'Enter a display name.',
    'error.usernameChoose': 'Choose an available username.',
    'error.password': 'Use at least 8 characters with letters and numbers.',
    'error.passwordMatch': 'The passwords do not match.',
    'language.label': 'Language',
    'legal.help.title': 'Help',
    'legal.help.intro': 'MYRQVIA signs you in with a single-use email code. No phone number is required.',
    'legal.help.point1': 'The code usually arrives within a minute. Check spam, then wait 60 seconds before resending.',
    'legal.help.point2': 'A new email continues to profile setup; an existing email opens Messenger directly.',
    'legal.help.point3': 'Forgot password? Use the email link on the first screen to reset access.',
    'legal.help.point4': 'Need a human? Email support and include the address you tried to use.',
    'legal.privacy.title': 'Privacy',
    'legal.privacy.intro': 'This build is a local front-end prototype. Be clear about what is and is not stored.',
    'legal.privacy.point1': 'Email, display name, username and session are kept in this browser localStorage.',
    'legal.privacy.point2': 'Passwords are never stored by this page. Remote mode should use secure cookies on your backend.',
    'legal.privacy.point3': 'Camera access is requested only after you choose Take photo; the stream stops when the camera closes.',
    'legal.privacy.point4': 'No analytics or third-party font requests are used. You can clear local preview data below.',
    'legal.contact': 'Email support',
    'legal.clear': 'Clear local preview data',
    'legal.clearConfirm': 'Clear the local demo account and session from this browser? This cannot be undone.',
    'legal.close': 'Close'
  };

  var dictionaries = {
    en: en,
    'zh-Hans': {
      'brand.sub': '更安静的地方，更好的对话。',
      'progress.email': '邮箱', 'progress.verify': '验证', 'progress.profile': '资料', 'progress.done': '完成', 'progress.password': '密码',
      'label.email': '邮箱地址', 'label.code': '验证码', 'label.name': '显示名称', 'label.username': '用户名', 'label.newPassword': '新密码', 'label.confirmPassword': '确认新密码',
      'placeholder.email': 'you@example.com', 'placeholder.name': '你的名字', 'placeholder.username': 'yourname', 'placeholder.password': '至少 8 个字符', 'placeholder.confirm': '再次输入密码',
      'hint.sending': '正在发送验证码…',
      'send.note': '正在连接邮箱服务，请稍候…', 'send.sentTitle': '验证码已发送', 'send.sentNote': '正在打开输入页面…',
  'hint.code': '请输入 6 位验证码。邮件可能需要一点时间。', 'hint.codeLocal': '本地预览验证码：{code} · 生产环境 10 分钟有效。',
      'hint.username': '5–32 位，字母开头，仅支持字母、数字和下划线。', 'hint.password': '至少 8 位，同时包含字母和数字。本页面不会保存密码。',
      'button.continue': '继续', 'button.verify': '验证验证码', 'button.create': '创建账号', 'button.save': '保存新密码', 'button.enter': '进入 MYRQVIA Chat', 'button.backSignIn': '返回登录',
      'link.forgot': '忘记密码？', 'link.create': '创建账号', 'link.resend': '重新发送', 'link.change': '修改邮箱', 'link.help': '帮助', 'link.privacy': '隐私', 'link.back': '返回 Chat',
      'code.sent': '验证码已发送至', 'code.verified': '邮箱已验证', 'resend.countdown': '{seconds} 秒后重新发送', 'resend.sending': '发送中…',
      'code.success': '验证成功',
      'code.verifiedNext': '正在进入下一步…',
      'mode.local': '本地预览 · 演示验证码 {code}', 'mode.secure': '安全邮箱验证',
      'checking': '检查中…', 'available': '可用', 'unavailable': '不可用', 'couldNotCheck': '无法检查',
      'title.welcome': '登录 MYRQVIA Chat', 'sub.welcome': '使用邮箱登录或创建你的账号。',
      'title.create': '创建 MYRQVIA 账号', 'sub.create': '从你的邮箱开始。',
      'title.check': '检查你的邮箱', 'sub.check': '我们已向你的邮箱发送验证码。',
      'title.profile': '创建你的账号', 'sub.profile': '选择你在 MYRQVIA 中的展示方式。',
      'title.reset': '重置密码', 'sub.reset': '请输入绑定 MYRQVIA 账号的邮箱地址。',
      'title.password': '设置新密码', 'sub.password': '邮箱已验证。请设置新密码。',
      'title.success': '欢迎来到 MYRQVIA', 'sub.success': '账号已就绪。',
      'title.passwordUpdated': '密码已更新', 'sub.passwordUpdated': '你的 MYRQVIA 账号可以重新使用了。',
      'success.welcome': '{name}，欢迎回来。你的账号已准备好继续对话。', 'success.recovery': '密码已修改。之后可以继续使用邮箱验证码登录。',
      'error.email': '请输入有效的邮箱地址。', 'error.codeLength': '请输入完整的 6 位验证码。', 'error.invalidCode': '验证码不正确，或已被最新验证码替换。请输入最新邮件中的验证码。',
      'error.expiredCode': '验证码已过期，请重新获取。', 'error.rateLimit': '请求过于频繁，请稍后再试。', 'error.accountNotFound': '该邮箱没有 MYRQVIA 账号。',
      'error.emailExists': '该邮箱已有 MYRQVIA 账号，请直接使用验证码登录。', 'error.usernameTaken': '该用户名已被使用，请换一个。', 'error.usernameReserved': '该用户名已被 MYRQVIA 保留。',
      'error.usernameFormat': '用户名需 5–32 位，字母开头，只能包含字母、数字或下划线。', 'error.network': '网络不可用，请检查连接后重试。',
      'error.emailConfig': '邮件发送尚未配置，请联系 MYRQVIA 维护者。', 'error.emailSend': '验证邮件发送失败，请稍后重试。',
      'error.resetToken': '重置链接已失效，请重新开始。', 'error.generic': '出了点问题，请重试。', 'error.name': '请输入显示名称。', 'error.usernameChoose': '请选择一个可用用户名。',
      'error.password': '密码至少 8 位，并包含字母和数字。', 'error.passwordMatch': '两次输入的密码不一致。',
      'language.label': '语言'
    },
    'zh-Hant': {
      'brand.sub': '更安靜的地方，更好的對話。',
      'progress.email': '電子郵件', 'progress.verify': '驗證', 'progress.profile': '資料', 'progress.done': '完成', 'progress.password': '密碼',
      'label.email': '電子郵件地址', 'label.code': '驗證碼', 'label.name': '顯示名稱', 'label.username': '使用者名稱', 'label.newPassword': '新密碼', 'label.confirmPassword': '確認新密碼',
      'placeholder.email': 'you@example.com', 'placeholder.name': '你的名字', 'placeholder.username': 'yourname', 'placeholder.password': '至少 8 個字元', 'placeholder.confirm': '再次輸入密碼',
      'hint.sending': '正在傳送驗證碼…',
      'send.note': '正在連線電子郵件服務，請稍候…', 'send.sentTitle': '驗證碼已傳送', 'send.sentNote': '正在開啟輸入頁面…',
  'hint.code': '請輸入 6 位驗證碼。郵件可能需要一點時間。', 'hint.codeLocal': '本機預覽驗證碼：{code} · 正式環境 10 分鐘內有效。',
      'hint.username': '5–32 位，字母開頭，僅支援字母、數字與底線。', 'hint.password': '至少 8 位，同時包含字母與數字。此頁面不會儲存密碼。',
      'button.continue': '繼續', 'button.verify': '驗證驗證碼', 'button.create': '建立帳號', 'button.save': '儲存新密碼', 'button.enter': '進入 MYRQVIA Chat', 'button.backSignIn': '返回登入',
      'link.forgot': '忘記密碼？', 'link.create': '建立帳號', 'link.resend': '重新傳送', 'link.change': '修改電子郵件', 'link.help': '協助', 'link.privacy': '隱私', 'link.back': '返回 Chat',
      'code.sent': '驗證碼已傳送至', 'code.verified': '電子郵件已驗證', 'resend.countdown': '{seconds} 秒後重新傳送', 'resend.sending': '傳送中…',
      'code.success': '驗證成功',
      'code.verifiedNext': '正在進入下一步…',
      'mode.local': '本機預覽 · 示範驗證碼 {code}', 'mode.secure': '安全電子郵件驗證',
      'checking': '檢查中…', 'available': '可用', 'unavailable': '不可用', 'couldNotCheck': '無法檢查',
      'title.welcome': '登入 MYRQVIA Chat', 'sub.welcome': '使用電子郵件登入或建立你的帳號。',
      'title.create': '建立 MYRQVIA 帳號', 'sub.create': '從你的電子郵件開始。',
      'title.check': '檢查你的電子郵件', 'sub.check': '我們已將驗證碼傳送到你的電子郵件。',
      'title.profile': '建立你的帳號', 'sub.profile': '選擇你在 MYRQVIA 中的顯示方式。',
      'title.reset': '重設密碼', 'sub.reset': '請輸入綁定 MYRQVIA 帳號的電子郵件地址。',
      'title.password': '設定新密碼', 'sub.password': '電子郵件已驗證。請設定新密碼。',
      'title.success': '歡迎來到 MYRQVIA', 'sub.success': '帳號已就緒。',
      'title.passwordUpdated': '密碼已更新', 'sub.passwordUpdated': '你的 MYRQVIA 帳號可以重新使用了。',
      'success.welcome': '{name}，歡迎回來。你的帳號已準備好繼續對話。', 'success.recovery': '密碼已修改。之後可以繼續使用電子郵件驗證碼登入。',
      'error.email': '請輸入有效的電子郵件地址。', 'error.codeLength': '請輸入完整的 6 位驗證碼。', 'error.invalidCode': '驗證碼不正確，或已被最新驗證碼取代。請輸入最新郵件中的驗證碼。',
      'error.expiredCode': '驗證碼已過期，請重新取得。', 'error.rateLimit': '請求過於頻繁，請稍後再試。', 'error.accountNotFound': '此電子郵件沒有 MYRQVIA 帳號。',
      'error.emailExists': '此電子郵件已有 MYRQVIA 帳號，請直接使用驗證碼登入。', 'error.usernameTaken': '此使用者名稱已被使用，請換一個。', 'error.usernameReserved': '此使用者名稱已被 MYRQVIA 保留。',
      'error.usernameFormat': '使用者名稱需 5–32 位，字母開頭，僅能包含字母、數字或底線。', 'error.network': '網路不可用，請檢查連線後重試。',
      'error.resetToken': '重設連結已失效，請重新開始。', 'error.generic': '發生問題，請重試。', 'error.name': '請輸入顯示名稱。', 'error.usernameChoose': '請選擇一個可用使用者名稱。',
      'error.password': '密碼至少 8 位，並包含字母與數字。', 'error.passwordMatch': '兩次輸入的密碼不一致。',
      'language.label': '語言'
    },
    ja: {
      'brand.sub': '静かな場所で、より良い会話を。',
      'progress.email': 'メール', 'progress.verify': '認証', 'progress.profile': 'プロフィール', 'progress.done': '完了', 'progress.password': 'パスワード',
      'label.email': 'メールアドレス', 'label.code': '認証コード', 'label.name': '表示名', 'label.username': 'ユーザー名', 'label.newPassword': '新しいパスワード', 'label.confirmPassword': 'パスワードの確認',
      'placeholder.email': 'you@example.com', 'placeholder.name': '名前', 'placeholder.username': 'yourname', 'placeholder.password': '8 文字以上', 'placeholder.confirm': 'もう一度入力',
      'hint.sending': '認証コードを送信しています…',
      'send.note': 'メールサービスに接続しています…', 'send.sentTitle': 'コードを送信しました', 'send.sentNote': '入力画面を開いています…',
  'hint.code': '6 桁の認証コードを入力してください。', 'hint.codeLocal': 'ローカルプレビュー用コード：{code} · 本番では 10 分間有効です。',
      'hint.username': '5〜32 文字、英字で始まり、英数字とアンダースコアのみ。', 'hint.password': '8 文字以上で英字と数字を含めてください。このページはパスワードを保存しません。',
      'button.continue': '続ける', 'button.verify': 'コードを認証', 'button.create': 'アカウントを作成', 'button.save': '新しいパスワードを保存', 'button.enter': 'MYRQVIA Chat を開く', 'button.backSignIn': 'サインインに戻る',
      'link.forgot': 'パスワードをお忘れですか？', 'link.create': 'アカウントを作成', 'link.resend': 'コードを再送', 'link.change': 'メールを変更', 'link.help': 'ヘルプ', 'link.privacy': 'プライバシー', 'link.back': 'Chat に戻る',
      'code.sent': 'コードの送信先', 'code.verified': 'メール確認済み', 'resend.countdown': 'あと {seconds} 秒で再送', 'resend.sending': '送信中…',
      'code.success': '認証に成功しました',
      'code.verifiedNext': '次のステップへ進んでいます…',
      'mode.local': 'ローカルプレビュー · デモコード {code}', 'mode.secure': '安全なメール認証',
      'checking': '確認中…', 'available': '利用可能', 'unavailable': '利用不可', 'couldNotCheck': '確認できません',
      'title.welcome': 'MYRQVIA Chat にサインイン', 'sub.welcome': 'メールでサインインまたはアカウントを作成します。',
      'title.create': 'MYRQVIA アカウントを作成', 'sub.create': 'メールアドレスから始めます。',
      'title.check': 'メールを確認', 'sub.check': '認証コードをメールアドレスに送信しました。',
      'title.profile': 'アカウントを作成', 'sub.profile': 'MYRQVIA での表示方法を選択してください。',
      'title.reset': 'パスワードを再設定', 'sub.reset': 'MYRQVIA アカウントのメールアドレスを入力してください。',
      'title.password': '新しいパスワードを設定', 'sub.password': 'メールは確認済みです。新しいパスワードを設定してください。',
      'title.success': 'MYRQVIA へようこそ', 'sub.success': 'アカウントの準備ができました。',
      'title.passwordUpdated': 'パスワードを更新しました', 'sub.passwordUpdated': 'MYRQVIA アカウントを再び利用できます。',
      'success.welcome': '{name} さん、ようこそ。会話を続ける準備ができました。', 'success.recovery': 'パスワードを変更しました。今後もメール認証コードでサインインできます。',
      'error.email': '有効なメールアドレスを入力してください。', 'error.codeLength': '6 桁すべて入力してください。', 'error.invalidCode': 'コードが正しくないか、新しいコードに置き換えられています。最新のメールのコードを入力してください。',
      'error.expiredCode': 'コードの有効期限が切れました。再送してください。', 'error.rateLimit': 'リクエストが多すぎます。しばらく待ってください。', 'error.accountNotFound': 'このメールアドレスの MYRQVIA アカウントはありません。',
      'error.emailExists': 'このメールには既に MYRQVIA アカウントがあります。', 'error.usernameTaken': 'このユーザー名は既に使われています。', 'error.usernameReserved': 'このユーザー名は MYRQVIA が予約しています。',
      'error.usernameFormat': 'ユーザー名は 5〜32 文字、英字で始まり、英数字とアンダースコアのみです。', 'error.network': 'ネットワークに接続できません。接続を確認してください。',
      'error.resetToken': '再設定リンクの有効期限が切れました。', 'error.generic': '問題が発生しました。もう一度お試しください。', 'error.name': '表示名を入力してください。', 'error.usernameChoose': '利用可能なユーザー名を選んでください。',
      'error.password': '8 文字以上で英字と数字を含めてください。', 'error.passwordMatch': 'パスワードが一致しません。',
      'language.label': '言語'
    },
    ko: {
      'brand.sub': '더 조용한 곳, 더 나은 대화.',
      'progress.email': '이메일', 'progress.verify': '인증', 'progress.profile': '프로필', 'progress.done': '완료', 'progress.password': '비밀번호',
      'label.email': '이메일 주소', 'label.code': '인증 코드', 'label.name': '표시 이름', 'label.username': '사용자 이름', 'label.newPassword': '새 비밀번호', 'label.confirmPassword': '비밀번호 확인',
      'placeholder.email': 'you@example.com', 'placeholder.name': '이름', 'placeholder.username': 'yourname', 'placeholder.password': '8자 이상', 'placeholder.confirm': '비밀번호 다시 입력',
      'hint.sending': '인증 코드를 보내는 중…',
      'send.note': '메일 서비스에 연결하는 중…', 'send.sentTitle': '코드가 전송되었습니다', 'send.sentNote': '입력 화면을 여는 중…',
  'hint.code': '6자리 인증 코드를 입력하세요.', 'hint.codeLocal': '로컬 미리보기 코드: {code} · 실제 환경에서는 10분간 유효합니다.',
      'hint.username': '5–32자, 영문자로 시작, 영문자·숫자·밑줄만 사용.', 'hint.password': '8자 이상, 영문자와 숫자를 포함하세요. 이 페이지는 비밀번호를 저장하지 않습니다.',
      'button.continue': '계속', 'button.verify': '코드 인증', 'button.create': '계정 만들기', 'button.save': '새 비밀번호 저장', 'button.enter': 'MYRQVIA Chat 시작', 'button.backSignIn': '로그인으로 돌아가기',
      'link.forgot': '비밀번호를 잊으셨나요?', 'link.create': '계정 만들기', 'link.resend': '코드 다시 보내기', 'link.change': '이메일 변경', 'link.help': '도움말', 'link.privacy': '개인정보', 'link.back': 'Chat으로 돌아가기',
      'code.sent': '코드 전송 대상', 'code.verified': '이메일 인증됨', 'resend.countdown': '{seconds}초 후 다시 보내기', 'resend.sending': '보내는 중…',
      'code.success': '인증되었습니다',
      'code.verifiedNext': '다음 단계로 이동 중…',
      'mode.local': '로컬 미리보기 · 데모 코드 {code}', 'mode.secure': '안전한 이메일 인증',
      'checking': '확인 중…', 'available': '사용 가능', 'unavailable': '사용 불가', 'couldNotCheck': '확인할 수 없음',
      'title.welcome': 'MYRQVIA Chat에 로그인', 'sub.welcome': '이메일로 로그인하거나 계정을 만드세요.',
      'title.create': 'MYRQVIA 계정 만들기', 'sub.create': '이메일 주소로 시작하세요.',
      'title.check': '이메일을 확인하세요', 'sub.check': '이메일 주소로 인증 코드를 보냈습니다.',
      'title.profile': '계정 만들기', 'sub.profile': 'MYRQVIA에서 표시될 정보를 선택하세요.',
      'title.reset': '비밀번호 재설정', 'sub.reset': 'MYRQVIA 계정의 이메일 주소를 입력하세요.',
      'title.password': '새 비밀번호 설정', 'sub.password': '이메일이 인증되었습니다. 새 비밀번호를 설정하세요.',
      'title.success': 'MYRQVIA에 오신 것을 환영합니다', 'sub.success': '계정이 준비되었습니다.',
      'title.passwordUpdated': '비밀번호가 업데이트되었습니다', 'sub.passwordUpdated': 'MYRQVIA 계정을 다시 사용할 수 있습니다.',
      'success.welcome': '{name}님, 환영합니다. 대화를 이어갈 준비가 되었습니다.', 'success.recovery': '비밀번호가 변경되었습니다. 계속 이메일 인증 코드로 로그인할 수 있습니다.',
      'error.email': '올바른 이메일 주소를 입력하세요.', 'error.codeLength': '6자리 코드를 모두 입력하세요.', 'error.invalidCode': '코드가 올바르지 않거나 새 코드로 교체되었습니다. 최신 이메일의 코드를 입력하세요.',
      'error.expiredCode': '코드가 만료되었습니다. 새 코드를 요청하세요.', 'error.rateLimit': '요청이 너무 많습니다. 잠시 후 다시 시도하세요.', 'error.accountNotFound': '이 이메일을 사용하는 MYRQVIA 계정이 없습니다.',
      'error.emailExists': '이 이메일에는 이미 MYRQVIA 계정이 있습니다.', 'error.usernameTaken': '이미 사용 중인 사용자 이름입니다.', 'error.usernameReserved': 'MYRQVIA에서 예약한 사용자 이름입니다.',
      'error.usernameFormat': '사용자 이름은 5–32자, 영문자로 시작, 영문자·숫자·밑줄만 가능합니다.', 'error.network': '네트워크를 사용할 수 없습니다. 연결을 확인하세요.',
      'error.resetToken': '재설정 링크가 만료되었습니다.', 'error.generic': '문제가 발생했습니다. 다시 시도하세요.', 'error.name': '표시 이름을 입력하세요.', 'error.usernameChoose': '사용 가능한 사용자 이름을 선택하세요.',
      'error.password': '8자 이상, 영문자와 숫자를 포함하세요.', 'error.passwordMatch': '비밀번호가 일치하지 않습니다.',
      'language.label': '언어'
    },
    es: {
      'brand.sub': 'Un lugar más tranquilo. Una mejor conversación.',
      'progress.email': 'Correo', 'progress.verify': 'Verificar', 'progress.profile': 'Perfil', 'progress.done': 'Listo', 'progress.password': 'Contraseña',
      'label.email': 'Correo electrónico', 'label.code': 'Código de verificación', 'label.name': 'Nombre visible', 'label.username': 'Usuario', 'label.newPassword': 'Nueva contraseña', 'label.confirmPassword': 'Confirmar contraseña',
      'placeholder.email': 'you@example.com', 'placeholder.name': 'Tu nombre', 'placeholder.username': 'tunombre', 'placeholder.password': 'Mínimo 8 caracteres', 'placeholder.confirm': 'Repite la contraseña',
      'hint.sending': 'Enviando tu código de verificación…',
      'send.note': 'Conectando con el servicio de correo…', 'send.sentTitle': 'Código enviado', 'send.sentNote': 'Abriendo la entrada del código…',
  'hint.code': 'Introduce el código de 6 dígitos. Puede tardar un momento.', 'hint.codeLocal': 'Código de vista previa local: {code} · válido 10 minutos en producción.',
      'hint.username': '5–32 caracteres, empieza con una letra y solo usa letras, números y guiones bajos.', 'hint.password': 'Usa al menos 8 caracteres con letras y números. Esta página nunca guarda tu contraseña.',
      'button.continue': 'Continuar', 'button.verify': 'Verificar código', 'button.create': 'Crear cuenta', 'button.save': 'Guardar contraseña', 'button.enter': 'Entrar en MYRQVIA Chat', 'button.backSignIn': 'Volver a iniciar sesión',
      'link.forgot': '¿Olvidaste tu contraseña?', 'link.create': 'Crear una cuenta', 'link.resend': 'Reenviar código', 'link.change': 'Cambiar correo', 'link.help': 'Ayuda', 'link.privacy': 'Privacidad', 'link.back': 'Volver al Chat',
      'code.sent': 'Código enviado a', 'code.verified': 'Correo verificado', 'resend.countdown': 'Reenviar en {seconds} s', 'resend.sending': 'Enviando…',
      'code.success': 'Verificación correcta',
      'code.verifiedNext': 'Pasando al siguiente paso…',
      'mode.local': 'Vista previa local · código de demostración {code}', 'mode.secure': 'Verificación segura por correo',
      'checking': 'Comprobando…', 'available': 'Disponible', 'unavailable': 'No disponible', 'couldNotCheck': 'No se pudo comprobar',
      'title.welcome': 'Iniciar sesión en MYRQVIA Chat', 'sub.welcome': 'Inicia sesión o crea tu cuenta con tu correo electrónico.',
      'title.create': 'Crea tu cuenta de MYRQVIA', 'sub.create': 'Empieza con tu correo electrónico.',
      'title.check': 'Revisa tu correo', 'sub.check': 'Hemos enviado un código de verificación a tu correo.',
      'title.profile': 'Crea tu cuenta', 'sub.profile': 'Elige cómo aparecer en MYRQVIA.',
      'title.reset': 'Restablece tu contraseña', 'sub.reset': 'Introduce el correo vinculado a tu cuenta de MYRQVIA.',
      'title.password': 'Crea una nueva contraseña', 'sub.password': 'Tu correo está verificado. Elige una nueva contraseña.',
      'title.success': 'Bienvenido a MYRQVIA', 'sub.success': 'Tu cuenta está lista.',
      'title.passwordUpdated': 'Contraseña actualizada', 'sub.passwordUpdated': 'Tu cuenta de MYRQVIA ya está disponible.',
      'success.welcome': 'Bienvenido, {name}. Tu cuenta está lista para continuar la conversación.', 'success.recovery': 'Tu contraseña ha cambiado. Puedes seguir iniciando sesión con el código por correo.',
      'error.email': 'Introduce un correo electrónico válido.', 'error.codeLength': 'Introduce los 6 dígitos.', 'error.invalidCode': 'El código no es correcto o fue reemplazado por uno más reciente. Usa el código del último correo.',
      'error.expiredCode': 'El código ha caducado. Solicita uno nuevo.', 'error.rateLimit': 'Demasiadas solicitudes. Espera antes de pedir otro código.', 'error.accountNotFound': 'Este correo no tiene una cuenta de MYRQVIA.',
      'error.emailExists': 'Este correo ya tiene una cuenta de MYRQVIA.', 'error.usernameTaken': 'Ese usuario ya está en uso.', 'error.usernameReserved': 'Ese usuario está reservado por MYRQVIA.',
      'error.usernameFormat': 'El usuario debe tener 5–32 caracteres, empezar por letra y usar solo letras, números o guiones bajos.', 'error.network': 'Red no disponible. Comprueba tu conexión.',
      'error.resetToken': 'Este enlace de restablecimiento ha caducado.', 'error.generic': 'Algo salió mal. Inténtalo de nuevo.', 'error.name': 'Introduce un nombre visible.', 'error.usernameChoose': 'Elige un usuario disponible.',
      'error.password': 'Usa al menos 8 caracteres con letras y números.', 'error.passwordMatch': 'Las contraseñas no coinciden.',
      'language.label': 'Idioma'
    },
    fr: {
      'brand.sub': 'Un endroit plus calme. Une meilleure conversation.',
      'progress.email': 'E-mail', 'progress.verify': 'Vérifier', 'progress.profile': 'Profil', 'progress.done': 'Terminé', 'progress.password': 'Mot de passe',
      'label.email': 'Adresse e-mail', 'label.code': 'Code de vérification', 'label.name': 'Nom affiché', 'label.username': 'Nom d’utilisateur', 'label.newPassword': 'Nouveau mot de passe', 'label.confirmPassword': 'Confirmer le mot de passe',
      'placeholder.email': 'you@example.com', 'placeholder.name': 'Votre nom', 'placeholder.username': 'votrenom', 'placeholder.password': '8 caractères minimum', 'placeholder.confirm': 'Répétez le mot de passe',
      'hint.sending': 'Envoi de votre code de vérification…',
      'send.note': 'Connexion au service de messagerie…', 'send.sentTitle': 'Code envoyé', 'send.sentNote': 'Ouverture de la saisie du code…',
  'hint.code': 'Saisissez le code à 6 chiffres. Cela peut prendre un instant.', 'hint.codeLocal': 'Code d’aperçu local : {code} · valable 10 minutes en production.',
      'hint.username': '5–32 caractères, commence par une lettre, lettres, chiffres et tirets bas uniquement.', 'hint.password': 'Utilisez au moins 8 caractères avec lettres et chiffres. Cette page ne stocke jamais votre mot de passe.',
      'button.continue': 'Continuer', 'button.verify': 'Vérifier le code', 'button.create': 'Créer un compte', 'button.save': 'Enregistrer le mot de passe', 'button.enter': 'Entrer dans MYRQVIA Chat', 'button.backSignIn': 'Retour à la connexion',
      'link.forgot': 'Mot de passe oublié ?', 'link.create': 'Créer un compte', 'link.resend': 'Renvoyer le code', 'link.change': 'Changer d’e-mail', 'link.help': 'Aide', 'link.privacy': 'Confidentialité', 'link.back': 'Retour au Chat',
      'code.sent': 'Code envoyé à', 'code.verified': 'E-mail vérifié', 'resend.countdown': 'Renvoyer dans {seconds} s', 'resend.sending': 'Envoi…',
      'code.success': 'Vérification réussie',
      'code.verifiedNext': 'Passage à l’étape suivante…',
      'mode.local': 'Aperçu local · code de démonstration {code}', 'mode.secure': 'Vérification sécurisée par e-mail',
      'checking': 'Vérification…', 'available': 'Disponible', 'unavailable': 'Indisponible', 'couldNotCheck': 'Vérification impossible',
      'title.welcome': 'Se connecter à MYRQVIA Chat', 'sub.welcome': 'Connectez-vous ou créez votre compte avec votre e-mail.',
      'title.create': 'Créez votre compte MYRQVIA', 'sub.create': 'Commencez avec votre adresse e-mail.',
      'title.check': 'Vérifiez votre e-mail', 'sub.check': 'Nous avons envoyé un code de vérification à votre adresse e-mail.',
      'title.profile': 'Créez votre compte', 'sub.profile': 'Choisissez votre apparence sur MYRQVIA.',
      'title.reset': 'Réinitialisez votre mot de passe', 'sub.reset': 'Saisissez l’adresse e-mail liée à votre compte MYRQVIA.',
      'title.password': 'Définissez un nouveau mot de passe', 'sub.password': 'Votre e-mail est vérifié. Choisissez un nouveau mot de passe.',
      'title.success': 'Bienvenue sur MYRQVIA', 'sub.success': 'Votre compte est prêt.',
      'title.passwordUpdated': 'Mot de passe mis à jour', 'sub.passwordUpdated': 'Votre compte MYRQVIA est de nouveau accessible.',
      'success.welcome': 'Bienvenue, {name}. Votre compte est prêt à poursuivre la conversation.', 'success.recovery': 'Votre mot de passe a été modifié. Vous pouvez continuer à vous connecter avec le code par e-mail.',
      'error.email': 'Saisissez une adresse e-mail valide.', 'error.codeLength': 'Saisissez les 6 chiffres.', 'error.invalidCode': 'Le code est incorrect ou a été remplacé par un plus récent. Utilisez le dernier e-mail.',
      'error.expiredCode': 'Le code a expiré. Demandez-en un nouveau.', 'error.rateLimit': 'Trop de demandes. Attendez avant de demander un autre code.', 'error.accountNotFound': 'Aucun compte MYRQVIA n’utilise cet e-mail.',
      'error.emailExists': 'Cet e-mail possède déjà un compte MYRQVIA.', 'error.usernameTaken': 'Ce nom d’utilisateur est déjà pris.', 'error.usernameReserved': 'Ce nom d’utilisateur est réservé par MYRQVIA.',
      'error.usernameFormat': 'Le nom doit comporter 5–32 caractères, commencer par une lettre et contenir uniquement lettres, chiffres ou tirets bas.', 'error.network': 'Réseau indisponible. Vérifiez votre connexion.',
      'error.resetToken': 'Ce lien de réinitialisation a expiré.', 'error.generic': 'Un problème est survenu. Réessayez.', 'error.name': 'Saisissez un nom affiché.', 'error.usernameChoose': 'Choisissez un nom d’utilisateur disponible.',
      'error.password': 'Utilisez au moins 8 caractères avec lettres et chiffres.', 'error.passwordMatch': 'Les mots de passe ne correspondent pas.',
      'language.label': 'Langue'
    },
    de: {
      'brand.sub': 'Ein ruhigerer Ort. Ein besseres Gespräch.',
      'progress.email': 'E-Mail', 'progress.verify': 'Bestätigen', 'progress.profile': 'Profil', 'progress.done': 'Fertig', 'progress.password': 'Passwort',
      'label.email': 'E-Mail-Adresse', 'label.code': 'Bestätigungscode', 'label.name': 'Anzeigename', 'label.username': 'Benutzername', 'label.newPassword': 'Neues Passwort', 'label.confirmPassword': 'Passwort bestätigen',
      'placeholder.email': 'you@example.com', 'placeholder.name': 'Dein Name', 'placeholder.username': 'deinname', 'placeholder.password': 'Mindestens 8 Zeichen', 'placeholder.confirm': 'Passwort wiederholen',
      'hint.sending': 'Bestätigungscode wird gesendet…',
      'send.note': 'Verbindung zum Maildienst…', 'send.sentTitle': 'Code gesendet', 'send.sentNote': 'Codeeingabe wird geöffnet…',
  'hint.code': 'Gib den 6-stelligen Code ein. Es kann einen Moment dauern.', 'hint.codeLocal': 'Lokaler Vorschau-Code: {code} · in Produktion 10 Minuten gültig.',
      'hint.username': '5–32 Zeichen, beginnt mit einem Buchstaben, nur Buchstaben, Zahlen und Unterstriche.', 'hint.password': 'Mindestens 8 Zeichen mit Buchstaben und Zahlen. Diese Seite speichert dein Passwort nie.',
      'button.continue': 'Weiter', 'button.verify': 'Code bestätigen', 'button.create': 'Konto erstellen', 'button.save': 'Passwort speichern', 'button.enter': 'MYRQVIA Chat öffnen', 'button.backSignIn': 'Zurück zur Anmeldung',
      'link.forgot': 'Passwort vergessen?', 'link.create': 'Konto erstellen', 'link.resend': 'Code erneut senden', 'link.change': 'E-Mail ändern', 'link.help': 'Hilfe', 'link.privacy': 'Datenschutz', 'link.back': 'Zurück zum Chat',
      'code.sent': 'Code gesendet an', 'code.verified': 'E-Mail bestätigt', 'resend.countdown': 'Erneut senden in {seconds} s', 'resend.sending': 'Wird gesendet…',
      'code.success': 'Verifizierung erfolgreich',
      'code.verifiedNext': 'Weiter zum nächsten Schritt…',
      'mode.local': 'Lokale Vorschau · Demo-Code {code}', 'mode.secure': 'Sichere E-Mail-Bestätigung',
      'checking': 'Wird geprüft…', 'available': 'Verfügbar', 'unavailable': 'Nicht verfügbar', 'couldNotCheck': 'Prüfung nicht möglich',
      'title.welcome': 'Bei MYRQVIA Chat anmelden', 'sub.welcome': 'Melde dich an oder erstelle dein Konto per E-Mail.',
      'title.create': 'Erstelle dein MYRQVIA-Konto', 'sub.create': 'Beginne mit deiner E-Mail-Adresse.',
      'title.check': 'Prüfe deine E-Mail', 'sub.check': 'Wir haben einen Bestätigungscode an deine E-Mail-Adresse gesendet.',
      'title.profile': 'Erstelle dein Konto', 'sub.profile': 'Wähle, wie du bei MYRQVIA erscheinen möchtest.',
      'title.reset': 'Passwort zurücksetzen', 'sub.reset': 'Gib die E-Mail-Adresse deines MYRQVIA-Kontos ein.',
      'title.password': 'Neues Passwort festlegen', 'sub.password': 'Deine E-Mail ist bestätigt. Wähle ein neues Passwort.',
      'title.success': 'Willkommen bei MYRQVIA', 'sub.success': 'Dein Konto ist bereit.',
      'title.passwordUpdated': 'Passwort aktualisiert', 'sub.passwordUpdated': 'Dein MYRQVIA-Konto ist wieder einsatzbereit.',
      'success.welcome': 'Willkommen, {name}. Dein Konto ist bereit, das Gespräch fortzusetzen.', 'success.recovery': 'Dein Passwort wurde geändert. Du kannst dich weiterhin mit dem E-Mail-Code anmelden.',
      'error.email': 'Gib eine gültige E-Mail-Adresse ein.', 'error.codeLength': 'Gib alle 6 Ziffern ein.', 'error.invalidCode': 'Der Code ist falsch oder wurde durch einen neueren ersetzt. Nutze die neueste E-Mail.',
      'error.expiredCode': 'Der Code ist abgelaufen. Fordere einen neuen an.', 'error.rateLimit': 'Zu viele Anfragen. Warte, bevor du einen neuen Code anforderst.', 'error.accountNotFound': 'Für diese E-Mail gibt es kein MYRQVIA-Konto.',
      'error.emailExists': 'Diese E-Mail hat bereits ein MYRQVIA-Konto.', 'error.usernameTaken': 'Dieser Benutzername ist bereits vergeben.', 'error.usernameReserved': 'Dieser Benutzername ist von MYRQVIA reserviert.',
      'error.usernameFormat': 'Benutzernamen haben 5–32 Zeichen, beginnen mit einem Buchstaben und nutzen nur Buchstaben, Zahlen oder Unterstriche.', 'error.network': 'Netzwerk nicht verfügbar. Prüfe deine Verbindung.',
      'error.resetToken': 'Dieser Zurücksetzen-Link ist abgelaufen.', 'error.generic': 'Etwas ist schiefgelaufen. Versuche es erneut.', 'error.name': 'Gib einen Anzeigenamen ein.', 'error.usernameChoose': 'Wähle einen verfügbaren Benutzernamen.',
      'error.password': 'Mindestens 8 Zeichen mit Buchstaben und Zahlen.', 'error.passwordMatch': 'Die Passwörter stimmen nicht überein.',
      'language.label': 'Sprache'
    },
    pt: {
      'brand.sub': 'Um lugar mais calmo. Uma conversa melhor.',
      'progress.email': 'E-mail', 'progress.verify': 'Verificar', 'progress.profile': 'Perfil', 'progress.done': 'Concluído', 'progress.password': 'Senha',
      'label.email': 'Endereço de e-mail', 'label.code': 'Código de verificação', 'label.name': 'Nome de exibição', 'label.username': 'Nome de usuário', 'label.newPassword': 'Nova senha', 'label.confirmPassword': 'Confirmar senha',
      'placeholder.email': 'you@example.com', 'placeholder.name': 'Seu nome', 'placeholder.username': 'seunome', 'placeholder.password': 'Pelo menos 8 caracteres', 'placeholder.confirm': 'Repita a senha',
      'hint.sending': 'Enviando seu código de verificação…',
      'send.note': 'Conectando ao serviço de e-mail…', 'send.sentTitle': 'Código enviado', 'send.sentNote': 'Abrindo a entrada do código…',
  'hint.code': 'Digite o código de 6 dígitos. Pode levar um momento.', 'hint.codeLocal': 'Código de prévia local: {code} · válido por 10 minutos em produção.',
      'hint.username': '5–32 caracteres, começa com letra e usa apenas letras, números e sublinhados.', 'hint.password': 'Use pelo menos 8 caracteres com letras e números. Esta página nunca armazena sua senha.',
      'button.continue': 'Continuar', 'button.verify': 'Verificar código', 'button.create': 'Criar conta', 'button.save': 'Salvar nova senha', 'button.enter': 'Entrar no MYRQVIA Chat', 'button.backSignIn': 'Voltar ao login',
      'link.forgot': 'Esqueceu a senha?', 'link.create': 'Criar uma conta', 'link.resend': 'Reenviar código', 'link.change': 'Alterar e-mail', 'link.help': 'Ajuda', 'link.privacy': 'Privacidade', 'link.back': 'Voltar ao Chat',
      'code.sent': 'Código enviado para', 'code.verified': 'E-mail verificado', 'resend.countdown': 'Reenviar em {seconds} s', 'resend.sending': 'Enviando…',
      'code.success': 'Verificação concluída',
      'code.verifiedNext': 'Avançando para a próxima etapa…',
      'mode.local': 'Prévia local · código de demonstração {code}', 'mode.secure': 'Verificação segura por e-mail',
      'checking': 'Verificando…', 'available': 'Disponível', 'unavailable': 'Indisponível', 'couldNotCheck': 'Não foi possível verificar',
      'title.welcome': 'Entrar na MYRQVIA Chat', 'sub.welcome': 'Entre ou crie sua conta com seu e-mail.',
      'title.create': 'Crie sua conta MYRQVIA', 'sub.create': 'Comece com seu endereço de e-mail.',
      'title.check': 'Verifique seu e-mail', 'sub.check': 'Enviamos um código de verificação para o seu e-mail.',
      'title.profile': 'Crie sua conta', 'sub.profile': 'Escolha como você aparece na MYRQVIA.',
      'title.reset': 'Redefina sua senha', 'sub.reset': 'Digite o e-mail vinculado à sua conta MYRQVIA.',
      'title.password': 'Defina uma nova senha', 'sub.password': 'Seu e-mail foi verificado. Escolha uma nova senha.',
      'title.success': 'Bem-vindo à MYRQVIA', 'sub.success': 'Sua conta está pronta.',
      'title.passwordUpdated': 'Senha atualizada', 'sub.passwordUpdated': 'Sua conta MYRQVIA está pronta para uso novamente.',
      'success.welcome': 'Bem-vindo, {name}. Sua conta está pronta para continuar a conversa.', 'success.recovery': 'Sua senha foi alterada. Você pode continuar entrando com o código por e-mail.',
      'error.email': 'Digite um e-mail válido.', 'error.codeLength': 'Digite os 6 dígitos.', 'error.invalidCode': 'O código está incorreto ou foi substituído por um mais recente. Use o código do e-mail mais recente.',
      'error.expiredCode': 'O código expirou. Solicite um novo.', 'error.rateLimit': 'Muitas solicitações. Aguarde antes de pedir outro código.', 'error.accountNotFound': 'Nenhuma conta MYRQVIA usa este e-mail.',
      'error.emailExists': 'Este e-mail já tem uma conta MYRQVIA.', 'error.usernameTaken': 'Esse nome de usuário já está em uso.', 'error.usernameReserved': 'Esse nome de usuário é reservado pela MYRQVIA.',
      'error.usernameFormat': 'O nome deve ter 5–32 caracteres, começar com letra e usar apenas letras, números ou sublinhados.', 'error.network': 'Rede indisponível. Verifique sua conexão.',
      'error.resetToken': 'Este link de redefinição expirou.', 'error.generic': 'Algo deu errado. Tente novamente.', 'error.name': 'Digite um nome de exibição.', 'error.usernameChoose': 'Escolha um nome de usuário disponível.',
      'error.password': 'Use pelo menos 8 caracteres com letras e números.', 'error.passwordMatch': 'As senhas não coincidem.',
      'language.label': 'Idioma'
    }
  };

  var legalExtra = {
    'zh-Hans': {
      'legal.help.title': '帮助',
      'legal.help.intro': 'MYRQVIA 使用一次性邮箱验证码登录，不需要手机号。',
      'legal.help.point1': '验证码通常一分钟内到达。请检查垃圾邮件，并在重新发送前等待 60 秒。',
      'legal.help.point2': '新邮箱会进入资料创建；已有邮箱会直接进入 Messenger。',
      'legal.help.point3': '忘记密码？在首屏点击「忘记密码」通过邮箱重置。',
      'legal.help.point4': '需要人工帮助？请发邮件并附上你尝试使用的邮箱地址。',
      'legal.privacy.title': '隐私',
      'legal.privacy.intro': '当前版本是本地前端原型，下面说明实际会保存什么。',
      'legal.privacy.point1': '邮箱、显示名称、用户名和会话保存在当前浏览器的 localStorage 中。',
      'legal.privacy.point2': '本页面不会保存密码。正式远端模式应由后端使用安全 Cookie。',
      'legal.privacy.point3': '只有在你选择拍照后才会请求摄像头权限；关闭拍照页会停止视频流。',
      'legal.privacy.point4': '没有接入分析工具或第三方字体请求。你可以在下方清除本地预览数据。',
      'legal.contact': '邮件联系支持',
      'legal.clear': '清除本地预览数据',
      'legal.clearConfirm': '要从当前浏览器清除本地演示账号和会话吗？此操作无法撤销。',
      'legal.close': '关闭'
    },
    'zh-Hant': {
      'legal.help.title': '協助',
      'legal.help.intro': 'MYRQVIA 使用一次性電子郵件驗證碼登入，不需要手機號碼。',
      'legal.help.point1': '驗證碼通常一分鐘內到達。請檢查垃圾郵件，並在重新傳送前等待 60 秒。',
      'legal.help.point2': '新電子郵件會進入資料建立；已有電子郵件會直接進入 Messenger。',
      'legal.help.point3': '忘記密碼？在首頁點選「忘記密碼」透過電子郵件重設。',
      'legal.help.point4': '需要人工協助？請寄信並附上你嘗試使用的電子郵件地址。',
      'legal.privacy.title': '隱私',
      'legal.privacy.intro': '目前版本是本機前端原型，以下說明實際會保存什麼。',
      'legal.privacy.point1': '電子郵件、顯示名稱、使用者名稱和會話保存在目前瀏覽器的 localStorage 中。',
      'legal.privacy.point2': '此頁面不會保存密碼。正式遠端模式應由後端使用安全 Cookie。',
      'legal.privacy.point3': '只有在你選擇拍照後才會要求相機權限；關閉拍照頁會停止視訊串流。',
      'legal.privacy.point4': '沒有接入分析工具或第三方字型請求。你可以在下方清除本機預覽資料。',
      'legal.contact': '寄信聯絡支援',
      'legal.clear': '清除本機預覽資料',
      'legal.clearConfirm': '要從目前瀏覽器清除本機示範帳號和會話嗎？此操作無法復原。',
      'legal.close': '關閉'
    }
  };
  Object.keys(legalExtra).forEach(function (id) { Object.assign(dictionaries[id], legalExtra[id]); });

  var stored = '';
  try { stored = localStorage.getItem('myrqvia.locale') || ''; } catch (error) { /* noop */ }
  var initial = stored && LOCALES.some(function (item) { return item.id === stored; }) ? stored : detect();
  var current = initial;

  function detect() {
    var lang = String(navigator.language || 'en').toLowerCase();
    if (lang.indexOf('zh-tw') === 0 || lang.indexOf('zh-hk') === 0 || lang.indexOf('zh-mo') === 0) return 'zh-Hant';
    if (lang.indexOf('zh') === 0) return 'zh-Hans';
    if (lang.indexOf('ja') === 0) return 'ja';
    if (lang.indexOf('ko') === 0) return 'ko';
    if (lang.indexOf('es') === 0) return 'es';
    if (lang.indexOf('fr') === 0) return 'fr';
    if (lang.indexOf('de') === 0) return 'de';
    if (lang.indexOf('pt') === 0) return 'pt';
    return 'en';
  }

  function t(key, vars) {
    var table = dictionaries[current] || {};
    var value = table[key] || en[key] || key;
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        value = value.replace(new RegExp('\\{' + name + '\\}', 'g'), String(vars[name]));
      });
    }
    return value;
  }

  function apply() {
    var locale = LOCALES.filter(function (item) { return item.id === current; })[0] || LOCALES[0];
    document.documentElement.lang = locale.html;
    document.querySelectorAll('[data-i18n]').forEach(function (node) {
      node.textContent = t(node.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (node) {
      node.setAttribute('placeholder', t(node.getAttribute('data-i18n-placeholder')));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (node) {
      node.setAttribute('aria-label', t(node.getAttribute('data-i18n-aria')));
    });
    var select = document.getElementById('locale-select');
    if (select) select.value = current;
    return locale;
  }

  function setLocale(id) {
    if (!LOCALES.some(function (item) { return item.id === id; })) return;
    current = id;
    try { localStorage.setItem('myrqvia.locale', id); } catch (error) { /* noop */ }
    apply();
    document.dispatchEvent(new CustomEvent('myrqvia:locale-changed', { detail: { locale: id } }));
  }

  window.MYRQVIA_I18N = {
    locales: LOCALES,
    get locale() { return current; },
    t: t,
    apply: apply,
    setLocale: setLocale
  };

  apply();
})();

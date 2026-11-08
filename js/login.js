/* MYRQVIA Chat — login / registration controller.
   Uses js/auth-service.js. Remote mode follows docs/backend-handoff.md;
   local mode is an explicit preview adapter for this static prototype. */
(function () {
  'use strict';

  var auth = window.MYRQVIA_AUTH;
  var i18n = window.MYRQVIA_I18N;
  var DEMO_CODE = auth && auth.demoCode ? auth.demoCode : '246810';

  function t(key, vars) {
    return i18n ? i18n.t(key, vars) : key;
  }
  var RESERVED = ['admin', 'root', 'myrqvia', 'support', 'telegram', 'system', 'help'];

  var state = {
    mode: 'auth',
    purpose: 'login',
    step: 'email',
    email: '',
    code: '',
    resetToken: '',
    usernameOk: false,
    usernameChecked: '',
    usernameTimer: null,
    usernameState: '',
    legalKind: '',
    transitioning: false,
    codeSending: false,
    verifying: false,
    autoTimer: null,
    resendTimer: null,
    retryAfter: 60,
    submitting: false,
    registrationSuccess: false,
    registrationTimer: null,
    registrationCollapseTimer: null,
    registrationNav: false
  };

  var steps = {
    email: document.getElementById('step-email'),
    code: document.getElementById('step-code'),
    profile: document.getElementById('step-profile'),
    password: document.getElementById('step-password'),
    success: document.getElementById('step-success')
  };

  var els = {
    title: document.getElementById('auth-title'),
    sub: document.getElementById('auth-sub'),
    back: document.getElementById('auth-back'),
    progress: document.getElementById('auth-progress'),
    mode: document.getElementById('auth-mode'),
    email: document.getElementById('auth-email'),
    emailError: document.getElementById('email-error'),
    emailValid: document.getElementById('email-valid'),
    emailSubmit: document.getElementById('email-submit'),
    sendTransition: document.getElementById('send-transition'),
    sendTitle: document.getElementById('send-title'),
    sendEmail: document.getElementById('send-email'),
    sendNote: document.getElementById('send-note'),
    forgot: document.getElementById('forgot-link'),
    create: document.getElementById('create-account'),
    codeEmail: document.getElementById('code-email'),
    codeBoxes: Array.prototype.slice.call(document.querySelectorAll('.code-box')),
    codeInput: document.getElementById('auth-code'),
    codeError: document.getElementById('code-error'),
    codeHint: document.getElementById('code-hint'),
    codeSubmit: document.getElementById('code-submit'),
    codeShell: document.getElementById('code-shell'),
    codeSuccess: document.getElementById('code-success'),
    codeSuccessText: document.getElementById('code-success-text'),
    successCapsule: document.getElementById('success-capsule'),
    resend: document.getElementById('resend-code'),
    changeEmail: document.getElementById('change-email'),
    name: document.getElementById('auth-name'),
    username: document.getElementById('auth-username'),
    usernameStatus: document.getElementById('username-status'),
    profileError: document.getElementById('profile-error'),
    profileSubmit: document.getElementById('profile-submit'),
    passwordEmail: document.getElementById('password-email'),
    password: document.getElementById('auth-password'),
    password2: document.getElementById('auth-password2'),
    passwordError: document.getElementById('password-error'),
    passwordSubmit: document.getElementById('password-submit'),
    successName: document.getElementById('success-name'),
    successCopy: document.getElementById('success-copy'),
    doneAction: document.getElementById('done-action'),
    legalLayer: document.getElementById('legal-layer'),
    legalTitle: document.getElementById('legal-title'),
    legalBody: document.getElementById('legal-body'),
    legalContact: document.getElementById('legal-contact'),
    legalClear: document.getElementById('legal-clear'),
    legalClose: document.getElementById('legal-close')
  };

  var card = document.querySelector('.auth-card');

  function emailValid(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  function setError(element, text) {
    if (element) element.textContent = text || '';
  }

  function shakeCard() {
    if (!card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    card.classList.remove('is-error');
    void card.offsetWidth;
    card.classList.add('is-error');
    setTimeout(function () { card.classList.remove('is-error'); }, 420);
  }

  function setLoading(button, loading) {
    state.submitting = loading;
    if (!button) return;
    button.classList.toggle('is-loading', loading);
    button.disabled = loading;
    button.setAttribute('aria-busy', loading ? 'true' : 'false');
  }

  function updateEmailButton() {
    var valid = emailValid(els.email.value.trim());
    els.emailSubmit.disabled = state.submitting || !valid;
    els.emailValid.hidden = !valid;
  }

  function updateCodeButton() {
    els.codeSubmit.disabled = state.submitting || state.codeSending || state.verifying || els.codeInput.value.length !== 6;
  }

  function errorMessage(error) {
    var code = error && error.code ? error.code : '';
    var map = {
      invalid_code: 'error.invalidCode',
      code_expired: 'error.expiredCode',
      rate_limited: 'error.rateLimit',
      account_not_found: 'error.accountNotFound',
      email_exists: 'error.emailExists',
      username_taken: 'error.usernameTaken',
      reserved_username: 'error.usernameReserved',
      invalid_username: 'error.usernameFormat',
      network_error: 'error.network',
      reset_token_invalid: 'error.resetToken',
      invalid_reset_token: 'error.resetToken',
      too_many_attempts: 'error.rateLimit',
      invalid_email: 'error.email',
      email_not_configured: 'error.emailConfig',
      email_send_failed: 'error.emailSend',
      request_failed: 'error.generic'
    };
    return t(map[code] || 'error.generic');
  }

  function progressOrder() {
    return state.mode === 'recovery'
      ? ['email', 'code', 'password', 'done']
      : ['email', 'code', 'profile', 'done'];
  }

  function updateProgress(step) {
    if (!els.progress) return;
    var order = progressOrder();
    var index = step === 'success' ? 3 : order.indexOf(step);
    if (index < 0) index = 0;
    var stepNodes = els.progress.querySelectorAll('.auth-progress-step');
    stepNodes.forEach(function (node, i) {
      node.classList.toggle('is-active', i === index);
      node.classList.toggle('is-done', i < index);
      if (i === 2) {
        var label = node.querySelector('b');
        if (label) label.textContent = t(state.mode === 'recovery' ? 'progress.password' : 'progress.profile');
      }
    });
  }

  function headingKeys(step) {
    if (state.mode === 'recovery') {
      if (step === 'email') return ['title.reset', 'sub.reset'];
      if (step === 'code') return ['title.check', 'sub.check'];
      if (step === 'password') return ['title.password', 'sub.password'];
      return ['title.passwordUpdated', 'sub.passwordUpdated'];
    }
    if (step === 'email') {
      return state.purpose === 'register'
        ? ['title.create', 'sub.create']
        : ['title.welcome', 'sub.welcome'];
    }
    if (step === 'code') return ['title.check', 'sub.check'];
    if (step === 'profile') return ['title.profile', 'sub.profile'];
    return ['title.success', 'sub.success'];
  }

  function syncFieldStates() {
    document.querySelectorAll('.field').forEach(function (field) {
      var input = field.querySelector('input');
      field.classList.toggle('has-value', !!(input && input.value));
    });
  }

  function setStep(step, options) {
    if (state.transitioning) return;
    var previous = state.step;
    var oldStep = steps[previous];
    var nextStep = steps[step];
    var direction = options && options.direction ? options.direction : 'forward';
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    state.step = step;
    var heading = headingKeys(step);
    els.title.textContent = t(heading[0]);
    els.sub.textContent = t(heading[1]);
    updateProgress(step);
    if (els.back) els.back.hidden = step !== 'code';

    if (oldStep && nextStep && oldStep !== nextStep && !oldStep.hidden && !reduced) {
      state.transitioning = true;
      oldStep.hidden = false;
      nextStep.hidden = false;
      oldStep.classList.remove('slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right');
      nextStep.classList.remove('slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right');
      void oldStep.offsetWidth;
      oldStep.classList.add(direction === 'back' ? 'slide-out-right' : 'slide-out-left');
      nextStep.classList.add(direction === 'back' ? 'slide-in-left' : 'slide-in-right');
      setTimeout(function () {
        oldStep.hidden = true;
        oldStep.classList.remove('slide-out-left', 'slide-out-right');
        nextStep.classList.remove('slide-in-left', 'slide-in-right');
        state.transitioning = false;
      }, 230);
    } else {
      Object.keys(steps).forEach(function (name) { steps[name].hidden = name !== step; });
      Object.keys(steps).forEach(function (name) {
        steps[name].classList.remove('slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right');
      });
    }

    if (step === 'code') setTimeout(function () { try { els.codeBoxes[0].focus(); } catch (error) {} }, 100);
    syncFieldStates();
  }

  function clearCode() {
    if (state.autoTimer) {
      clearTimeout(state.autoTimer);
      state.autoTimer = null;
    }
    els.codeBoxes.forEach(function (box) { box.value = ''; box.classList.remove('is-filled'); });
    els.codeInput.value = '';
    state.code = '';
    setError(els.codeError, '');
    setCodeVisual('idle');
    updateCodeButton();
  }

  function setCodeSending(sending) {
    state.codeSending = !!sending;
    if (state.autoTimer) {
      clearTimeout(state.autoTimer);
      state.autoTimer = null;
    }
    if (sending) setCodeVisual('idle');
    els.codeBoxes.forEach(function (box) { box.disabled = state.codeSending; });
    if (els.resend) els.resend.disabled = state.codeSending;
    if (state.codeSending) {
      els.codeHint.textContent = t('hint.sending');
    } else {
      els.codeHint.textContent = auth.mode === 'local'
        ? t('hint.codeLocal', { code: DEMO_CODE })
        : t('hint.code');
      if (els.resend && !state.resendTimer) els.resend.disabled = false;
    }
    updateCodeButton();
  }

  function syncCode() {
    els.codeInput.value = els.codeBoxes.map(function (box) {
      return box.value.replace(/\D/g, '');
    }).join('').slice(0, 6);
    state.code = els.codeInput.value;
    els.codeBoxes.forEach(function (box) { box.classList.toggle('is-filled', !!box.value); });
    updateCodeButton();

    if (state.autoTimer) {
      clearTimeout(state.autoTimer);
      state.autoTimer = null;
    }
    if (state.code.length === 6 && !state.submitting && !state.codeSending && !state.verifying && state.step === 'code') {
      // Telegram-like flow: the sixth digit submits by itself.
      state.autoTimer = setTimeout(function () {
        state.autoTimer = null;
        if (state.code.length === 6 && !state.submitting && !state.codeSending && !state.verifying && state.step === 'code') {
          try { document.getElementById('step-code').requestSubmit(); } catch (error) {}
        }
      }, 200);
    }
  }

  function setCodeVisual(mode) {
    if (!els.codeShell) return;
    els.codeShell.classList.toggle('is-verifying', mode === 'verifying');
    els.codeShell.classList.toggle('is-verified', mode === 'verified');
    els.codeShell.classList.toggle('is-error', mode === 'error');
    if (els.codeSuccess) els.codeSuccess.hidden = mode !== 'verified';
    if (els.codeSuccessText) els.codeSuccessText.hidden = mode !== 'verified';
    if (els.codeHint) els.codeHint.hidden = mode === 'verified';
    var locked = mode === 'verifying' || mode === 'verified';
    els.codeBoxes.forEach(function (box) { box.disabled = locked || state.codeSending; });
    if (els.changeEmail) els.changeEmail.disabled = locked;
    if (els.back) els.back.disabled = locked;
    if (els.resend) {
      if (locked) els.resend.disabled = true;
      else if (!state.codeSending && !state.resendTimer) els.resend.disabled = false;
    }
    if (mode === 'idle') {
      els.codeShell.classList.remove('is-verifying', 'is-verified', 'is-error');
      els.codeBoxes.forEach(function (box) { box.disabled = state.codeSending; });
    }
  }

  function startResendTimer(seconds) {
    if (state.resendTimer) clearInterval(state.resendTimer);
    state.retryAfter = Math.max(1, Number(seconds) || 60);
    els.resend.disabled = true;
    els.resend.textContent = t('resend.countdown', { seconds: state.retryAfter });
    state.resendTimer = setInterval(function () {
      state.retryAfter -= 1;
      if (state.retryAfter <= 0) {
        clearInterval(state.resendTimer);
        state.resendTimer = null;
        els.resend.disabled = false;
        els.resend.textContent = t('link.resend');
      } else {
        els.resend.textContent = t('resend.countdown', { seconds: state.retryAfter });
      }
    }, 1000);
  }

  async function requestCode() {
    var email = state.email || els.email.value.trim().toLowerCase();
    var purpose = state.mode === 'recovery' ? 'recovery' : state.purpose;
    var result = await auth.startEmail(email, purpose);
    startResendTimer(result.retryAfter || 60);
    return result;
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function showSendTransition(email) {
    if (!els.sendTransition) return;
    els.sendTransition.classList.remove('is-sent', 'is-leaving', 'is-on');
    els.sendTitle.textContent = t('hint.sending');
    els.sendEmail.textContent = email;
    els.sendNote.textContent = t('send.note');
    els.sendTransition.hidden = false;
    void els.sendTransition.offsetWidth;
    els.sendTransition.classList.add('is-on');
  }

  function markSendTransitionSent() {
    if (!els.sendTransition) return;
    els.sendTitle.textContent = t('send.sentTitle');
    els.sendNote.textContent = t('send.sentNote');
    els.sendTransition.classList.add('is-sent');
  }

  async function hideSendTransition() {
    if (!els.sendTransition) return;
    els.sendTransition.classList.add('is-leaving');
    await wait(220);
    els.sendTransition.hidden = true;
    els.sendTransition.classList.remove('is-on', 'is-leaving', 'is-sent');
  }

  function renderSuccess() {
    if (state.recovery) {
      els.successName.textContent = state.email || t('title.passwordUpdated');
      els.successCopy.textContent = t('success.recovery');
      els.doneAction.textContent = t('button.backSignIn');
      els.doneAction.href = './login/';
    } else {
      els.successName.textContent = state.displayName || t('title.success');
      els.successCopy.textContent = t('success.welcome', { name: state.displayName || t('title.success') });
      els.doneAction.textContent = t('button.enter');
      els.doneAction.href = './';
    }
  }

  async function finish(session, token, recovery) {
    if (!recovery) {
      auth.saveSession(session, token);
    }
    state.recovery = !!recovery;
    state.displayName = session.displayName || '';
    state.email = session.email || state.email;
    setStep('success');
    renderSuccess();
    updateProgress('success');
    setTimeout(function () { try { els.doneAction.focus(); } catch (error) {} }, 260);
  }

  function registrationTarget() {
    if (window.location.protocol === 'file:') return 'index.html';
    return '/';
  }

  function finishRegistrationNavigation() {
    if (state.registrationNav) return;
    state.registrationNav = true;
    if (state.registrationTimer) clearTimeout(state.registrationTimer);
    if (state.registrationCollapseTimer) clearTimeout(state.registrationCollapseTimer);
    window.location.assign(registrationTarget());
  }

  function playRegistrationSuccess(user, token) {
    // This function is called only after POST /api/auth/register succeeds.
    if (state.registrationSuccess) return;
    state.registrationSuccess = true;
    auth.saveSession(user, token);
    state.displayName = user.displayName || '';
    state.email = user.email || state.email;

    // Short haptic on devices that expose the standard web vibration API.
    // iOS deliberately does not expose it; the visual remains the source of truth.
    try {
      if (navigator.vibrate) navigator.vibrate(14);
    } catch (error) { /* haptics unavailable */ }

    var capsule = els.successCapsule;
    if (!capsule) {
      setTimeout(finishRegistrationNavigation, 900);
      return;
    }

    document.body.classList.add('is-registering-success');
    capsule.hidden = false;
    void capsule.offsetWidth;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { capsule.classList.add('is-open'); });
    });

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hold = reduced ? 900 : 1600;
    state.registrationTimer = setTimeout(function () {
      capsule.classList.remove('is-open');
      capsule.classList.add('is-leaving');
      state.registrationCollapseTimer = setTimeout(function () {
        capsule.hidden = true;
        finishRegistrationNavigation();
      }, reduced ? 80 : 260);
    }, hold);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && state.registrationSuccess && !state.registrationNav) {
      // Do not leave a half-finished login screen behind when the user
      // backgrounds the page during the success hold.
      finishRegistrationNavigation();
    }
  });
  window.addEventListener('pagehide', function () {
    if (state.registrationTimer) clearTimeout(state.registrationTimer);
    if (state.registrationCollapseTimer) clearTimeout(state.registrationCollapseTimer);
  });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted && state.registrationSuccess && !state.registrationNav) {
      finishRegistrationNavigation();
    }
  });

  /* Email step ------------------------------------------------------------ */
  document.getElementById('step-email').addEventListener('submit', async function (event) {
    event.preventDefault();
    if (state.submitting) return;
    var email = els.email.value.trim().toLowerCase();
    setError(els.emailError, '');
    if (!emailValid(email)) {
      setError(els.emailError, t('error.email'));
      shakeCard();
      els.email.focus();
      return;
    }
    state.email = email;
    setLoading(els.emailSubmit, true);

    // Do not reveal the code entry until the server has actually accepted and
    // sent the email. The envelope screen is the transition, not a fake state.
    var started = performance.now();
    showSendTransition(email);

    try {
      await requestCode();
      await wait(Math.max(0, 650 - (performance.now() - started)));
      markSendTransitionSent();
      await wait(320);

      // Prepare the code step behind the opaque transition, then reveal it.
      els.codeEmail.textContent = email;
      clearCode();
      els.codeHint.hidden = false;
      els.codeHint.textContent = auth.mode === 'local'
        ? t('hint.codeLocal', { code: DEMO_CODE })
        : t('hint.code');
      setStep('code');
      await hideSendTransition();
      try { els.codeBoxes[0].focus(); } catch (error) {}
    } catch (error) {
      var failure = errorMessage(error);
      await wait(240);
      await hideSendTransition();
      setError(els.emailError, failure);
      shakeCard();
    } finally {
      setLoading(els.emailSubmit, false);
      updateEmailButton();
    }
  });

  els.email.addEventListener('input', function () {
    var value = els.email.value.trim();
    updateEmailButton();
    if (els.emailError.textContent && emailValid(value)) setError(els.emailError, '');
  });
  els.email.addEventListener('blur', function () {
    var value = els.email.value.trim();
    if (value && !emailValid(value)) setError(els.emailError, t('error.email'));
  });

  els.forgot.addEventListener('click', function () {
    state.mode = 'recovery';
    state.purpose = 'recovery';
    els.email.value = state.email || els.email.value;
    updateEmailButton();
    setStep('email');
  });

  els.create.addEventListener('click', function () {
    state.mode = 'auth';
    state.purpose = 'register';
    els.email.value = state.email || els.email.value;
    updateEmailButton();
    setStep('email');
    els.email.focus();
  });

  /* Code step ------------------------------------------------------------- */
  els.codeBoxes.forEach(function (box, index) {
    box.addEventListener('input', function () {
      var digits = box.value.replace(/\D/g, '');
      if (digits.length > 1) {
        // OTP autofill / fast typing can deliver all six digits at once.
        for (var offset = 0; offset < els.codeBoxes.length - index && offset < digits.length; offset += 1) {
          els.codeBoxes[index + offset].value = digits.charAt(offset);
        }
        syncCode();
        setError(els.codeError, '');
        if (els.codeShell.classList.contains('is-error')) setCodeVisual('idle');
        var last = Math.min(index + digits.length, els.codeBoxes.length - 1);
        try { els.codeBoxes[last].focus(); } catch (error) {}
        return;
      }
      box.value = digits.slice(0, 1);
      syncCode();
      setError(els.codeError, '');
      if (els.codeShell.classList.contains('is-error')) setCodeVisual('idle');
      if (box.value && index < els.codeBoxes.length - 1) els.codeBoxes[index + 1].focus();
    });
    box.addEventListener('keydown', function (event) {
      if (event.key === 'Backspace' && !box.value && index > 0) {
        event.preventDefault();
        els.codeBoxes[index - 1].focus();
        els.codeBoxes[index - 1].value = '';
        syncCode();
      }
      if (event.key === 'ArrowLeft' && index > 0) els.codeBoxes[index - 1].focus();
      if (event.key === 'ArrowRight' && index < els.codeBoxes.length - 1) els.codeBoxes[index + 1].focus();
    });
    box.addEventListener('paste', function (event) {
      event.preventDefault();
      var text = (event.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      els.codeBoxes.forEach(function (item, i) { item.value = text[i] || ''; });
      syncCode();
      setError(els.codeError, '');
      if (els.codeShell.classList.contains('is-error')) setCodeVisual('idle');
      var next = els.codeBoxes[Math.min(text.length, els.codeBoxes.length - 1)];
      if (next) next.focus();
    });
  });

  document.getElementById('step-code').addEventListener('submit', async function (event) {
    event.preventDefault();
    if (state.submitting || state.codeSending || state.verifying) return;
    syncCode();
    if (state.code.length !== 6) {
      setError(els.codeError, t('error.codeLength'));
      shakeCard();
      return;
    }
    if (state.autoTimer) {
      clearTimeout(state.autoTimer);
      state.autoTimer = null;
    }
    state.verifying = true;
    setError(els.codeError, '');
    setCodeVisual('verifying');
    setLoading(els.codeSubmit, true);
    try {
      var result = await auth.verifyCode(state.email, state.code, state.mode === 'recovery' ? 'recovery' : state.purpose);
      // Server accepted. The sweep collapses into a solid green ring and a
      // small check, then the next screen follows after a readable 1200ms hold.
      setCodeVisual('verified');
      setTimeout(function () {
        state.verifying = false;
        if (state.mode === 'recovery') {
          state.resetToken = result.resetToken || '';
          els.passwordEmail.textContent = state.email;
          setStep('password');
          return;
        }
        if (result.isNewUser) {
          setStep('profile');
        } else {
          var user = result.user || result.session || { email: state.email, displayName: '', username: '' };
          finish(user, result.token, false);
        }
      }, 1200);
    } catch (error) {
      state.verifying = false;
      setCodeVisual('error');
      setError(els.codeError, errorMessage(error));
      shakeCard();
    } finally {
      setLoading(els.codeSubmit, false);
      updateCodeButton();
    }
  });

  els.resend.addEventListener('click', async function () {
    if (state.resendTimer || state.submitting) return;
    els.resend.disabled = true;
    els.resend.textContent = t('resend.sending');
    setCodeSending(true);
    try {
      var result = await requestCode();
      setCodeSending(false);
      clearCode();
      setError(els.codeError, '');
      startResendTimer(result.retryAfter || 60);
    } catch (error) {
      setCodeSending(false);
      setError(els.codeError, errorMessage(error));
      els.resend.disabled = false;
      els.resend.textContent = t('link.resend');
      shakeCard();
    }
  });

  els.changeEmail.addEventListener('click', function () {
    clearCode();
    state.mode = state.mode === 'recovery' ? 'recovery' : 'auth';
    setStep('email', { direction: 'back' });
  });

  /* Profile step ---------------------------------------------------------- */
  function usernameFormatError(value) {
    if (!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(value)) return 'error.usernameFormat';
    if (RESERVED.indexOf(value.toLowerCase()) !== -1) return 'error.usernameReserved';
    return '';
  }

  function renderUsernameState() {
    var labels = {
      checking: ['checking', ''],
      available: ['available', 'is-ok'],
      unavailable: ['unavailable', 'is-bad'],
      error: ['couldNotCheck', 'is-bad']
    };
    var entry = labels[state.usernameState];
    els.usernameStatus.textContent = entry ? t(entry[0]) : '';
    els.usernameStatus.className = 'username-status' + (entry && entry[1] ? ' ' + entry[1] : '');
  }

  async function checkUsername(value) {
    var format = usernameFormatError(value);
    if (format) {
      state.usernameState = 'unavailable';
      renderUsernameState();
      state.usernameOk = false;
      return false;
    }
    state.usernameOk = false;
    state.usernameState = 'checking';
    renderUsernameState();
    try {
      var result = await auth.checkUsername(value);
      if (result.available) {
        state.usernameOk = true;
        state.usernameChecked = value;
        state.usernameState = 'available';
        renderUsernameState();
        return true;
      }
      state.usernameChecked = '';
      state.usernameState = 'unavailable';
      renderUsernameState();
      return false;
    } catch (error) {
      state.usernameChecked = '';
      state.usernameState = 'error';
      renderUsernameState();
      return false;
    }
  }

  els.username.addEventListener('input', function () {
    var value = els.username.value.trim();
    state.usernameOk = false;
    state.usernameChecked = '';
    setError(els.profileError, '');
    els.usernameStatus.className = 'username-status';
    els.usernameStatus.textContent = '';
    if (state.usernameTimer) clearTimeout(state.usernameTimer);
    if (!value) return;
    state.usernameTimer = setTimeout(function () { checkUsername(value); }, 380);
  });

  document.getElementById('step-profile').addEventListener('submit', async function (event) {
    event.preventDefault();
    if (state.submitting) return;
    var name = els.name.value.trim();
    var username = els.username.value.trim();
    setError(els.profileError, '');
    if (!name) {
      setError(els.profileError, t('error.name'));
      shakeCard();
      els.name.focus();
      return;
    }
    var format = usernameFormatError(username);
    if (format) {
      setError(els.profileError, t(format));
      shakeCard();
      els.username.focus();
      return;
    }
    if (!state.usernameOk || state.usernameChecked !== username) {
      var available = await checkUsername(username);
      if (!available) {
        setError(els.profileError, t('error.usernameChoose'));
        shakeCard();
        return;
      }
    }
    setLoading(els.profileSubmit, true);
    try {
      var result = await auth.register({
        email: state.email,
        code: state.code,
        displayName: name,
        username: username
      });
      var user = result.user || result.session || { email: state.email, displayName: name, username: username };
      playRegistrationSuccess(user, result.token);
    } catch (error) {
      setError(els.profileError, errorMessage(error));
      shakeCard();
    } finally {
      setLoading(els.profileSubmit, false);
    }
  });

  /* Recovery password ----------------------------------------------------- */
  document.getElementById('step-password').addEventListener('submit', async function (event) {
    event.preventDefault();
    if (state.submitting) return;
    var password = els.password.value;
    var confirm = els.password2.value;
    setError(els.passwordError, '');
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError(els.passwordError, t('error.password'));
      shakeCard();
      els.password.focus();
      return;
    }
    if (password !== confirm) {
      setError(els.passwordError, t('error.passwordMatch'));
      shakeCard();
      els.password2.focus();
      return;
    }
    setLoading(els.passwordSubmit, true);
    try {
      await auth.recoveryPassword(state.resetToken, password);
      els.password.value = '';
      els.password2.value = '';
      await finish({ email: state.email }, null, true);
    } catch (error) {
      setError(els.passwordError, errorMessage(error));
      shakeCard();
    } finally {
      setLoading(els.passwordSubmit, false);
    }
  });

  var profileChangeEmail = document.getElementById('profile-change-email');
  if (profileChangeEmail) {
    profileChangeEmail.addEventListener('click', function () {
      clearCode();
      state.mode = 'auth';
      state.purpose = 'login';
      setStep('email', { direction: 'back' });
    });
  }

  /* Back navigation ------------------------------------------------------- */
  if (els.back) {
    els.back.addEventListener('click', function () {
      if (state.step !== 'code' || state.transitioning) return;
      clearCode();
      setStep('email', { direction: 'back' });
    });
  }

  /* Boot ------------------------------------------------------------------ */
  if (!auth) {
    els.title.textContent = 'Authentication unavailable';
    els.sub.textContent = 'The MYRQVIA auth service could not be loaded.';
    if (els.mode) els.mode.textContent = 'Auth service missing';
    return;
  }

  function renderMode() {
    if (els.mode) {
      els.mode.textContent = auth.mode === 'local'
        ? t('mode.local', { code: DEMO_CODE })
        : t('mode.secure');
    }
  }

  function refreshLocale() {
    i18n.apply();
    var heading = headingKeys(state.step);
    els.title.textContent = t(heading[0]);
    els.sub.textContent = t(heading[1]);
    renderMode();
    updateProgress(state.step);
    if (state.step === 'code') {
      els.codeHint.textContent = auth.mode === 'local'
        ? t('hint.codeLocal', { code: DEMO_CODE })
        : t('hint.code');
      if (state.resendTimer) els.resend.textContent = t('resend.countdown', { seconds: state.retryAfter });
      else els.resend.textContent = t('link.resend');
    }
    renderUsernameState();
    if (state.step === 'success') renderSuccess();
    if (state.legalKind && els.legalLayer && !els.legalLayer.hidden) openLegal(state.legalKind, true);
  }

  function legalHtml(kind) {
    var intro = t('legal.' + kind + '.intro');
    var points = [1, 2, 3, 4].map(function (index) {
      return t('legal.' + kind + '.point' + index);
    }).filter(function (value) { return value && value.indexOf('legal.') !== 0; });
    return '<p>' + intro + '</p><ul>' + points.map(function (point) {
      return '<li>' + point + '</li>';
    }).join('') + '</ul>';
  }

  function openLegal(kind, noFocus) {
    if (!els.legalLayer || !els.legalTitle || !els.legalBody) return;
    state.legalKind = kind;
    els.legalTitle.textContent = t('legal.' + kind + '.title');
    els.legalBody.innerHTML = legalHtml(kind);
    if (els.legalContact) els.legalContact.textContent = t('legal.contact');
    if (els.legalClear) {
      els.legalClear.hidden = kind !== 'privacy';
      els.legalClear.textContent = t('legal.clear');
    }
    if (els.legalClose) els.legalClose.setAttribute('aria-label', t('legal.close'));
    els.legalLayer.hidden = false;
    if (!noFocus) setTimeout(function () { try { els.legalClose.focus(); } catch (error) {} }, 80);
  }

  function closeLegal() {
    if (!els.legalLayer) return;
    els.legalLayer.hidden = true;
    state.legalKind = '';
  }

  function setupLegal() {
    document.querySelectorAll('[data-legal]').forEach(function (button) {
      button.addEventListener('click', function () { openLegal(button.getAttribute('data-legal')); });
    });
    document.querySelectorAll('[data-close-legal]').forEach(function (node) {
      node.addEventListener('click', closeLegal);
    });
    if (els.legalClear) {
      els.legalClear.addEventListener('click', function () {
        if (!window.confirm(t('legal.clearConfirm'))) return;
        ['myrqvia.auth.users.v1', 'myrqvia.auth.session.v1', 'myrqvia.auth.lastSend', 'myrqvia.auth.keep'].forEach(function (key) {
          try { localStorage.removeItem(key); } catch (error) { /* noop */ }
        });
        window.location.reload();
      });
    }
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && els.legalLayer && !els.legalLayer.hidden) closeLegal();
    });
  }

  function setupLocalePicker() {
    var select = document.getElementById('locale-select');
    if (select) {
      select.value = i18n.locale;
      select.addEventListener('change', function () { i18n.setLocale(select.value); });
    }
    document.addEventListener('myrqvia:locale-changed', refreshLocale);
  }

  try {
    var session = auth.getSession();
    if (session && session.email) {
      els.email.value = session.email;
      state.email = session.email;
    }
  } catch (error) { /* ignore */ }

  setupLocalePicker();
  setupLegal();
  renderMode();
  updateEmailButton();
  document.querySelectorAll('.field input').forEach(function (input) {
    input.addEventListener('input', syncFieldStates);
    input.addEventListener('change', syncFieldStates);
    input.addEventListener('blur', syncFieldStates);
  });
  setStep('email');
})();

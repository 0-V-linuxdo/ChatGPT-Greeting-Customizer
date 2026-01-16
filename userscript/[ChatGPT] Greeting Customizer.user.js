// ==UserScript==
// @name                 [ChatGPT] Greeting Customizer [20260116] v1.0.0
// @name:zh-CN           [ChatGPT] 问候语自定义 [20260116] v1.0.0
// @namespace            https://github.com/0-V-linuxdo/ChatGPT-Greeting-Customizer
// @description          Replace the ChatGPT home greeting with your own custom text (manage + rotate greetings).
// @description:zh-CN    将 ChatGPT 首页问候语换成自定义文案！支持管理问候语列表与轮播切换。
// @version              [20260116] v1.0.0
// @update-log           [20260116] v1.0.0 UI 自适应中英文显示；
// @match                https://chatgpt.com/*
// @grant                GM_addStyle
// @grant                GM_getValue
// @grant                GM_setValue
// @grant                GM_registerMenuCommand
// @run-at               document-start
// ==/UserScript==

(function() {
    'use strict';
  
    /********************************************************************
     * 0) 常量与默认值（保持原脚本默认两行文案风格）
     ********************************************************************/
    const SELECTOR_TEXT = 'h1.text-page-header .text-pretty';
    const SELECTOR_H1   = 'h1.text-page-header';
  
    const KEY_GREETINGS = 'gc_greetings_v1';
    const KEY_SETTINGS  = 'gc_settings_v1';
    const KEY_STATE     = 'gc_state_v1';
  
    // 约束
    const MAX_LEN = 100;
    const MAX_COUNT = 30;
  
    // 你的原始默认文案（保留）
    const DEFAULT_GREETING = [
      'Ask not what your country can do for you\n— ask what you can do for your country.',
      'It always seems impossible until it is done.',
      'The best way to predict the future is to create it.'
    ];
  
    const DEFAULT_SETTINGS = {
      mode: 'refresh',        // 'refresh' | 'interval' | 'manual'
      order: 'sequential',    // 'sequential' | 'random'
      intervalSec: 10         // 仅 mode=interval 有效
    };
  
    const DEFAULT_STATE = {
      index: -1,        // 顺序模式：上一次显示的 index；初始化 -1 便于首次 advance -> 0
      lastRandom: -1    // 随机模式：上一次随机 index（避免连续重复）
    };

    const LANG = (() => {
      const lang = (navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language || '').toLowerCase();
      return lang.startsWith('zh') ? 'zh' : 'en';
    })();

    const I18N = {
      zh: {
        title: '问候语自定义 · 管理面板',
        close: '关闭',
        newGreetingLabel: '新问候语（支持换行，单条 ≤ {maxLen} 字符；最多 {maxCount} 条）',
        placeholderGreeting: '输入问候语…（可用换行）',
        add: '添加',
        cancelEdit: '取消修改',
        savedHint: '已保存：{count}/{maxCount} 条',
        edit: '修改',
        delete: '删除',
        saveEdit: '保存修改',
        emptyGreeting: '问候语不能为空（不能全是空格）。',
        tooLongGreeting: '单条问候语不能超过 {maxLen} 字符。',
        maxCountGreeting: '最多只能保存 {maxCount} 条问候语。',
        settingsLabel: '轮播设置（自动保存）',
        modeLabel: '轮播方式：',
        modeRefresh: '选项A：刷新/进入首页时切换',
        modeInterval: '选项B：按时间间隔自动切换',
        modeManual: '选项C：手动点击标题切换',
        orderLabel: '轮播顺序：',
        orderSequential: '顺序循环',
        orderRandom: '随机选择',
        intervalLabel: '间隔（秒）：',
        settingsHint: '提示：在“手动模式”下，回到首页后点击标题即可切换；在“自动模式”下离开首页会自动停止计时。',
        storageOk: '所有更改都会自动保存到 GM 存储。',
        storageError: '存储异常：{reason}，设置不会被保存。',
        cancel: '取消',
        saveAndClose: '保存并关闭',
        titleClickHint: '点击切换问候语',
        uiMenu: '问候语设置',
        storageUnavailable: 'GM 存储不可用',
        gmGetUnavailable: 'GM_getValue 不可用',
        gmSetUnavailable: 'GM_setValue 不可用',
        gmGetPromise: 'GM_getValue 返回 Promise',
        gmGetFailed: 'GM_getValue 读取失败',
        gmSetFailed: 'GM_setValue 写入失败'
      },
      en: {
        title: 'Greeting Customizer · Manager',
        close: 'Close',
        newGreetingLabel: 'New greeting (line breaks ok, max {maxLen} chars; up to {maxCount} items)',
        placeholderGreeting: 'Type a greeting... (line breaks allowed)',
        add: 'Add',
        cancelEdit: 'Cancel Edit',
        savedHint: 'Saved: {count}/{maxCount}',
        edit: 'Edit',
        delete: 'Delete',
        saveEdit: 'Save Changes',
        emptyGreeting: 'Greeting cannot be empty (whitespace only).',
        tooLongGreeting: 'A greeting cannot exceed {maxLen} characters.',
        maxCountGreeting: 'You can save up to {maxCount} greetings.',
        settingsLabel: 'Rotation Settings (auto-save)',
        modeLabel: 'Mode:',
        modeRefresh: 'Option A: rotate on refresh / homepage entry',
        modeInterval: 'Option B: rotate by interval',
        modeManual: 'Option C: click title to rotate',
        orderLabel: 'Order:',
        orderSequential: 'Sequential',
        orderRandom: 'Random',
        intervalLabel: 'Interval (seconds):',
        settingsHint: 'Tip: In manual mode, click the homepage title to rotate. In auto mode, the timer stops when you leave the homepage.',
        storageOk: 'All changes are saved to GM storage automatically.',
        storageError: 'Storage error: {reason}; settings will not be saved.',
        cancel: 'Cancel',
        saveAndClose: 'Save & Close',
        titleClickHint: 'Click to rotate greeting',
        uiMenu: 'Greeting Customizer / Settings',
        storageUnavailable: 'GM storage unavailable',
        gmGetUnavailable: 'GM_getValue unavailable',
        gmSetUnavailable: 'GM_setValue unavailable',
        gmGetPromise: 'GM_getValue returned a Promise',
        gmGetFailed: 'GM_getValue read failed',
        gmSetFailed: 'GM_setValue write failed'
      }
    };

    function t(key, vars) {
      const dict = I18N[LANG] || I18N.en;
      let text = dict[key] || I18N.en[key] || key;
      if (vars && typeof vars === 'object') {
        text = text.replace(/\{(\w+)\}/g, (match, name) => (
          Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
        ));
      }
      return text;
    }
  
    let timerId = null;
    let lastIsHome = null;
    let lastHeaderEl = null;
    let headerCheckScheduled = false;
    const storageStatus = { ok: true, reason: '' };
  
    /********************************************************************
     * 1) GM JSON 存储封装（跨管理器更稳）
     ********************************************************************/
    function markStorageError(reasonKey) {
      if (!storageStatus.ok) return;
      storageStatus.ok = false;
      storageStatus.reason = t(reasonKey || 'storageUnavailable');
    }

    function gmGetJson(key, fallback) {
      try {
        if (typeof GM_getValue !== 'function') {
          markStorageError('gmGetUnavailable');
          return fallback;
        }
        if (typeof GM_setValue !== 'function') {
          markStorageError('gmSetUnavailable');
        }
        const raw = GM_getValue(key, '');
        if (raw && typeof raw.then === 'function') {
          markStorageError('gmGetPromise');
          return fallback;
        }
        if (!raw) return fallback;
        if (typeof raw !== 'string') {
          return raw;
        }
        return JSON.parse(raw);
      } catch (_) {
        markStorageError('gmGetFailed');
        return fallback;
      }
    }
  
    function gmSetJson(key, value) {
      if (!storageStatus.ok) return;
      if (typeof GM_setValue !== 'function') {
        markStorageError('gmSetUnavailable');
        return;
      }
      try {
        GM_setValue(key, JSON.stringify(value));
      } catch (_) {
        markStorageError('gmSetFailed');
      }
    }
  
    function loadGreetings() {
      let arr = gmGetJson(KEY_GREETINGS, null);
      if (!Array.isArray(arr) || arr.length === 0) {
        arr = DEFAULT_GREETING.slice();
        gmSetJson(KEY_GREETINGS, arr);
      }
      // 防御性：过滤非字符串
      arr = arr.filter(s => typeof s === 'string');
      if (arr.length === 0) {
        arr = DEFAULT_GREETING.slice();
        gmSetJson(KEY_GREETINGS, arr);
      }
      // 限制最大数量
      if (arr.length > MAX_COUNT) {
        arr = arr.slice(0, MAX_COUNT);
        gmSetJson(KEY_GREETINGS, arr);
      }
      return arr;
    }
  
    function loadSettings() {
      const stored = gmGetJson(KEY_SETTINGS, null);
      const s = (stored && typeof stored === 'object' && !Array.isArray(stored)) ? stored : {};
      const rawInterval = Number.isFinite(+s.intervalSec) ? Math.floor(+s.intervalSec) : null;
      const merged = {
        mode: (s.mode === 'refresh' || s.mode === 'interval' || s.mode === 'manual') ? s.mode : DEFAULT_SETTINGS.mode,
        order: (s.order === 'sequential' || s.order === 'random') ? s.order : DEFAULT_SETTINGS.order,
        intervalSec: rawInterval !== null ? Math.max(1, Math.min(3600, rawInterval)) : DEFAULT_SETTINGS.intervalSec
      };
      const needsWrite =
        !stored ||
        s.mode !== merged.mode ||
        s.order !== merged.order ||
        rawInterval !== merged.intervalSec;
      if (needsWrite) gmSetJson(KEY_SETTINGS, merged);
      return merged;
    }
  
    function loadState() {
      const stored = gmGetJson(KEY_STATE, null);
      const st = (stored && typeof stored === 'object' && !Array.isArray(stored)) ? stored : {};
      const rawIndex = Number.isFinite(+st.index) ? Math.floor(+st.index) : null;
      const rawLastRandom = Number.isFinite(+st.lastRandom) ? Math.floor(+st.lastRandom) : null;
      const merged = {
        index: rawIndex !== null ? rawIndex : DEFAULT_STATE.index,
        lastRandom: rawLastRandom !== null ? rawLastRandom : DEFAULT_STATE.lastRandom
      };
      const needsWrite = !stored || rawIndex === null || rawLastRandom === null;
      if (needsWrite) gmSetJson(KEY_STATE, merged);
      return merged;
    }
  
    function saveState(st) {
      gmSetJson(KEY_STATE, st);
    }
  
    /********************************************************************
     * 2) 文案校验与转义（用于 CSS content）
     ********************************************************************/
    function normalizeGreeting(text) {
      return String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    }
  
    function validateGreeting(text, existingListLength) {
      const normalized = normalizeGreeting(text);
      if (!normalized) return { ok: false, msg: t('emptyGreeting') };
      if (normalized.length > MAX_LEN) return { ok: false, msg: t('tooLongGreeting', { maxLen: MAX_LEN }) };
      if (existingListLength >= MAX_COUNT) return { ok: false, msg: t('maxCountGreeting', { maxCount: MAX_COUNT }) };
      return { ok: true, msg: '' };
    }
  
    // 把文本安全地放进 CSS content: "..."
    // 处理：反斜杠、双引号、换行（\n -> \a）
    function escapeForCssContent(text) {
      const t = String(text ?? '');
      return t
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\a');
    }
  
    /********************************************************************
     * 3) 核心：动态生成 CSS（保持你原选择器与隐藏逻辑）
     ********************************************************************/
    const STYLE_ID = 'gc-greeting-style-v1';
  
    function buildGreetingCss(greeting, settings, greetingsCount) {
      const content = escapeForCssContent(greeting);
  
      // 手动模式 & 多条时：提示可点（不增加额外图标，尽量不侵入）
      const manualClickable = (settings.mode === 'manual' && greetingsCount > 1);
  
      return `
        /* 隐藏原始文本节点，但保留容器占位 */
        ${SELECTOR_H1} .text-pretty {
          font-size: 0 !important;
          line-height: 0 !important;
          visibility: hidden !important;
          display: block !important; /* 确保占满宽度以便居中 */
        }
  
        /* 注入伪元素显示新文字 */
        ${SELECTOR_H1} .text-pretty::before {
          content: "${content}";
  
          /* 样式恢复与优化 */
          display: block !important;
          visibility: visible !important;
          font-size: 1.75rem !important; /* 适合多行 */
          line-height: 1.4 !important;
          font-weight: 600 !important;
          color: currentColor !important;
  
          /* 布局核心：强制换行并居中 */
          white-space: pre-wrap !important;
          text-align: center !important;
          width: 100% !important;
  
          /* 修正间距，保持在原位 */
          margin: 0 auto !important;
          padding: 0 !important;
        }
  
        ${manualClickable ? `
        ${SELECTOR_H1} {
          cursor: pointer !important;
          user-select: none !important;
        }` : ''}
  
        /* 针对移动端/窄屏的适配 */
        @media (max-width: 768px) {
          ${SELECTOR_H1} .text-pretty::before {
            font-size: 1.25rem !important;
            line-height: 1.3 !important;
          }
        }
      `;
    }
  
    function upsertStyle(cssText) {
      let style = document.getElementById(STYLE_ID);
      if (style && style.textContent === cssText) return;
      if (!style) {
        style = document.createElement('style');
        style.id = STYLE_ID;
        style.type = 'text/css';
        style.textContent = cssText;
        (document.head || document.documentElement).appendChild(style);
        return;
      }
      style.textContent = cssText;
    }
  
    /********************************************************************
     * 4) 轮播引擎（A/B/C + 顺序/随机）
     ********************************************************************/
    function isHome() {
      // ChatGPT 可能有多种路径，但通常首页是 '/'
      // 这里尽量保守：只要存在目标标题选择器，就当“可显示区”
      // 同时也参考 pathname，避免在对话页误启用定时器
      return location.pathname === '/' || location.pathname === '';
    }
  
    function pickNextIndex(listLen, settings, state, advance) {
      if (listLen <= 1) {
        // 单条固定
        state.index = 0;
        state.lastRandom = 0;
        return 0;
      }
  
      const order = settings.order;
  
      if (order === 'random') {
        if (!advance) {
          // 不 advance：尽量回到上一次
          const idx = (state.index >= 0 && state.index < listLen) ? state.index : 0;
          return idx;
        }
        // advance：随机且尽量避免连续重复
        let next = Math.floor(Math.random() * listLen);
        const prev = (state.index >= 0 && state.index < listLen) ? state.index : state.lastRandom;
        if (listLen > 1) {
          let guard = 0;
          while (next === prev && guard++ < 10) {
            next = Math.floor(Math.random() * listLen);
          }
        }
        state.index = next;
        state.lastRandom = next;
        return next;
      }
  
      // sequential
      if (!advance) {
        const idx = (state.index >= 0 && state.index < listLen) ? state.index : 0;
        return idx;
      }
      const prev = (state.index >= -1 && state.index < listLen) ? state.index : -1;
      const next = (prev + 1) % listLen;
      state.index = next;
      return next;
    }
  
    function applyGreeting(advanceForMode) {
      const greetings = loadGreetings();
      const settings = loadSettings();
      const state = loadState();
  
      const listLen = greetings.length;
  
      // 选择是否 advance：由上层 mode 决定
      const prevIndex = state.index;
      const prevLastRandom = state.lastRandom;
      const idx = pickNextIndex(listLen, settings, state, advanceForMode);
      if (state.index !== prevIndex || state.lastRandom !== prevLastRandom) {
        saveState(state);
      }
  
      const greeting = greetings[idx] ?? greetings[0] ?? DEFAULT_GREETING[0];
  
      // 更新 CSS（保持原替换方式）
      upsertStyle(buildGreetingCss(greeting, settings, listLen));
  
      // 手动模式：给标题加 title 提示（非侵入）
      if (settings.mode === 'manual' && listLen > 1) {
        const h1 = document.querySelector(SELECTOR_H1);
        if (h1) h1.title = t('titleClickHint');
      }
    }
  
    function stopTimer() {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    }
  
    function startTimerIfNeeded() {
      stopTimer();
  
      const settings = loadSettings();
      const greetings = loadGreetings();
      if (settings.mode !== 'interval') return;
      if (greetings.length <= 1) return;
      if (!isHome()) return;
  
      const ms = Math.max(1, Math.min(3600, settings.intervalSec)) * 1000;
      timerId = setInterval(() => {
        // interval 模式每次都 advance
        applyGreeting(true);
      }, ms);
    }
  
    function bindManualClickIfNeeded() {
      const settings = loadSettings();
      const greetings = loadGreetings();
      if (settings.mode !== 'manual') return;
      if (greetings.length <= 1) return;
      if (!isHome()) return;
  
      const h1 = document.querySelector(SELECTOR_H1);
      if (!h1) return;
      if (h1.dataset.gcBound === '1') return;
  
      h1.dataset.gcBound = '1';
      h1.addEventListener('click', () => {
        // 避免用户拖拽选中文本时误触
        const sel = window.getSelection && window.getSelection();
        if (sel && String(sel).trim()) return;

        // manual：点击才 advance
        applyGreeting(true);
      }, { passive: true });
    }

    function bindRightDoubleClickOpenIfNeeded() {
      if (!isHome()) return;

      const h1 = document.querySelector(SELECTOR_H1);
      if (!h1) return;
      if (h1.dataset.gcRightDblBound === '1') return;

      h1.dataset.gcRightDblBound = '1';

      let lastRightClickAt = 0;
      const dblClickGapMs = 400;

      h1.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const now = Date.now();
        if (now - lastRightClickAt <= dblClickGapMs) {
          lastRightClickAt = 0;
          openModal();
          return;
        }
        lastRightClickAt = now;
      });
    }
  
    /********************************************************************
     * 5) SPA 友好：轻量路由监听（进入首页时按模式处理）
     ********************************************************************/
    function onRouteMaybeChanged() {
      const nowHome = isHome();
  
      // 第一次调用时初始化
      if (lastIsHome === null) lastIsHome = nowHome;
  
      // 离开首页：停定时器
      if (!nowHome && lastIsHome) {
        stopTimer();
      }
  
      // 进入首页：根据模式决定是否 advance
      if (nowHome && !lastIsHome) {
        const settings = loadSettings();
        if (settings.mode === 'refresh') {
          applyGreeting(true); // 把“进入首页”视为一次运行
        } else {
          applyGreeting(false);
        }
        startTimerIfNeeded();
        bindManualClickIfNeeded();
        bindRightDoubleClickOpenIfNeeded();
      }
  
      lastIsHome = nowHome;
    }
  
    function hookHistory() {
      const _pushState = history.pushState;
      const _replaceState = history.replaceState;
  
      function fire() {
        // 异步一点，给 DOM/状态时间更新
        setTimeout(onRouteMaybeChanged, 0);
      }
  
      history.pushState = function() {
        _pushState.apply(this, arguments);
        fire();
      };
      history.replaceState = function() {
        _replaceState.apply(this, arguments);
        fire();
      };
      window.addEventListener('popstate', fire);
    }
  
    /********************************************************************
     * 6) 目标节点观察：确保标题出现后手动绑定/样式即时生效
     ********************************************************************/
    function observeHeaderAppearance() {
      const obs = new MutationObserver(() => {
        if (headerCheckScheduled) return;
        headerCheckScheduled = true;
        setTimeout(() => {
          headerCheckScheduled = false;
          if (!isHome()) return;

          const el = document.querySelector(SELECTOR_TEXT);
          if (!el) return;
          const h1 = el.closest(SELECTOR_H1) || document.querySelector(SELECTOR_H1);
          if (!h1) return;

          if (h1 === lastHeaderEl && h1.dataset.gcInitApplied === '1') {
            bindManualClickIfNeeded();
            bindRightDoubleClickOpenIfNeeded();
            return;
          }

          lastHeaderEl = h1;

          const settings = loadSettings();

          // 首次出现：按模式处理
          if (settings.mode === 'refresh') {
            // refresh 模式：页面初次运行 advance 一次
            // 但避免 DOM 反复插入导致多次 advance：用 dataset 标记
            if (h1.dataset.gcInitApplied !== '1') {
              h1.dataset.gcInitApplied = '1';
              applyGreeting(true);
            } else {
              applyGreeting(false);
            }
          } else {
            applyGreeting(false);
          }

          startTimerIfNeeded();
          bindManualClickIfNeeded();
          bindRightDoubleClickOpenIfNeeded();
        }, 0);
      });

      obs.observe(document.documentElement, { childList: true, subtree: true });
    }
  
    /********************************************************************
     * 7) 设置弹窗（GM_registerMenuCommand 触发）
     ********************************************************************/
    const UI_STYLE_ID = 'gc-greeting-ui-style-v1';
    let modalEl = null;
  
    function ensureUiStyle() {
      if (document.getElementById(UI_STYLE_ID)) return;
  
      const css = `
        .gc-overlay {
          position: fixed;
          inset: 0;
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(6px);
        }
  
        .gc-modal {
          width: min(920px, 100%);
          max-height: min(82vh, 900px);
          overflow: hidden;
          border-radius: 14px;
          box-shadow: 0 20px 60px rgba(0,0,0,.35);
          border: 1px solid rgba(127,127,127,.25);
          color: #111;
          background: rgba(255,255,255,0.96);
          display: flex;
          flex-direction: column;
        }
  
        @media (prefers-color-scheme: dark) {
          .gc-modal {
            color: #f3f4f6;
            background: rgba(20, 20, 20, 0.94);
            border-color: rgba(255,255,255,.08);
          }
        }
  
        .gc-header {
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid rgba(127,127,127,.22);
        }
  
        .gc-title {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: .2px;
        }
  
        .gc-body {
          padding: 14px 16px;
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          gap: 14px;
          overflow: auto;
        }
  
        @media (max-width: 860px) {
          .gc-body { grid-template-columns: 1fr; }
        }
  
        .gc-card {
          border: 1px solid rgba(127,127,127,.22);
          border-radius: 12px;
          padding: 12px;
          background: rgba(255,255,255,.55);
        }
  
        @media (prefers-color-scheme: dark) {
          .gc-card {
            background: rgba(255,255,255,.03);
            border-color: rgba(255,255,255,.08);
          }
        }
  
        .gc-row {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .gc-col { display: flex; flex-direction: column; gap: 8px; }

        .gc-input-footer {
          justify-content: space-between;
          align-items: center;
        }

        .gc-counter {
          margin-left: auto;
          font-size: 12px;
          opacity: .7;
          white-space: nowrap;
        }

        .gc-label {
          font-size: 12px;
          opacity: .8;
        }
  
        .gc-textarea {
          width: 100%;
          min-height: 92px;
          resize: vertical;
          border-radius: 10px;
          border: 1px solid rgba(127,127,127,.28);
          padding: 10px 10px;
          font-size: 13px;
          line-height: 1.45;
          outline: none;
          background: transparent;
          color: inherit;
        }
  
        .gc-textarea:focus {
          border-color: rgba(59, 130, 246, .6);
          box-shadow: 0 0 0 3px rgba(59,130,246,.18);
        }
  
        .gc-select, .gc-input {
          border-radius: 10px;
          border: 1px solid rgba(127,127,127,.28);
          padding: 8px 10px;
          font-size: 13px;
          background: transparent;
          color: inherit;
          outline: none;
        }
  
        .gc-select:focus, .gc-input:focus {
          border-color: rgba(59, 130, 246, .6);
          box-shadow: 0 0 0 3px rgba(59,130,246,.18);
        }
  
        .gc-hint {
          font-size: 12px;
          opacity: .75;
          line-height: 1.35;
        }
  
        .gc-error {
          font-size: 12px;
          color: #b91c1c;
          line-height: 1.35;
        }
  
        @media (prefers-color-scheme: dark) {
          .gc-error { color: #fca5a5; }
        }
  
        .gc-btn {
          border: 1px solid rgba(127,127,127,.30);
          background: transparent;
          color: inherit;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 13px;
          cursor: pointer;
          user-select: none;
        }

        .gc-btn:hover { filter: brightness(1.05); }

        .gc-btn-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-right: 6px;
          line-height: 1;
          font-size: 14px;
        }

        .gc-btn-icon-only {
          width: 32px;
          height: 32px;
          padding: 0;
          display: grid;
          place-items: center;
          font-size: 16px;
        }

        .gc-btn-close {
          width: 32px;
          height: 32px;
          padding: 0;
          display: grid;
          place-items: center;
        }

        .gc-btn-close-icon {
          display: block;
          font-size: 18px;
          line-height: 1;
        }

        .gc-btn-primary {
          border-color: rgba(59, 130, 246, .55);
          background: rgba(59, 130, 246, .10);
        }

        .gc-btn-success {
          border-color: rgba(16, 163, 127, .55);
          background: rgba(16, 163, 127, .12);
        }

        .gc-btn-danger {
          border-color: rgba(239, 68, 68, .55);
          background: rgba(239, 68, 68, .10);
        }

        @media (prefers-color-scheme: dark) {
          .gc-textarea:focus {
            border-color: rgba(16, 163, 127, .6);
            box-shadow: 0 0 0 3px rgba(16, 163, 127, .22);
          }

          .gc-select:focus, .gc-input:focus {
            border-color: rgba(16, 163, 127, .6);
            box-shadow: 0 0 0 3px rgba(16, 163, 127, .22);
          }

          .gc-btn-primary {
            border-color: rgba(16, 163, 127, .55);
            background: rgba(16, 163, 127, .16);
          }

          .gc-btn-success {
            border-color: rgba(16, 163, 127, .55);
            background: rgba(16, 163, 127, .16);
          }

          .gc-header,
          .gc-footer {
            border-color: rgba(255,255,255,.08);
          }
        }
  
        .gc-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
  
        .gc-item {
          border: 1px solid rgba(127,127,127,.22);
          border-radius: 12px;
          padding: 10px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
          justify-content: space-between;
          background: rgba(255,255,255,.40);
        }
  
        @media (prefers-color-scheme: dark) {
          .gc-item { background: rgba(255,255,255,.02); border-color: rgba(255,255,255,.08); }
        }
  
        .gc-item-text {
          font-size: 13px;
          line-height: 1.35;
          white-space: pre-wrap;
          word-break: break-word;
          flex: 1;
        }
  
        .gc-item-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
  
        .gc-footer {
          padding: 12px 16px;
          border-top: 1px solid rgba(127,127,127,.22);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
      `;
  
      // 尽量用 GM_addStyle（与原脚本一致），否则 fallback
      if (typeof GM_addStyle !== 'undefined') {
        GM_addStyle(css);
        // GM_addStyle 没法设置 id，所以额外插一个空标记避免重复（轻量）
        const mark = document.createElement('meta');
        mark.id = UI_STYLE_ID;
        (document.head || document.documentElement).appendChild(mark);
      } else {
        const style = document.createElement('style');
        style.id = UI_STYLE_ID;
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
      }
    }
  
    function ensureDomReady() {
      if (document.body) return Promise.resolve();
      return new Promise(resolve => {
        window.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
      });
    }
  
    function closeModal() {
      if (modalEl) {
        modalEl.remove();
        modalEl = null;
      }
    }
  
    function openModal() {
      ensureDomReady().then(() => {
        ensureUiStyle();
  
        if (modalEl) return;
  
        let greetings = loadGreetings();
        let settings = loadSettings();
  
        let editingIndex = -1;
  
        const overlay = document.createElement('div');
        overlay.className = 'gc-overlay';
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) closeModal();
        });
  
        const modal = document.createElement('div');
        modal.className = 'gc-modal';
  
        const header = document.createElement('div');
        header.className = 'gc-header';
  
        const title = document.createElement('div');
        title.className = 'gc-title';
        title.textContent = t('title');
  
        const headerBtns = document.createElement('div');
        headerBtns.className = 'gc-row';
  
        const btnClose = document.createElement('button');
        btnClose.className = 'gc-btn gc-btn-close';
        btnClose.title = t('close');
        btnClose.setAttribute('aria-label', t('close'));
        const btnCloseIcon = document.createElement('span');
        btnCloseIcon.className = 'gc-btn-close-icon';
        btnCloseIcon.textContent = '×';
        btnClose.appendChild(btnCloseIcon);
        btnClose.addEventListener('click', closeModal);
  
        headerBtns.appendChild(btnClose);
        header.appendChild(title);
        header.appendChild(headerBtns);
  
        const body = document.createElement('div');
        body.className = 'gc-body';
  
        // 左侧：输入 + 列表
        const leftCard = document.createElement('div');
        leftCard.className = 'gc-card gc-col';
  
        const lblInput = document.createElement('div');
        lblInput.className = 'gc-label';
        lblInput.textContent = t('newGreetingLabel', { maxLen: MAX_LEN, maxCount: MAX_COUNT });
  
        const ta = document.createElement('textarea');
        ta.className = 'gc-textarea';
        ta.placeholder = t('placeholderGreeting');
        ta.maxLength = MAX_LEN;
  
        const error = document.createElement('div');
        error.className = 'gc-error';
        error.style.display = 'none';
  
        const rowBtns = document.createElement('div');
        rowBtns.className = 'gc-row';

        const btnAddOrUpdate = document.createElement('button');
        btnAddOrUpdate.className = 'gc-btn gc-btn-primary';
        btnAddOrUpdate.textContent = t('add');
  
        const btnCancelEdit = document.createElement('button');
        btnCancelEdit.className = 'gc-btn';
        btnCancelEdit.textContent = t('cancelEdit');
        btnCancelEdit.style.display = 'none';
  
        rowBtns.appendChild(btnAddOrUpdate);
        rowBtns.appendChild(btnCancelEdit);

        const counter = document.createElement('div');
        counter.className = 'gc-counter';

        const inputFooter = document.createElement('div');
        inputFooter.className = 'gc-row gc-input-footer';
        inputFooter.appendChild(rowBtns);
        inputFooter.appendChild(counter);

        const hint = document.createElement('div');
        hint.className = 'gc-hint';

        const list = document.createElement('ul');
        list.className = 'gc-list';

        function updateCharCount() {
          counter.textContent = `${ta.value.length}/${MAX_LEN}`;
        }

        function setError(msg) {
          if (!msg) {
            error.style.display = 'none';
            error.textContent = '';
            return;
          }
          error.style.display = 'block';
          error.textContent = msg;
        }
  
        function syncHint() {
          hint.textContent = t('savedHint', { count: greetings.length, maxCount: MAX_COUNT });
        }
  
        function persistGreetingsAndRefreshEngine() {
          gmSetJson(KEY_GREETINGS, greetings);
          // 内容变更后：尽量让首页立刻反映（不强制 advance）
          applyGreeting(false);
          startTimerIfNeeded();
          bindManualClickIfNeeded();
          bindRightDoubleClickOpenIfNeeded();
        }
  
        function renderList() {
          list.innerHTML = '';
          syncHint();
  
          greetings.forEach((g, idx) => {
            const li = document.createElement('li');
            li.className = 'gc-item';
  
            const text = document.createElement('div');
            text.className = 'gc-item-text';
            text.textContent = g;
  
            const actions = document.createElement('div');
            actions.className = 'gc-item-actions';
  
            const btnEdit = document.createElement('button');
            btnEdit.className = 'gc-btn gc-btn-icon-only';
            btnEdit.textContent = '✍️';
            btnEdit.title = t('edit');
            btnEdit.setAttribute('aria-label', t('edit'));
            btnEdit.addEventListener('click', () => {
              editingIndex = idx;
              ta.value = greetings[idx];
              updateCharCount();
              btnAddOrUpdate.textContent = t('saveEdit');
              btnCancelEdit.style.display = 'inline-block';
              setError('');
              ta.focus();
            });
  
            const btnDel = document.createElement('button');
            btnDel.className = 'gc-btn gc-btn-danger gc-btn-icon-only';
            btnDel.textContent = '🗑️';
            btnDel.title = t('delete');
            btnDel.setAttribute('aria-label', t('delete'));
            btnDel.addEventListener('click', () => {
              // 删除后至少保留 1 条：允许删空，但会自动回落默认
              greetings.splice(idx, 1);
              if (greetings.length === 0) {
                greetings = DEFAULT_GREETING.slice();
              }
              // 如果正在编辑的被删，退出编辑态
              if (editingIndex === idx) {
                editingIndex = -1;
                ta.value = '';
                btnAddOrUpdate.textContent = t('add');
                btnCancelEdit.style.display = 'none';
              }
              persistGreetingsAndRefreshEngine();
              renderList();
            });
  
            actions.appendChild(btnEdit);
            actions.appendChild(btnDel);
  
            li.appendChild(text);
            li.appendChild(actions);
            list.appendChild(li);
          });
        }
  
        btnCancelEdit.addEventListener('click', () => {
          editingIndex = -1;
          ta.value = '';
          updateCharCount();
          btnAddOrUpdate.textContent = t('add');
          btnCancelEdit.style.display = 'none';
          setError('');
        });

        btnAddOrUpdate.addEventListener('click', () => {
          const text = normalizeGreeting(ta.value);
  
          if (editingIndex >= 0) {
            // 修改
            if (!text) return setError(t('emptyGreeting'));
            if (text.length > MAX_LEN) return setError(t('tooLongGreeting', { maxLen: MAX_LEN }));
  
            greetings[editingIndex] = text;
            editingIndex = -1;
            ta.value = '';
            updateCharCount();
            btnAddOrUpdate.textContent = t('add');
            btnCancelEdit.style.display = 'none';
            setError('');

            persistGreetingsAndRefreshEngine();
            renderList();
            return;
          }
  
          // 添加
          const v = validateGreeting(text, greetings.length);
          if (!v.ok) return setError(v.msg);

          greetings.push(text);
          ta.value = '';
          updateCharCount();
          setError('');

          persistGreetingsAndRefreshEngine();
          renderList();
        });

        ta.addEventListener('input', updateCharCount);

        leftCard.appendChild(lblInput);
        leftCard.appendChild(ta);
        leftCard.appendChild(error);
        leftCard.appendChild(inputFooter);
        leftCard.appendChild(hint);
        leftCard.appendChild(list);
  
        // 右侧：轮播设置
        const rightCard = document.createElement('div');
        rightCard.className = 'gc-card gc-col';
  
        const lblSettings = document.createElement('div');
        lblSettings.className = 'gc-label';
        lblSettings.textContent = t('settingsLabel');
  
        const rowMode = document.createElement('div');
        rowMode.className = 'gc-row';
  
        const modeLabel = document.createElement('div');
        modeLabel.className = 'gc-label';
        modeLabel.textContent = t('modeLabel');
  
        const selMode = document.createElement('select');
        selMode.className = 'gc-select';
        selMode.innerHTML = `
          <option value="refresh">${t('modeRefresh')}</option>
          <option value="interval">${t('modeInterval')}</option>
          <option value="manual">${t('modeManual')}</option>
        `;
        selMode.value = settings.mode;
  
        rowMode.appendChild(modeLabel);
        rowMode.appendChild(selMode);
  
        const rowOrder = document.createElement('div');
        rowOrder.className = 'gc-row';
  
        const orderLabel = document.createElement('div');
        orderLabel.className = 'gc-label';
        orderLabel.textContent = t('orderLabel');
  
        const selOrder = document.createElement('select');
        selOrder.className = 'gc-select';
        selOrder.innerHTML = `
          <option value="sequential">${t('orderSequential')}</option>
          <option value="random">${t('orderRandom')}</option>
        `;
        selOrder.value = settings.order;
  
        rowOrder.appendChild(orderLabel);
        rowOrder.appendChild(selOrder);
  
        const rowInterval = document.createElement('div');
        rowInterval.className = 'gc-row';
  
        const intervalLabel = document.createElement('div');
        intervalLabel.className = 'gc-label';
        intervalLabel.textContent = t('intervalLabel');
  
        const inputInterval = document.createElement('input');
        inputInterval.className = 'gc-input';
        inputInterval.type = 'number';
        inputInterval.min = '1';
        inputInterval.max = '3600';
        inputInterval.step = '1';
        inputInterval.value = String(settings.intervalSec);
  
        rowInterval.appendChild(intervalLabel);
        rowInterval.appendChild(inputInterval);
  
        const settingsHint = document.createElement('div');
        settingsHint.className = 'gc-hint';
        settingsHint.textContent = t('settingsHint');
  
        function persistSettingsAndRefreshEngine() {
          settings = {
            mode: selMode.value,
            order: selOrder.value,
            intervalSec: Math.max(1, Math.min(3600, Math.floor(+inputInterval.value || DEFAULT_SETTINGS.intervalSec)))
          };
          gmSetJson(KEY_SETTINGS, settings);
  
          // 设置变更后：刷新样式/计时器/点击绑定
          applyGreeting(false);
          startTimerIfNeeded();
          bindManualClickIfNeeded();
          bindRightDoubleClickOpenIfNeeded();
  
          // interval 输入框可用性
          inputInterval.disabled = (settings.mode !== 'interval');
          inputInterval.style.opacity = inputInterval.disabled ? '0.6' : '1';
        }
  
        selMode.addEventListener('change', persistSettingsAndRefreshEngine);
        selOrder.addEventListener('change', persistSettingsAndRefreshEngine);
        inputInterval.addEventListener('change', persistSettingsAndRefreshEngine);
        inputInterval.addEventListener('input', () => {
          // 实时限制范围但不频繁写 GM
          const v = Math.max(1, Math.min(3600, Math.floor(+inputInterval.value || 1)));
          if (String(v) !== inputInterval.value && inputInterval.value !== '') {
            inputInterval.value = String(v);
          }
        });
  
        rightCard.appendChild(lblSettings);
        rightCard.appendChild(rowMode);
        rightCard.appendChild(rowOrder);
        rightCard.appendChild(rowInterval);
        rightCard.appendChild(settingsHint);
  
        body.appendChild(leftCard);
        body.appendChild(rightCard);
  
        const footer = document.createElement('div');
        footer.className = 'gc-footer';
  
        const footerLeft = document.createElement('div');
        if (storageStatus.ok) {
          footerLeft.className = 'gc-hint';
          footerLeft.textContent = t('storageOk');
        } else {
          footerLeft.className = 'gc-error';
          footerLeft.textContent = t('storageError', { reason: storageStatus.reason || t('storageUnavailable') });
        }
  
        const footerRight = document.createElement('div');
        footerRight.className = 'gc-row';
  
        const btnCancel = document.createElement('button');
        btnCancel.className = 'gc-btn';
        btnCancel.textContent = t('cancel');
        btnCancel.addEventListener('click', closeModal);
  
        const btnSave = document.createElement('button');
        btnSave.className = 'gc-btn gc-btn-success';
        const btnSaveIcon = document.createElement('span');
        btnSaveIcon.className = 'gc-btn-icon';
        btnSaveIcon.textContent = '💾';
        btnSaveIcon.setAttribute('aria-hidden', 'true');
        const btnSaveText = document.createElement('span');
        btnSaveText.textContent = t('saveAndClose');
        btnSave.appendChild(btnSaveIcon);
        btnSave.appendChild(btnSaveText);
        btnSave.addEventListener('click', closeModal);
  
        footerRight.appendChild(btnCancel);
        footerRight.appendChild(btnSave);
  
        footer.appendChild(footerLeft);
        footer.appendChild(footerRight);
  
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
  
        // ESC 关闭
        const onKeyDown = (e) => {
          if (e.key === 'Escape') closeModal();
        };
        window.addEventListener('keydown', onKeyDown, { passive: true });
  
        // 清理 keydown
        const oldClose = closeModal;
        closeModal = function() {
          window.removeEventListener('keydown', onKeyDown);
          oldClose();
          // 恢复 closeModal 引用（避免多次 open 后函数被覆盖链式增长）
          closeModal = oldClose;
        };
  
        document.body.appendChild(overlay);
        modalEl = overlay;
  
        // 初始化 UI 状态
        inputInterval.disabled = (settings.mode !== 'interval');
        inputInterval.style.opacity = inputInterval.disabled ? '0.6' : '1';
  
        renderList();
        setError('');
        syncHint();
        updateCharCount();
      });
    }
  
    /********************************************************************
     * 8) 菜单项注册
     ********************************************************************/
    function registerMenu() {
      if (typeof GM_registerMenuCommand !== 'undefined') {
        GM_registerMenuCommand(t('uiMenu'), openModal);
      }
    }
  
    /********************************************************************
     * 9) 启动：保持原行为（document-start 注入 + 观察）
     ********************************************************************/
    // 首次根据模式应用
    (function bootstrap() {
      // 确保初始数据存在
      loadGreetings();
      loadSettings();
      loadState();
  
      // 先注入一次样式（不一定立刻有 DOM，但 CSS 先到位）
      const settings = loadSettings();
      if (settings.mode === 'refresh') {
        applyGreeting(true);
      } else {
        applyGreeting(false);
      }
  
      // 监听 SPA 路由与 DOM
      hookHistory();
      observeHeaderAppearance();
  
      // 初始路由状态
      lastIsHome = isHome();
      if (lastIsHome) {
        startTimerIfNeeded();
        bindManualClickIfNeeded();
        bindRightDoubleClickOpenIfNeeded();
      }
  
      registerMenu();
    })();
  
  })();
  

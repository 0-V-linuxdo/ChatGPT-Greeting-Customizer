// ==UserScript==
// @name         Greeting Customizer Core Library
// @name:zh-CN   问候语自定义 · 核心库
// @namespace    https://github.com/0-V-linuxdo/Greeting-Customizer
// @description  Shared core library for Greeting Customizer scripts. Not used standalone — @require this in site-specific scripts.
// @description:zh-CN  问候语自定义脚本的通用核心库。不单独使用，在各网站脚本中通过 @require 引入。
// @version      1.0.0
// @license      MIT
// ==/UserScript==

/**
 * Greeting Customizer — Core Library
 *
 * 使用方法（在各网站脚本中）：
 *
 * // @require  <path-or-url>/greeting-core.js
 *
 * GreetingCustomizer({
 *     // ---- 必填：CSS 选择器 ----
 *     selectorText: 'h1.text-page-header .text-pretty',   // 文字所在元素
 *     selectorH1:   'h1.text-page-header',                // 标题容器
 *
 *     // ---- 必填：GM 存储 key ----
 *     keyGreetings: 'gc_greetings_v1',
 *     keySettings:  'gc_settings_v1',
 *     keyState:     'gc_state_v1',
 *
 *     // ---- 必填：首页判断 ----
 *     isHome: () => location.pathname === '/' || location.pathname === '',
 *
 *     // ---- 必填：CSS 生成 ----
 *     buildGreetingCss: (selectorText, selectorH1, escapedContent, settings, manualClickable) => `...`,
 *
 *     // ---- 可选 ----
 *     defaultGreetings: [...],              // 默认问候语列表
 *     defaultSettings:  { ... },            // 默认设置（会被 deep merge）
 *     maxLen:   100,                        // 单条字数上限
 *     maxCount: 30,                         // 最多条目数
 *     styleId:  'gc-greeting-style-v1',     // greeting <style> 元素 id
 *     uiStyleId: 'gc-greeting-ui-style-v1', // modal <style> 元素 id
 *     extraI18N: { zh: {}, en: {} },        // 扩展 i18n 词条
 *     useGlobalRefreshGuard: false,          // Gemini 等需全局 flag 防重复 advance
 *     onBuildSettingsUI: (rightCard, settings, persist, t) => {},  // 自定义设置面板扩展
 *     onPersistSettings: (base, extraUI) => ({ ...base }),         // 扩展序列化
 * });
 */

// eslint-disable-next-line no-unused-vars
var GreetingCustomizer = (function () {
    'use strict';

    /********************************************************************
     * I18N 基础词条（通用部分，与任何网站无关）
     ********************************************************************/
    const BASE_I18N = {
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
            settingsHint: '提示：在"手动模式"下，回到首页后点击标题即可切换；在"自动模式"下离开首页会自动停止计时。',
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

    const DEFAULT_GREETINGS = [
        'Ask not what your country can do for you\n— ask what you can do for your country.',
        'It always seems impossible until it is done.',
        'The best way to predict the future is to create it.'
    ];

    const DEFAULT_SETTINGS_BASE = {
        mode: 'refresh',        // 'refresh' | 'interval' | 'manual'
        order: 'sequential',    // 'sequential' | 'random'
        intervalSec: 10         // 仅 mode=interval 有效
    };

    const DEFAULT_STATE = {
        index: -1,
        lastRandom: -1
    };

    /********************************************************************
     * 工具函数
     ********************************************************************/

    /** 检测语言 */
    function detectLang() {
        const lang = (navigator.languages && navigator.languages.length
            ? navigator.languages[0]
            : navigator.language || ''
        ).toLowerCase();
        return lang.startsWith('zh') ? 'zh' : 'en';
    }

    /** i18n 翻译 */
    function makeTranslator(i18n, lang) {
        return function t(key, vars) {
            const dict = i18n[lang] || i18n.en;
            let text = dict[key] || i18n.en[key] || key;
            if (vars && typeof vars === 'object') {
                text = text.replace(/\{(\w+)\}/g, (match, name) => (
                    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
                ));
            }
            return text;
        };
    }

    /** 把文本安全地放进 CSS content: "..." */
    function escapeForCssContent(text) {
        const s = String(text ?? '');
        return s
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\a');
    }

    /** 文案归一化 */
    function normalizeGreeting(text) {
        return String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    }

    /********************************************************************
     * 主入口：GreetingCustomizer(config)
     ********************************************************************/
    return function GreetingCustomizer(config) {

        // ---- 解构配置 ----
        const SELECTOR_TEXT = config.selectorText;
        const SELECTOR_H1 = config.selectorH1;

        const KEY_GREETINGS = config.keyGreetings;
        const KEY_SETTINGS = config.keySettings;
        const KEY_STATE = config.keyState;

        const MAX_LEN = config.maxLen || 100;
        const MAX_COUNT = config.maxCount || 30;

        const DEFAULT_GREETING = config.defaultGreetings || DEFAULT_GREETINGS;
        const DEFAULT_SETTINGS = Object.assign({}, DEFAULT_SETTINGS_BASE, config.defaultSettings || {});

        const STYLE_ID = config.styleId || 'gc-greeting-style-v1';
        const UI_STYLE_ID = config.uiStyleId || 'gc-greeting-ui-style-v1';

        const isHome = config.isHome;
        const buildGreetingCss = config.buildGreetingCss;

        const useGlobalRefreshGuard = config.useGlobalRefreshGuard || false;
        const onBuildSettingsUI = config.onBuildSettingsUI || null;
        const onPersistSettings = config.onPersistSettings || null;

        // ---- I18N ----
        const LANG = detectLang();
        const mergedI18N = { zh: {}, en: {} };
        Object.assign(mergedI18N.zh, BASE_I18N.zh, (config.extraI18N && config.extraI18N.zh) || {});
        Object.assign(mergedI18N.en, BASE_I18N.en, (config.extraI18N && config.extraI18N.en) || {});
        const t = makeTranslator(mergedI18N, LANG);

        // ---- 状态变量 ----
        let timerId = null;
        let lastIsHome = null;
        let lastHeaderEl = null;
        let headerCheckScheduled = false;
        let hasAppliedRefreshAdvance = false;
        const storageStatus = { ok: true, reason: '' };

        /********************************************************************
         * 1) GM JSON 存储封装
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

        /********************************************************************
         * 2) 数据层
         ********************************************************************/
        function loadGreetings() {
            let arr = gmGetJson(KEY_GREETINGS, null);
            if (!Array.isArray(arr) || arr.length === 0) {
                arr = DEFAULT_GREETING.slice();
                gmSetJson(KEY_GREETINGS, arr);
            }
            arr = arr.filter(s => typeof s === 'string');
            if (arr.length === 0) {
                arr = DEFAULT_GREETING.slice();
                gmSetJson(KEY_GREETINGS, arr);
            }
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

            // 合并站点额外的 settings 字段（如 hideUsername）
            const extraKeys = Object.keys(DEFAULT_SETTINGS).filter(k => !(k in merged));
            for (const k of extraKeys) {
                merged[k] = (typeof s[k] === typeof DEFAULT_SETTINGS[k]) ? s[k] : DEFAULT_SETTINGS[k];
            }

            let needsWrite = !stored ||
                s.mode !== merged.mode ||
                s.order !== merged.order ||
                rawInterval !== merged.intervalSec;
            for (const k of extraKeys) {
                if (s[k] !== merged[k]) needsWrite = true;
            }
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
         * 3) 文案校验
         ********************************************************************/
        function validateGreeting(text, existingListLength) {
            const normalized = normalizeGreeting(text);
            if (!normalized) return { ok: false, msg: t('emptyGreeting') };
            if (normalized.length > MAX_LEN) return { ok: false, msg: t('tooLongGreeting', { maxLen: MAX_LEN }) };
            if (existingListLength >= MAX_COUNT) return { ok: false, msg: t('maxCountGreeting', { maxCount: MAX_COUNT }) };
            return { ok: true, msg: '' };
        }

        /********************************************************************
         * 4) CSS 注入
         ********************************************************************/
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
         * 5) 轮播引擎
         ********************************************************************/
        function pickNextIndex(listLen, settings, state, advance) {
            if (listLen <= 1) {
                state.index = 0;
                state.lastRandom = 0;
                return 0;
            }

            const order = settings.order;

            if (order === 'random') {
                if (!advance) {
                    const idx = (state.index >= 0 && state.index < listLen) ? state.index : 0;
                    return idx;
                }
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

            const prevIndex = state.index;
            const prevLastRandom = state.lastRandom;
            const idx = pickNextIndex(listLen, settings, state, advanceForMode);
            if (state.index !== prevIndex || state.lastRandom !== prevLastRandom) {
                saveState(state);
            }

            const greeting = greetings[idx] ?? greetings[0] ?? DEFAULT_GREETING[0];

            const escapedContent = escapeForCssContent(greeting);
            const manualClickable = (settings.mode === 'manual' && listLen > 1);

            // 调用站点级 CSS 构建
            const css = buildGreetingCss(SELECTOR_TEXT, SELECTOR_H1, escapedContent, settings, manualClickable);
            upsertStyle(css);

            // 手动模式：给标题加 title 提示
            if (settings.mode === 'manual' && listLen > 1) {
                const h1 = document.querySelector(SELECTOR_H1);
                if (h1) h1.title = t('titleClickHint');
            }
        }

        /********************************************************************
         * 6) 定时器 & 绑定
         ********************************************************************/
        function stopTimer() {
            if (timerId) {
                clearInterval(timerId);
                timerId = null;
            }
        }

        function startTimerIfNeeded() {
            const settings = loadSettings();
            const greetings = loadGreetings();

            if (settings.mode !== 'interval' || greetings.length <= 1 || !isHome()) {
                stopTimer();
                return;
            }

            // 如果已在运行则不重启
            if (timerId !== null) return;

            const ms = Math.max(1, Math.min(3600, settings.intervalSec)) * 1000;
            timerId = setInterval(() => {
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
                const sel = window.getSelection && window.getSelection();
                if (sel && String(sel).trim()) return;
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
         * 7) SPA 路由监听
         ********************************************************************/
        function onRouteMaybeChanged() {
            const nowHome = isHome();

            if (lastIsHome === null) lastIsHome = nowHome;

            if (!nowHome && lastIsHome) {
                stopTimer();
            }

            if (nowHome && !lastIsHome) {
                hasAppliedRefreshAdvance = false;
                const settings = loadSettings();
                if (settings.mode === 'refresh') {
                    hasAppliedRefreshAdvance = true;
                    applyGreeting(true);
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
                setTimeout(onRouteMaybeChanged, 0);
            }

            history.pushState = function () {
                _pushState.apply(this, arguments);
                fire();
            };
            history.replaceState = function () {
                _replaceState.apply(this, arguments);
                fire();
            };
            window.addEventListener('popstate', fire);
        }

        /********************************************************************
         * 8) MutationObserver：标题出现后绑定
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

                    if (settings.mode === 'refresh') {
                        if (useGlobalRefreshGuard) {
                            // Gemini 等：用全局 flag 防止 DOM 重建导致多次 advance
                            if (!hasAppliedRefreshAdvance) {
                                hasAppliedRefreshAdvance = true;
                                applyGreeting(true);
                            } else {
                                applyGreeting(false);
                            }
                        } else {
                            // ChatGPT / DeepSeek / Arena：用 dataset 标记
                            if (h1.dataset.gcInitApplied !== '1') {
                                h1.dataset.gcInitApplied = '1';
                                applyGreeting(true);
                            } else {
                                applyGreeting(false);
                            }
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
         * 9) 设置弹窗 UI
         ********************************************************************/
        let modalEl = null;

        function ensureUiStyle() {
            if (document.getElementById(UI_STYLE_ID)) return;

            const css = `
        .gc-overlay, .gc-overlay * {
          box-sizing: border-box;
        }

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

            if (typeof GM_addStyle !== 'undefined') {
                GM_addStyle(css);
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
                    applyGreeting(false);
                    stopTimer();
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
                            greetings.splice(idx, 1);
                            if (greetings.length === 0) {
                                greetings = DEFAULT_GREETING.slice();
                            }
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

                // 站点扩展 UI 钩子（如 Gemini 的 hideUsername）
                let extraUIState = {};
                if (onBuildSettingsUI) {
                    extraUIState = onBuildSettingsUI(rightCard, settings, function () {
                        persistSettingsAndRefreshEngine();
                    }, t) || {};
                }

                function persistSettingsAndRefreshEngine() {
                    const base = {
                        mode: selMode.value,
                        order: selOrder.value,
                        intervalSec: Math.max(1, Math.min(3600, Math.floor(+inputInterval.value || DEFAULT_SETTINGS.intervalSec)))
                    };

                    if (onPersistSettings) {
                        settings = onPersistSettings(base, extraUIState);
                    } else {
                        settings = base;
                    }

                    gmSetJson(KEY_SETTINGS, settings);

                    applyGreeting(false);
                    stopTimer();
                    startTimerIfNeeded();
                    bindManualClickIfNeeded();
                    bindRightDoubleClickOpenIfNeeded();

                    inputInterval.disabled = (settings.mode !== 'interval');
                    inputInterval.style.opacity = inputInterval.disabled ? '0.6' : '1';
                }

                selMode.addEventListener('change', persistSettingsAndRefreshEngine);
                selOrder.addEventListener('change', persistSettingsAndRefreshEngine);
                inputInterval.addEventListener('change', persistSettingsAndRefreshEngine);
                inputInterval.addEventListener('input', () => {
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

                const oldClose = closeModal;
                closeModal = function () {
                    window.removeEventListener('keydown', onKeyDown);
                    oldClose();
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
         * 10) 菜单注册
         ********************************************************************/
        function registerMenu() {
            if (typeof GM_registerMenuCommand !== 'undefined') {
                GM_registerMenuCommand(t('uiMenu'), openModal);
            }
        }

        /********************************************************************
         * 11) 启动
         ********************************************************************/
        (function bootstrap() {
            loadGreetings();
            loadSettings();
            loadState();

            const settings = loadSettings();
            if (settings.mode === 'refresh') {
                hasAppliedRefreshAdvance = true;
                applyGreeting(true);
            } else {
                applyGreeting(false);
            }

            hookHistory();
            observeHeaderAppearance();

            lastIsHome = isHome();
            if (lastIsHome) {
                startTimerIfNeeded();
                bindManualClickIfNeeded();
                bindRightDoubleClickOpenIfNeeded();
            }

            registerMenu();
        })();
    };
})();

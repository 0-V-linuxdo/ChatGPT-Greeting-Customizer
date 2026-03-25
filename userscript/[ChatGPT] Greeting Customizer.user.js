// ==UserScript==
// @name                 [ChatGPT] Greeting Customizer [20260325] v1.0.0
// @name:zh-CN           [ChatGPT] 问候语自定义 [20260325] v1.0.0
// @namespace            https://github.com/0-V-linuxdo/ChatGPT-Greeting-Customizer
// @description          Customize ChatGPT home greetings! Manage multiple texts, support random/sequential rotation, and click or auto-timer switching.
// @description:zh-CN    自定义 ChatGPT 首页问候语！支持多文案管理、随机/顺序轮播、点击或定时自动切换，让 AI 首页更有个性。
// @version              [20260325] v1.0.0
// @update-log           [20260325] v1.0.0 核心逻辑引用 URL 迁移至统一仓库 (AI-Greeting-Customizer)；
// @match                https://chatgpt.com/*
// @require              https://github.com/0-V-linuxdo/AI-Greeting-Customizer/raw/refs/heads/main/core/greeting-core.js
// @grant                GM_addStyle
// @grant                GM_getValue
// @grant                GM_setValue
// @grant                GM_registerMenuCommand
// @run-at               document-start
// ==/UserScript==

(function () {
    'use strict';

    GreetingCustomizer({
        // ---- CSS 选择器 ----
        selectorText: 'h1.text-page-header .text-pretty',
        selectorH1:   'h1.text-page-header',

        // ---- GM 存储 key ----
        keyGreetings: 'gc_greetings_v1',
        keySettings:  'gc_settings_v1',
        keyState:     'gc_state_v1',

        // ---- 首页判断 ----
        isHome: () => location.pathname === '/' || location.pathname === '',

        // ---- CSS 生成（只修改字体大小，不动字体） ----
        buildGreetingCss: (selectorText, selectorH1, escapedContent, settings, manualClickable) => `
            /* 隐藏原始文本节点，但保留容器占位 */
            ${selectorH1} .text-pretty {
              font-size: 0 !important;
              line-height: 0 !important;
              visibility: hidden !important;
              display: block !important;
            }

            /* 注入伪元素显示新文字 */
            ${selectorH1} .text-pretty::before {
              content: "${escapedContent}";

              display: block !important;
              visibility: visible !important;
              font-size: 1.75rem !important;
              line-height: 1.4 !important;
              font-weight: 600 !important;
              color: currentColor !important;

              white-space: pre-wrap !important;
              text-align: center !important;
              width: 100% !important;

              margin: 0 auto !important;
              padding: 0 !important;
            }

            ${manualClickable ? `
            ${selectorH1} {
              cursor: pointer !important;
              user-select: none !important;
            }` : ''}

            @media (max-width: 768px) {
              ${selectorH1} .text-pretty::before {
                font-size: 1.25rem !important;
                line-height: 1.3 !important;
              }
            }
        `
    });
})();

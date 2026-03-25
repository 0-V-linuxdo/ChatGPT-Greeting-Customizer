// ==UserScript==
// @name                 [DeepSeek] Greeting Customizer [20260325] v1.0.0
// @name:zh-CN           [DeepSeek] 问候语自定义 [20260325] v1.0.0
// @namespace            https://github.com/0-V-linuxdo/AI-Greeting-Customizer
// @description          Personalize DeepSeek home greetings! Features multiple text management, random/sequential rotation, and manual/auto switching.
// @description:zh-CN    自定义 DeepSeek 首页问候语！支持多文案列表管理、随机/顺序轮播以及手动/自动切换。
// @version              [20260325] v1.0.0
// @update-log           [20260325] v1.0.0 迁移核心代码至统一仓库 (AI-Greeting-Customizer)，优化脚本资源加载与后续维护稳定性。
// @match                https://chat.deepseek.com/*
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
        selectorText: 'svg[viewBox="0 0 35 26"] + span',
        selectorH1:   'div:has(> svg[viewBox="0 0 35 26"] + span)',

        // ---- GM 存储 key ----
        keyGreetings: 'gc_greetings_v1',
        keySettings:  'gc_settings_v1',
        keyState:     'gc_state_v1',

        // ---- 首页判断 ----
        isHome: () => location.pathname === '/' || location.pathname === '',

        // ---- CSS 生成（只修改字体大小，不动字体） ----
        buildGreetingCss: (selectorText, selectorH1, escapedContent, settings, manualClickable) => `
            /* 隐藏原始文本节点，但保留容器占位 */
            ${selectorText} {
              font-size: 0 !important;
              line-height: 0 !important;
              visibility: hidden !important;
            }

            /* 注入伪元素显示新文字 */
            ${selectorText}::before {
              content: "${escapedContent}";

              display: block !important;
              visibility: visible !important;
              font-size: 1.75rem !important;
              line-height: 1.4 !important;

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
              ${selectorText}::before {
                font-size: 1.25rem !important;
                line-height: 1.3 !important;
              }
            }
        `
    });
})();

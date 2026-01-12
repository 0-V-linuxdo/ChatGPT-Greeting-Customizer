// ==UserScript==
// @name                 [ChatGPT] Greeting Customizer [20260112] v1.0.0
// @name:zh-CN           [ChatGPT] 问候语自定义 [20260112] v1.0.0
// @namespace            http://tampermonkey.net/
// @description          Replace the ChatGPT home greeting with your own custom text.
// @description:zh-CN    将 ChatGPT 首页问候语换成自定义文案！
//
// @version              [20260112] v1.0.0
//
// @match                https://chatgpt.com/*
//
// @grant                GM_addStyle
// @run-at               document-start
// ==/UserScript==

(function() {
    'use strict';

    // 使用 \a 实现 CSS 内部换行，对应文本中的 "—" 之前
    const line1 = "Ask not what your country can do for you";
    const line2 = "— ask what you can do for your country.";

    const css = `
        /* 隐藏原始文本节点，但保留容器占位 */
        h1.text-page-header .text-pretty {
            font-size: 0 !important;
            line-height: 0 !important;
            visibility: hidden !important;
            display: block !important; /* 确保占满宽度以便居中 */
        }

        /* 注入伪元素显示新文字 */
        h1.text-page-header .text-pretty::before {
            content: "${line1}\\a${line2}";

            /* 样式恢复与优化 */
            display: block !important;
            visibility: visible !important;
            font-size: 1.75rem !important; /* 调整为适合双行的大小 */
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

        /* 针对移动端/窄屏的适配 */
        @media (max-width: 768px) {
            h1.text-page-header .text-pretty::before {
                font-size: 1.25rem !important;
                line-height: 1.3 !important;
            }
        }
    `;

    if (typeof GM_addStyle !== 'undefined') {
        GM_addStyle(css);
    } else {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }
})();

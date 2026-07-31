// assets/js/theme.js
(function () {
    'use strict';

    var STORAGE_KEY = 'theme-mode';
    var BG_STORAGE_KEY = 'site-bg';
    var BG_OPTIONS = ['paper', 'gradient', 'clean'];
    var DEFAULT_BG = 'paper';

    // ===== 存储函数 =====
    function getStoredMode() {
        try {
            return window.localStorage.getItem(STORAGE_KEY) || 'dark';
        } catch (e) {
            return 'dark';
        }
    }

    function setStoredMode(mode) {
        try {
            window.localStorage.setItem(STORAGE_KEY, mode);
        } catch (e) { }
    }

    function getStoredBg() {
        try {
            var v = window.localStorage.getItem(BG_STORAGE_KEY);
            return BG_OPTIONS.indexOf(v) !== -1 ? v : DEFAULT_BG;
        } catch (e) {
            return DEFAULT_BG;
        }
    }

    function setStoredBg(bg) {
        try {
            window.localStorage.setItem(BG_STORAGE_KEY, bg);
        } catch (e) { }
    }

    // ===== 更新按钮状态 =====
    function updateToggleState(mode) {
        var toggle = document.querySelector('.theme-toggle:not(.fl-placeholder)');
        var icon = toggle ? toggle.querySelector('.theme-toggle__icon') : null;

        if (toggle && icon) {
            if (mode === 'light') {
                icon.src = toggle.dataset.iconSun || icon.src;
                toggle.setAttribute('aria-label', '切换到深色模式');
                toggle.setAttribute('aria-pressed', 'true');
            } else {
                icon.src = toggle.dataset.iconMoon || icon.src;
                toggle.setAttribute('aria-label', '切换到浅色模式');
                toggle.setAttribute('aria-pressed', 'false');
            }
        }
    }

    // ===== 切换主题 =====
    function toggleTheme() {
        var currentMode = getStoredMode();
        var nextMode = currentMode === 'light' ? 'dark' : 'light';
        applyTheme(nextMode);
    }

    function applyTheme(mode) {
        // 设置 data-theme 属性
        document.documentElement.setAttribute('data-theme', mode);
        
        // 更新 body 类（兼容旧版）
        if (mode === 'light') {
            document.body.classList.add('theme-light');
        } else {
            document.body.classList.remove('theme-light');
        }

        updateToggleState(mode);
        setStoredMode(mode);

        window.dispatchEvent(new CustomEvent('theme-change', {
            detail: { mode: mode }
        }));
    }

    // ===== 背景切换 =====
    function applyBg(bg) {
        document.documentElement.setAttribute('data-bg', bg);
        document.querySelectorAll('.bg-btn').forEach(function (btn) {
            btn.classList.toggle('is-active', btn.dataset.bg === bg);
        });
        setStoredBg(bg);
        window.dispatchEvent(new CustomEvent('site-bg-change', {
            detail: { bg: bg }
        }));
    }

    // ===== 绑定切换按钮 =====
    function bindToggle() {
        var toggle = document.querySelector('.theme-toggle');
        if (!toggle) return;

        // 移除旧监听器避免重复绑定
        toggle.removeEventListener('click', bindToggle._handler);
        
        bindToggle._handler = function (e) {
            e.preventDefault();
            toggleTheme();
        };
        
        toggle.addEventListener('click', bindToggle._handler);
    }

    // ===== 绑定背景选择器 =====
    function bindBgSelector() {
        var selector = document.querySelector('.bg-selector');
        if (!selector) return;

        selector.addEventListener('click', function (e) {
            var btn = e.target.closest('.bg-btn');
            if (!btn) return;
            applyBg(btn.dataset.bg);
        });
    }

    // ===== 初始化 =====
    function init() {
        // 清理任何残留的灯光遮罩
        var oldOverlays = document.querySelectorAll('.flashlight-overlay, .downlight-overlay');
        oldOverlays.forEach(function(el) { el.remove(); });
        var oldSources = document.querySelectorAll('.downlight-source');
        oldSources.forEach(function(el) { el.remove(); });
        document.body.classList.remove('flashlight-mode');

        bindToggle();
        bindBgSelector();

        var selector = document.querySelector('.bg-selector');
        if (selector) {
            selector.hidden = false;
        }

        // 恢复背景设置
        applyBg(getStoredBg());

        // 恢复主题
        var mode = getStoredMode();
        applyTheme(mode);

        // 暴露 API
        window.theme = {
            toggle: toggleTheme,
            set: applyTheme,
            get: getStoredMode,
            bg: {
                set: applyBg,
                get: getStoredBg
            }
        };
    }

    // ===== 启动 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

})();

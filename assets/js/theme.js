// assets/js/theme.js
(function () {
    var STORAGE_KEY = 'flashlight-mode';
    var BG_STORAGE_KEY = 'site-bg';
    var MODE_ON = 'on';
    var MODE_OFF = 'off';
    var BG_OPTIONS = ['paper', 'gradient', 'clean'];
    var DEFAULT_BG = 'paper';

    var floatingEls = [];

    function getStoredMode() {
        try {
            return window.localStorage.getItem(STORAGE_KEY) === MODE_ON ? MODE_ON : MODE_OFF;
        } catch (e) {
            return MODE_OFF;
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

    function createOverlay() {
        if (document.querySelector('.flashlight-overlay')) return;

        var overlay = document.createElement('div');
        overlay.className = 'flashlight-overlay';
        
        // 创建三角形光照容器
        var lightContainer = document.createElement('div');
        lightContainer.className = 'light-container';
        
        // 创建三角形光照
        var lightBeam = document.createElement('div');
        lightBeam.className = 'light-beam';
        
        lightContainer.appendChild(lightBeam);
        overlay.appendChild(lightContainer);
        document.body.appendChild(overlay);
        document.body.classList.add('flashlight-mode');

        // 不再浮动按钮，改为按钮保持在原位但添加特殊样式
        var toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            toggle.classList.add('light-toggle-active');
        }

        // 更新按钮状态
        updateToggleState(MODE_ON);

        window.addEventListener('resize', updateLightPosition);
        window.addEventListener('scroll', updateLightPosition, { passive: true });
        
        // 初始更新位置
        setTimeout(updateLightPosition, 50);
    }

    function removeOverlay() {
        var overlay = document.querySelector('.flashlight-overlay');
        if (overlay) overlay.remove();
        document.body.classList.remove('flashlight-mode');

        var toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            toggle.classList.remove('light-toggle-active');
        }

        updateToggleState(MODE_OFF);

        window.removeEventListener('resize', updateLightPosition);
        window.removeEventListener('scroll', updateLightPosition);
    }

    function updateLightPosition() {
        var overlay = document.querySelector('.flashlight-overlay');
        if (!overlay) return;
        
        var lightContainer = overlay.querySelector('.light-container');
        if (!lightContainer) return;
        
        // 获取按钮位置
        var toggle = document.querySelector('.theme-toggle:not(.fl-placeholder)');
        if (!toggle) return;
        
        var rect = toggle.getBoundingClientRect();
        var centerX = rect.left + rect.width / 2;
        var centerY = rect.top + rect.height / 2;
        
        // 更新光照位置
        lightContainer.style.setProperty('--light-x', centerX + 'px');
        lightContainer.style.setProperty('--light-y', centerY + 'px');
        
        // 更新光束锥体的起始位置
        var beam = overlay.querySelector('.light-beam');
        if (beam) {
            beam.style.setProperty('--beam-top', (centerY + rect.height / 2) + 'px');
            beam.style.setProperty('--beam-left', centerX + 'px');
        }
    }

    function updateToggleState(mode) {
        var toggle = document.querySelector('.theme-toggle:not(.fl-placeholder)');
        var icon = toggle ? toggle.querySelector('.theme-toggle__icon') : null;

        if (toggle && icon) {
            if (mode === MODE_ON) {
                icon.src = toggle.dataset.iconSun;
                toggle.setAttribute('aria-label', '关闭吊顶灯');
                toggle.setAttribute('aria-pressed', 'true');
            } else {
                icon.src = toggle.dataset.iconMoon;
                toggle.setAttribute('aria-label', '打开吊顶灯');
                toggle.setAttribute('aria-pressed', 'false');
            }
        }
    }

    function applyMode(mode) {
        if (mode === MODE_ON) {
            createOverlay();
        } else {
            removeOverlay();
        }

        setStoredMode(mode);

        window.dispatchEvent(new CustomEvent('flashlight-mode-change', {
            detail: { mode: mode }
        }));
    }

    function applyBg(bg) {
        document.documentElement.setAttribute('data-bg', bg);
        document.querySelectorAll('.bg-btn').forEach(function (btn) {
            btn.classList.toggle('is-active', btn.dataset.bg === bg);
        });
        window.dispatchEvent(new CustomEvent('site-bg-change', {
            detail: { bg: bg }
        }));
    }

    function bindToggle() {
        var toggle = document.querySelector('.theme-toggle');
        if (!toggle) return;

        toggle.addEventListener('click', function () {
            var next = getStoredMode() === MODE_ON ? MODE_OFF : MODE_ON;
            applyMode(next);
        });
    }

    function bindBgSelector() {
        var selector = document.querySelector('.bg-selector');
        if (!selector) return;

        selector.addEventListener('click', function (e) {
            var btn = e.target.closest('.bg-btn');
            if (!btn) return;
            applyBg(btn.dataset.bg);
            setStoredBg(btn.dataset.bg);
        });
    }

    function init() {
        bindToggle();
        bindBgSelector();

        var selector = document.querySelector('.bg-selector');
        if (selector) {
            selector.hidden = false;
        }

        applyBg(getStoredBg());
        
        // 恢复模式状态
        var mode = getStoredMode();
        if (mode === MODE_ON) {
            // 延迟创建以确保DOM已完全加载
            setTimeout(function() {
                createOverlay();
                setTimeout(updateLightPosition, 100);
            }, 100);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
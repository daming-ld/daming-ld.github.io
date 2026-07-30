// assets/js/theme.js
(function () {
    var STORAGE_KEY = 'flashlight-mode';
    var BG_STORAGE_KEY = 'site-bg';
    var MODE_ON = 'on';
    var MODE_OFF = 'off';
    var BG_OPTIONS = ['paper', 'gradient', 'clean'];
    var DEFAULT_BG = 'paper';

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
        
        // 创建筒灯光束容器
        var lightContainer = document.createElement('div');
        lightContainer.className = 'downlight-container';
        
        // 创建光束
        var lightBeam = document.createElement('div');
        lightBeam.className = 'downlight-beam';
        
        // 创建光晕
        var lightGlow = document.createElement('div');
        lightGlow.className = 'downlight-glow';
        
        lightContainer.appendChild(lightBeam);
        lightContainer.appendChild(lightGlow);
        overlay.appendChild(lightContainer);
        document.body.appendChild(overlay);
        document.body.classList.add('flashlight-mode');

        var toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            toggle.classList.add('downlight-active');
        }

        updateToggleState(MODE_ON);

        window.addEventListener('resize', updateLightPosition);
        window.addEventListener('scroll', updateLightPosition, { passive: true });
        
        setTimeout(updateLightPosition, 50);
    }

    function removeOverlay() {
        var overlay = document.querySelector('.flashlight-overlay');
        if (overlay) overlay.remove();
        document.body.classList.remove('flashlight-mode');

        var toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            toggle.classList.remove('downlight-active');
        }

        updateToggleState(MODE_OFF);

        window.removeEventListener('resize', updateLightPosition);
        window.removeEventListener('scroll', updateLightPosition);
    }

    function updateLightPosition() {
        var overlay = document.querySelector('.flashlight-overlay');
        if (!overlay) return;
        
        var toggle = document.querySelector('.theme-toggle:not(.fl-placeholder)');
        if (!toggle) return;
        
        var rect = toggle.getBoundingClientRect();
        var centerX = rect.left + rect.width / 2;
        var centerY = rect.top + rect.height / 2;
        
        // 更新光源位置（筒灯位置）
        var container = overlay.querySelector('.downlight-container');
        if (container) {
            container.style.setProperty('--light-x', centerX + 'px');
            container.style.setProperty('--light-y', (centerY + rect.height / 2) + 'px');
            container.style.setProperty('--light-width', rect.width + 'px');
            container.style.setProperty('--light-height', rect.height + 'px');
        }
    }

    function updateToggleState(mode) {
        var toggle = document.querySelector('.theme-toggle:not(.fl-placeholder)');
        var icon = toggle ? toggle.querySelector('.theme-toggle__icon') : null;

        if (toggle && icon) {
            if (mode === MODE_ON) {
                icon.src = toggle.dataset.iconSun;
                toggle.setAttribute('aria-label', '关闭筒灯');
                toggle.setAttribute('aria-pressed', 'true');
            } else {
                icon.src = toggle.dataset.iconMoon;
                toggle.setAttribute('aria-label', '打开筒灯');
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
        
        var mode = getStoredMode();
        if (mode === MODE_ON) {
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
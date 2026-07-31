// assets/js/theme.js
(function () {
    'use strict';

    var STORAGE_KEY = 'flashlight-mode';
    var BG_STORAGE_KEY = 'site-bg';
    var MODE_ON = 'on';
    var MODE_OFF = 'off';
    var BG_OPTIONS = ['paper', 'gradient', 'clean'];
    var DEFAULT_BG = 'paper';

    // ===== 筒灯核心状态 =====
    var downlight = {
        isOn: false,
        overlay: null,
        sourceEl: null,
        intervalId: null,
        config: {
            angle: 45,
            darkOpacity: 0.92
        }
    };

    // ===== 存储函数 =====
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

    // ===== 更新按钮状态 =====
    function updateToggleState(mode) {
        var toggle = document.querySelector('.theme-toggle:not(.fl-placeholder)');
        var icon = toggle ? toggle.querySelector('.theme-toggle__icon') : null;

        if (toggle && icon) {
            if (mode === MODE_ON) {
                icon.src = toggle.dataset.iconSun || icon.src;
                toggle.setAttribute('aria-label', '关闭筒灯');
                toggle.setAttribute('aria-pressed', 'true');
                toggle.classList.add('downlight-active');
            } else {
                icon.src = toggle.dataset.iconMoon || icon.src;
                toggle.setAttribute('aria-label', '打开筒灯');
                toggle.setAttribute('aria-pressed', 'false');
                toggle.classList.remove('downlight-active');
            }
        }
    }

    // ===== 创建筒灯遮罩（唯一的遮罩） =====
    function createOverlay() {
        // 如果已经存在遮罩，不重复创建
        if (downlight.overlay) return;
        if (document.querySelector('.flashlight-overlay')) return;
        if (document.querySelector('.downlight-overlay')) return;

        // ---- 1. 移除任何旧的冲突遮罩 ----
        var oldFlashlight = document.querySelector('.flashlight-overlay');
        if (oldFlashlight) oldFlashlight.remove();
        var oldDownlight = document.querySelector('.downlight-overlay');
        if (oldDownlight) oldDownlight.remove();

        // ---- 2. 创建主容器 ----
        var overlay = document.createElement('div');
        overlay.className = 'flashlight-overlay downlight-overlay';
        overlay.id = 'downlight-overlay';

        // ---- 3. 创建 SVG 遮罩 ----
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'downlight-svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';

        var maskId = 'downlight-mask-' + Date.now();

        // 遮罩
        var mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        mask.setAttribute('id', maskId);

        // 白色背景 → 全部可见
        var bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('width', '100');
        bgRect.setAttribute('height', '100');
        bgRect.setAttribute('fill', 'white');
        mask.appendChild(bgRect);

        // 锥形光束核心 → 黑色 = 透明（露出内容）
        var beam = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        beam.setAttribute('id', 'downlight-beam');
        beam.setAttribute('fill', 'black');
        mask.appendChild(beam);

        // 边缘羽化层
        var beamSoft = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        beamSoft.setAttribute('id', 'downlight-beam-soft');
        beamSoft.setAttribute('fill', 'rgba(0,0,0,0.3)');
        mask.appendChild(beamSoft);

        // 光晕
        var glow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        glow.setAttribute('id', 'downlight-glow');
        glow.setAttribute('fill', 'rgba(255, 255, 220, 0.12)');
        mask.appendChild(glow);

        svg.appendChild(mask);

        // 深色遮罩矩形
        var darkRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        darkRect.setAttribute('width', '100');
        darkRect.setAttribute('height', '100');
        darkRect.setAttribute('fill', 'rgba(0, 0, 0, ' + downlight.config.darkOpacity + ')');
        darkRect.setAttribute('mask', 'url(#' + maskId + ')');
        svg.appendChild(darkRect);

        overlay.appendChild(svg);

        // ---- 4. 光源装饰 ----
        var sourceEl = document.createElement('div');
        sourceEl.className = 'downlight-source';

        var sourceGlow = document.createElement('div');
        sourceGlow.className = 'downlight-source__glow';
        sourceEl.appendChild(sourceGlow);

        var sourceRing = document.createElement('div');
        sourceRing.className = 'downlight-source__ring';
        sourceEl.appendChild(sourceRing);

        // ---- 5. 添加到页面 ----
        document.body.appendChild(overlay);
        document.body.appendChild(sourceEl);

        // 保存引用
        downlight.overlay = overlay;
        downlight.sourceEl = sourceEl;
        downlight.isOn = true;

        document.body.classList.add('flashlight-mode');

        // ---- 6. 更新按钮 ----
        var toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            toggle.classList.add('downlight-active');
        }
        updateToggleState(MODE_ON);

        // ---- 7. 启动位置更新 ----
        updateBeamPosition();

        window.addEventListener('resize', updateBeamPosition);
        window.addEventListener('scroll', updateBeamPosition, { passive: true });

        // 持续更新
        if (downlight.intervalId) {
            clearInterval(downlight.intervalId);
        }
        downlight.intervalId = setInterval(updateBeamPosition, 100);

        // 触发事件
        window.dispatchEvent(new CustomEvent('downlight:on'));
        window.dispatchEvent(new CustomEvent('flashlight-mode-change', {
            detail: { mode: MODE_ON }
        }));
    }

    // ===== 移除遮罩 =====
    function removeOverlay() {
        if (downlight.overlay) {
            downlight.overlay.remove();
            downlight.overlay = null;
        }
        if (downlight.sourceEl) {
            downlight.sourceEl.remove();
            downlight.sourceEl = null;
        }
        if (downlight.intervalId) {
            clearInterval(downlight.intervalId);
            downlight.intervalId = null;
        }

        document.body.classList.remove('flashlight-mode');

        var toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            toggle.classList.remove('downlight-active');
        }

        downlight.isOn = false;
        updateToggleState(MODE_OFF);

        window.removeEventListener('resize', updateBeamPosition);
        window.removeEventListener('scroll', updateBeamPosition);

        window.dispatchEvent(new CustomEvent('downlight:off'));
        window.dispatchEvent(new CustomEvent('flashlight-mode-change', {
            detail: { mode: MODE_OFF }
        }));
    }

    // ===== 更新光束位置 =====
    function updateBeamPosition() {
        var beam = document.getElementById('downlight-beam');
        var beamSoft = document.getElementById('downlight-beam-soft');
        var glow = document.getElementById('downlight-glow');
        if (!beam) return;

        var centerX = 50;
        var topY = 0;
        var angle = downlight.config.angle || 45;
        var halfAngle = angle / 2;
        var radians = halfAngle * Math.PI / 180;

        // 动态计算底部高度
        var scrollHeight = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            document.documentElement.clientHeight,
            window.innerHeight
        );
        var bottomY = Math.max(110, (scrollHeight / window.innerHeight) * 100 + 20);

        var height = bottomY - topY;
        var halfWidth = height * Math.tan(radians);

        // 核心光束
        var corePoints = [
            centerX, topY,
            centerX - halfWidth * 0.85, bottomY,
            centerX + halfWidth * 0.85, bottomY
        ];
        beam.setAttribute('points', corePoints.join(','));

        // 羽化层
        if (beamSoft) {
            var softPoints = [
                centerX, topY,
                centerX - halfWidth * 1.3, bottomY,
                centerX + halfWidth * 1.3, bottomY
            ];
            beamSoft.setAttribute('points', softPoints.join(','));
        }

        // 光晕
        if (glow) {
            glow.setAttribute('cx', centerX + '%');
            glow.setAttribute('cy', topY + '%');
            glow.setAttribute('rx', (halfWidth * 1.8) + '%');
            glow.setAttribute('ry', (height * 0.25) + '%');
        }
    }

    // ===== 切换模式 =====
    function toggleMode() {
        var currentMode = getStoredMode();
        var nextMode = currentMode === MODE_ON ? MODE_OFF : MODE_ON;

        if (nextMode === MODE_ON) {
            createOverlay();
        } else {
            removeOverlay();
        }

        setStoredMode(nextMode);
    }

    // ===== 应用模式（外部调用） =====
    function applyMode(mode) {
        if (mode === MODE_ON) {
            createOverlay();
        } else {
            removeOverlay();
        }
        setStoredMode(mode);
    }

    // ===== 背景切换 =====
    function applyBg(bg) {
        document.documentElement.setAttribute('data-bg', bg);
        document.querySelectorAll('.bg-btn').forEach(function (btn) {
            btn.classList.toggle('is-active', btn.dataset.bg === bg);
        });
        window.dispatchEvent(new CustomEvent('site-bg-change', {
            detail: { bg: bg }
        }));
    }

    // ===== 绑定切换按钮 =====
    function bindToggle() {
        var toggle = document.querySelector('.theme-toggle');
        if (!toggle) return;

        // 移除所有已有的事件监听器（使用新函数替换）
        toggle.removeEventListener('click', bindToggle._handler);
        
        bindToggle._handler = function (e) {
            e.preventDefault();
            toggleMode();
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
            setStoredBg(btn.dataset.bg);
        });
    }

    // ===== 暴露全局 API =====
    function exposeAPI() {
        window.Downlight = {
            config: downlight.config,
            state: {
                get isOn() { return downlight.isOn; }
            },
            create: createOverlay,
            destroy: removeOverlay,
            toggle: toggleMode,
            updateBeam: updateBeamPosition
        };

        // 兼容旧版 theme.js API
        window.flashlight = {
            on: createOverlay,
            off: removeOverlay,
            toggle: toggleMode,
            isOn: function() { return downlight.isOn; }
        };
    }

    // ===== 初始化 =====
    function init() {
        // 清理任何残留遮罩
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

        applyBg(getStoredBg());

        // 恢复状态
        var mode = getStoredMode();
        if (mode === MODE_ON) {
            setTimeout(function() {
                createOverlay();
                setTimeout(updateBeamPosition, 50);
            }, 150);
        } else {
            updateToggleState(MODE_OFF);
        }

        exposeAPI();
    }

    // ===== 启动 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

})();

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
        // 已有同类遮罩时不再创建，避免与其他脚本重复
        if (document.querySelector('.flashlight-overlay') || document.querySelector('.downlight-overlay')) return;

        var overlay = document.createElement('div');
        overlay.className = 'flashlight-overlay';
        
        // 创建筒灯遮罩 - 使用SVG或canvas实现锥形镂空
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'downlight-svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('preserveAspectRatio', 'none');
        
        // 创建遮罩
        var mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        mask.setAttribute('id', 'downlight-mask');
        
        // 白色背景 - 表示可见区域
        var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100');
        rect.setAttribute('height', '100');
        rect.setAttribute('fill', 'white');
        mask.appendChild(rect);
        
        // 锥形光束区域 - 黑色表示透明（可见）
        var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('id', 'light-polygon');
        polygon.setAttribute('fill', 'black');
        mask.appendChild(polygon);
        
        svg.appendChild(mask);
        
        // 应用遮罩的矩形
        var maskedRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        maskedRect.setAttribute('width', '100');
        maskedRect.setAttribute('height', '100');
        maskedRect.setAttribute('fill', 'rgba(0,0,0,0.92)');
        maskedRect.setAttribute('mask', 'url(#downlight-mask)');
        svg.appendChild(maskedRect);
        
        overlay.appendChild(svg);
        document.body.appendChild(overlay);
        document.body.classList.add('flashlight-mode');

        var toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            toggle.classList.add('downlight-active');
        }

        updateToggleState(MODE_ON);

        // 更新光束位置
        window.addEventListener('resize', updateLightPosition);
        window.addEventListener('scroll', updateLightPosition, { passive: true });
        
        setTimeout(updateLightPosition, 50);
        // 持续更新位置
        setInterval(updateLightPosition, 100);
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
        var polygon = document.getElementById('light-polygon');
        if (!polygon) return;
        
        var viewportHeight = window.innerHeight;
        var viewportWidth = window.innerWidth;
        
        // 筒灯在屏幕顶部居中
        var centerX = 50; // 百分比
        var topY = 0; // 从顶部开始
        
        // 锥体角度 - 45度
        var angle = 45;
        var halfAngle = angle / 2;
        var radians = halfAngle * Math.PI / 180;
        
        // 计算锥体底部宽度
        // 从顶部到底部，锥体越来越宽
        var bottomY = 100; // 延伸到页面底部
        var height = bottomY - topY;
        var halfWidth = height * Math.tan(radians);
        
        // 锥体顶点在顶部居中
        var points = [
            centerX, topY,                          // 顶点（顶部居中）
            centerX - halfWidth, bottomY,           // 左下
            centerX + halfWidth, bottomY            // 右下
        ];
        
        // 添加边缘羽化效果（稍微扩大锥体范围，使用渐变透明度）
        var spread = 1.3; // 扩展系数，让边缘有羽化
        var halfWidthSoft = height * Math.tan(radians * spread);
        
        // 使用多个三角形叠加实现渐变边缘
        // 核心区域（完全透明/可见）
        var corePoints = [
            centerX, topY,
            centerX - halfWidth * 0.9, bottomY,
            centerX + halfWidth * 0.9, bottomY
        ];
        
        // 过渡区域（半透明）
        var softPoints = [
            centerX, topY,
            centerX - halfWidth * 1.2, bottomY,
            centerX + halfWidth * 1.2, bottomY
        ];
        
        // 更新SVG多边形 - 使用多层实现羽化
        polygon.setAttribute('points', corePoints.join(','));
        
        // 添加第二层半透明锥体实现羽化
        var existingSoft = document.getElementById('light-polygon-soft');
        if (!existingSoft) {
            var mask = document.getElementById('downlight-mask');
            var softPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            softPolygon.setAttribute('id', 'light-polygon-soft');
            softPolygon.setAttribute('fill', 'rgba(0,0,0,0.3)'); // 半透明，实现羽化
            mask.appendChild(softPolygon);
            existingSoft = softPolygon;
        }
        existingSoft.setAttribute('points', softPoints.join(','));
        
        // 添加光晕效果（在锥体顶点）
        var glow = document.querySelector('.downlight-glow-svg');
        if (!glow) {
            glow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            glow.setAttribute('class', 'downlight-glow-svg');
            glow.setAttribute('fill', 'rgba(255, 255, 220, 0.15)');
            var mask = document.getElementById('downlight-mask');
            mask.appendChild(glow);
        }
        glow.setAttribute('cx', centerX + '%');
        glow.setAttribute('cy', topY + '%');
        glow.setAttribute('rx', (halfWidth * 1.5) + '%');
        glow.setAttribute('ry', (height * 0.3) + '%');
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

        // If Downlight (flash.js) is present, delegate toggle to it to avoid duplicate overlays
        if (window.Downlight && typeof window.Downlight.toggle === 'function') {
            toggle.addEventListener('click', function () {
                window.Downlight.toggle();
                // sync stored mode
                var next = window.Downlight && window.Downlight.state && window.Downlight.state.isOn ? MODE_ON : MODE_OFF;
                setStoredMode(next);
                updateToggleState(next);
            });
            return;
        }

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
            // If Downlight (flash.js) exists, use it instead of creating a second overlay
            if (window.Downlight && typeof window.Downlight.create === 'function') {
                setTimeout(function() {
                    window.Downlight.create();
                    setTimeout(updateLightPosition, 100);
                }, 100);
            } else {
                setTimeout(function() {
                    createOverlay();
                    setTimeout(updateLightPosition, 100);
                }, 100);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();

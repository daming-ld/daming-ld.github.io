// assets/js/flashlight.js
// 主题切换按钮：点击后图标切为 moon.svg，并开启跟随鼠标的局部放大镜效果。
// 整页（含导航栏）都会进入放大镜画面，无淡出处理。
(function () {
    'use strict';

    var ZOOM = 1.8;
    var ICON_SUN = 'assets/icon/sun.svg';
    var ICON_MOON = 'assets/icon/moon.svg';

    var active = false;
    var lens = null;
    var content = null;
    var lastX = 0;
    var lastY = 0;
    var lensW = 240;
    var lensH = 240;

    function findButton() {
        return document.querySelector('.site-header .theme-toggle');
    }

    function findIcon(btn) {
        return btn ? btn.querySelector('.theme-toggle__icon') : null;
    }

    function removeNodes(nodes) {
        nodes.forEach(function (node) {
            if (node && node.parentNode) node.parentNode.removeChild(node);
        });
    }

    function getScroll() {
        return {
            x: window.pageXOffset || document.documentElement.scrollLeft || 0,
            y: window.pageYOffset || document.documentElement.scrollTop || 0
        };
    }

    // 导航栏是 position: fixed，无法在克隆的文档坐标系内正确放大，
    // 这里按它当前在视口中的位置，换算成文档坐标并改为绝对定位。
    function syncCloneHeader() {
        if (!content) return;
        var cloneHeader = content.querySelector('.site-header');
        var realHeader = document.querySelector('.site-header');
        if (!cloneHeader || !realHeader) return;
        var rect = realHeader.getBoundingClientRect();
        var scroll = getScroll();
        cloneHeader.style.position = 'absolute';
        cloneHeader.style.top = (rect.top + scroll.y) + 'px';
        cloneHeader.style.left = (rect.left + scroll.x) + 'px';
        cloneHeader.style.transform = 'none';
        cloneHeader.style.backdropFilter = 'none';
        cloneHeader.style.webkitBackdropFilter = 'none';
    }

    function buildLens() {
        var clone = document.body.cloneNode(true);
        removeNodes(clone.querySelectorAll(
            '.magnifier-lens, script'
        ));

        lens = document.createElement('div');
        lens.className = 'magnifier-lens';
        lens.setAttribute('aria-hidden', 'true');

        content = document.createElement('div');
        content.className = 'magnifier-lens__content';
        content.style.width = (document.documentElement.scrollWidth || 0) + 'px';
        content.style.height = (document.documentElement.scrollHeight || 0) + 'px';
        content.appendChild(clone);

        lens.appendChild(content);
        document.body.appendChild(lens);

        syncCloneHeader();
    }

    function measureLens() {
        if (!lens) return;
        var rect = lens.getBoundingClientRect();
        lensW = rect.width || 240;
        lensH = rect.height || 240;
    }

    function positionAt(x, y) {
        if (!lens || !content) return;
        var scroll = getScroll();
        lens.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)';
        content.style.transform =
            'translate(' + (lensW / 2 - (x + scroll.x) * ZOOM) + 'px,' +
            (lensH / 2 - (y + scroll.y) * ZOOM) + 'px) scale(' + ZOOM + ')';
    }

    function setButtonState(btn, on) {
        if (!btn) return;
        var icon = findIcon(btn);
        if (icon) icon.setAttribute('src', on ? ICON_MOON : ICON_SUN);
        btn.classList.toggle('downlight-active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.setAttribute('aria-label', on ? '关闭放大镜' : '切换主题');
    }

    function activate() {
        if (active) return;
        active = true;
        buildLens();
        measureLens();
        positionAt(lastX, lastY);
        document.body.classList.add('magnifier-active');
        setButtonState(findButton(), true);
    }

    function deactivate() {
        if (!active) return;
        active = false;
        document.body.classList.remove('magnifier-active');
        setButtonState(findButton(), false);
        if (lens) {
            lens.parentNode && lens.parentNode.removeChild(lens);
            lens = null;
            content = null;
        }
    }

    function toggle() {
        active ? deactivate() : activate();
    }

    function init() {
        var btn = findButton();
        if (!btn) return;

        lastX = window.innerWidth / 2;
        lastY = window.innerHeight / 2;

        btn.addEventListener('click', function (event) {
            event.preventDefault();
            toggle();
        });

        document.addEventListener('mousemove', function (event) {
            lastX = event.clientX;
            lastY = event.clientY;
            if (active) positionAt(lastX, lastY);
        }, { passive: true });

        window.addEventListener('scroll', function () {
            if (!active) return;
            syncCloneHeader();
            positionAt(lastX, lastY);
        }, { passive: true });

        window.addEventListener('resize', function () {
            if (!active) return;
            measureLens();
            syncCloneHeader();
            positionAt(lastX, lastY);
        }, { passive: true });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && active) deactivate();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();

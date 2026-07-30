/**
 * 筒灯效果 - 独立模块
 * 使用方法：
 *   1. 在页面中引入此JS文件
 *   2. 确保页面中有 .theme-toggle 按钮
 *   3. 调用 Downlight.init() 初始化
 */
;(function(global) {
    'use strict';

    var Downlight = {
        // 配置
        config: {
            storageKey: 'downlight-mode',
            modeOn: 'on',
            modeOff: 'off',
            angle: 45,           // 光束角度（度）
            darkOpacity: 0.92,   // 黑暗遮罩透明度
            sourceGlowColor: 'rgba(255, 255, 220, 0.9)'
        },

        // 状态
        state: {
            isOn: false,
            overlay: null,
            sourceEl: null,
            animFrameId: null
        },

        // ===== 初始化 =====
        init: function(options) {
            // 合并配置
            if (options) {
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        this.config[key] = options[key];
                    }
                }
            }

            // 绑定按钮事件
            var toggle = document.querySelector('.theme-toggle');
            if (toggle) {
                toggle.addEventListener('click', this.toggle.bind(this));
            }

            // 恢复状态
            var mode = this.getStoredMode();
            if (mode === this.config.modeOn) {
                setTimeout(function() {
                    this.create();
                    setTimeout(this.updateBeam.bind(this), 100);
                }.bind(this), 200);
            } else {
                this.updateToggleState(this.config.modeOff);
            }
        },

        // ===== 获取存储状态 =====
        getStoredMode: function() {
            try {
                return localStorage.getItem(this.config.storageKey) === this.config.modeOn 
                    ? this.config.modeOn 
                    : this.config.modeOff;
            } catch (e) {
                return this.config.modeOff;
            }
        },

        setStoredMode: function(mode) {
            try {
                localStorage.setItem(this.config.storageKey, mode);
            } catch (e) {}
        },

        // ===== 更新按钮状态 =====
        updateToggleState: function(mode) {
            var toggle = document.querySelector('.theme-toggle');
            var icon = toggle ? toggle.querySelector('.theme-toggle__icon') : null;

            if (toggle && icon) {
                if (mode === this.config.modeOn) {
                    icon.src = toggle.dataset.iconSun;
                    toggle.setAttribute('aria-label', '关闭筒灯');
                    toggle.setAttribute('aria-pressed', 'true');
                    toggle.classList.add('downlight-active');
                } else {
                    icon.src = toggle.dataset.iconMoon;
                    toggle.setAttribute('aria-label', '打开筒灯');
                    toggle.setAttribute('aria-pressed', 'false');
                    toggle.classList.remove('downlight-active');
                }
            }
        },

        // ===== 创建筒灯 =====
        create: function() {
            // 如果已经创建过 Downlight，直接返回
            if (this.state.overlay) return;

            // 如果存在 theme.js 创建的旧遮罩，先移除它，避免遮罩覆盖筒灯
            var oldFlashlight = document.querySelector('.flashlight-overlay');
            if (oldFlashlight) {
                oldFlashlight.remove();
            }

            // 1. 创建 SVG 遮罩容器
            var overlay = document.createElement('div');
            overlay.className = 'downlight-overlay';
            overlay.id = 'downlight-overlay';

            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 100 100');
            svg.setAttribute('preserveAspectRatio', 'none');

            // 2. 创建遮罩
            var maskId = 'downlight-mask-' + Date.now();
            var mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
            mask.setAttribute('id', maskId);

            // 白色背景 → 全部可见
            var bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bgRect.setAttribute('width', '100');
            bgRect.setAttribute('height', '100');
            bgRect.setAttribute('fill', 'white');
            mask.appendChild(bgRect);

            // 锥形光束区域 → 黑色 = 透明（露出内容）
            var beam = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            beam.setAttribute('id', 'downlight-beam');
            beam.setAttribute('fill', 'black');
            mask.appendChild(beam);

            // 边缘羽化层
            var beamSoft = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            beamSoft.setAttribute('id', 'downlight-beam-soft');
            beamSoft.setAttribute('fill', 'rgba(0,0,0,0.3)');
            mask.appendChild(beamSoft);

            svg.appendChild(mask);

            // 3. 应用遮罩的深色矩形
            var darkRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            darkRect.setAttribute('width', '100');
            darkRect.setAttribute('height', '100');
            darkRect.setAttribute('fill', 'rgba(0, 0, 0, ' + this.config.darkOpacity + ')');
            darkRect.setAttribute('mask', 'url(#' + maskId + ')');
            svg.appendChild(darkRect);

            overlay.appendChild(svg);
            document.body.appendChild(overlay);

            // 4. 光源装饰
            var sourceEl = document.createElement('div');
            sourceEl.className = 'downlight-source';

            var glow = document.createElement('div');
            glow.className = 'downlight-source__glow';
            sourceEl.appendChild(glow);

            var ring = document.createElement('div');
            ring.className = 'downlight-source__ring';
            sourceEl.appendChild(ring);

            document.body.appendChild(sourceEl);

            // 保存引用
            this.state.overlay = overlay;
            this.state.sourceEl = sourceEl;

            // 5. 更新光束
            this.updateBeam();

            // 监听窗口变化
            window.addEventListener('resize', this.updateBeam.bind(this));
            window.addEventListener('scroll', this.updateBeam.bind(this));

            this.updateToggleState(this.config.modeOn);
            this.state.isOn = true;

            // 触发自定义事件
            var event = new CustomEvent('downlight:on');
            document.dispatchEvent(event);
        },

        // ===== 移除筒灯 =====
        destroy: function() {
            if (this.state.overlay) {
                this.state.overlay.remove();
                this.state.overlay = null;
            }
            if (this.state.sourceEl) {
                this.state.sourceEl.remove();
                this.state.sourceEl = null;
            }

            this.updateToggleState(this.config.modeOff);
            this.state.isOn = false;

            window.removeEventListener('resize', this.updateBeam.bind(this));
            window.removeEventListener('scroll', this.updateBeam.bind(this));

            // 触发自定义事件
            var event = new CustomEvent('downlight:off');
            document.dispatchEvent(event);
        },

        // ===== 切换 =====
        toggle: function() {
            var currentMode = this.getStoredMode();
            var nextMode = currentMode === this.config.modeOn 
                ? this.config.modeOff 
                : this.config.modeOn;

            if (nextMode === this.config.modeOn) {
                this.create();
            } else {
                this.destroy();
            }

            this.setStoredMode(nextMode);
        },

        // ===== 更新光束位置 =====
        updateBeam: function() {
            var beam = document.getElementById('downlight-beam');
            var beamSoft = document.getElementById('downlight-beam-soft');
            if (!beam) return;

            var centerX = 50;
            var topY = 0;
            var angle = this.config.angle || 45;
            var halfAngle = angle / 2;
            var radians = halfAngle * Math.PI / 180;
            
            // ===== 动态计算高度 =====
            var scrollHeight = Math.max(
                document.documentElement.scrollHeight,
                document.body.scrollHeight,
                document.documentElement.clientHeight,
                window.innerHeight
            );
            // 转换为 viewBox 百分比（viewBox 是 0-100）
            // 假设页面高度对应 viewBox 的 100，但我们要覆盖更多
            var bottomY = Math.max(110, (scrollHeight / window.innerHeight) * 100 + 20);
            
            var height = bottomY - topY;
            var halfWidth = height * Math.tan(radians);

            var corePoints = [
                centerX, topY,
                centerX - halfWidth * 0.85, bottomY,
                centerX + halfWidth * 0.85, bottomY
            ];
            beam.setAttribute('points', corePoints.join(','));

            if (beamSoft) {
                var softPoints = [
                    centerX, topY,
                    centerX - halfWidth * 1.3, bottomY,
                    centerX + halfWidth * 1.3, bottomY
                ];
                beamSoft.setAttribute('points', softPoints.join(','));
            }
        }
    };

    // ===== 暴露到全局 =====
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Downlight;
    } else {
        global.Downlight = Downlight;
    }

})(typeof window !== 'undefined' ? window : this);

(function () {
    const navItems = [
        { label: '首页', href: 'index.html' },
        { label: '关于', href: 'about.html' },
        { label: '项目', href: 'projects.html' },
        { label: '文章', href: 'posts.html' }
    ];

    function normalizePath(value) {
        return String(value || '').replace(/^\/+|\/+$/g, '').replace(/\\/g, '/');
    }

    function getCurrentPage() {
        const pathname = normalizePath(window.location.pathname || '');
        if (!pathname || pathname.endsWith('/')) {
            return 'index.html';
        }

        const segments = pathname.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1] || 'index.html';

        return lastSegment.includes('.') ? lastSegment : 'index.html';
    }

    function getActiveHref() {
        const bodySection = document.body && document.body.dataset && document.body.dataset.section;
        const currentPage = getCurrentPage();

        if (bodySection) {
            const sectionMatch = navItems.find((item) => normalizePath(item.href) === bodySection);
            if (sectionMatch) return sectionMatch.href;
        }

        const exactMatch = navItems.find((item) => normalizePath(item.href) === currentPage);
        if (exactMatch) return exactMatch.href;

        if (currentPage === 'index.html') {
            return 'index.html';
        }

        return null;
    }

    function isPostDetailPage() {
        const pathname = normalizePath(window.location.pathname || '');
        const last = pathname.split('/').filter(Boolean).pop() || 'index.html';
        if (last !== 'post.html') return false;
        try {
            return !!(window.location.search && new URLSearchParams(window.location.search).get('file'));
        } catch (error) {
            return false;
        }
    }

    function renderHeader() {
        const mountPoint = document.querySelector('[data-site-nav]');
        if (!mountPoint) return;

        const activeHref = getActiveHref();
        const postPage = isPostDetailPage();

        mountPoint.innerHTML = `
            <svg class="liquid-glass-defs" aria-hidden="true" width="0" height="0" focusable="false">
                <defs>
                    <filter id="liquid-glass-distortion" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
                        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="1" seed="7" result="noise" />
                        <feGaussianBlur in="noise" stdDeviation="0.8" result="soft-noise" />
                        <feDisplacementMap in="SourceGraphic" in2="soft-noise" scale="14" xChannelSelector="R" yChannelSelector="G" result="distorted" />
                        <feGaussianBlur in="distorted" stdDeviation="0.2" result="smoothed" />
                        <feComposite in="smoothed" in2="SourceAlpha" operator="in" />
                    </filter>
                </defs>
            </svg>
            <header class="site-header">
                <nav class="nav">
                    <button class="top-btn${postPage ? ' post-back-btn' : ''}" type="button" aria-label="${postPage ? '返回文章列表' : '回到顶部'}"${postPage ? ' data-back-url="posts.html"' : ''}>
                        <img class="top-btn__icon" src="assets/icon/top.svg" alt="" aria-hidden="true">
                    </button>
                    <button class="theme-toggle" type="button" aria-label="切换主题" aria-pressed="false">
                        <img class="theme-toggle__icon" src="assets/icon/sun.svg" alt="" aria-hidden="true">
                    </button>
                    <div class="nav-links">
                        ${navItems.map((item) => {
                            const isActive = item.href === activeHref;
                            return `<a href="${item.href}"${isActive ? ' class="active" aria-current="page"' : ''}>${item.label}</a>`;
                        }).join('')}
                        <div class="nav-indicator"></div>
                    </div>
                    <span class="nav-reading-title"></span>
                    <div class="bg-selector" hidden>
                        <button class="bg-btn" data-bg="paper" aria-label="纸张纹理背景" style="--dot-color: #E2D8CA;"><span class="bg-btn__dot"></span></button>
                        <button class="bg-btn" data-bg="gradient" aria-label="渐变光晕背景" style="--dot-color: #C4956A;"><span class="bg-btn__dot"></span></button>
                        <button class="bg-btn" data-bg="clean" aria-label="极简纯白背景" style="--dot-color: #E8E4DD;"><span class="bg-btn__dot"></span></button>
                    </div>
                </nav>
            </header>
        `;
    }

    renderHeader();
})();

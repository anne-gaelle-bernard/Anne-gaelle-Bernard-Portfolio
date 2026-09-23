document.documentElement.classList.add('js');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Navbar: background on scroll + mobile menu
(function () {
    const navbar = document.getElementById('navbar');
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('navbar-nav');
    if (!navbar || !toggle || !menu) return;

    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const setOpen = (open) => {
        menu.classList.toggle('open', open);
        navbar.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    };

    toggle.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setOpen(false);
    });
})();

// Highlight the nav link of the section in view
(function () {
    const links = document.querySelectorAll('.navbar-nav a[href^="#"]');
    const sections = [...links]
        .map((link) => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);
    if (!('IntersectionObserver' in window) || !sections.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            links.forEach((link) => {
                link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
            });
        });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach((section) => observer.observe(section));
})();

// Reveal elements on scroll
(function () {
    const items = document.querySelectorAll('.reveal');
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        items.forEach((el) => el.classList.add('visible'));
        return;
    }

    // Stagger siblings inside grids
    document.querySelectorAll('.skills-grid, .projects-grid, .hero-content').forEach((group) => {
        group.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--delay', (i * 0.1) + 's'));
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    items.forEach((el) => observer.observe(el));
})();

// Hero background: connected particle constellation
(function () {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || !canvas.getContext) return;

    const ctx = canvas.getContext('2d');
    const hero = canvas.parentElement;
    const mouse = { x: -9999, y: -9999 };
    let width, height, particles, rafId;

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = hero.clientWidth;
        height = hero.clientHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = Math.min(90, Math.floor((width * height) / 14000));
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            r: Math.random() * 1.6 + 0.6
        }));
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        const maxDist = 130;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            // Gentle push away from the cursor
            const mdx = p.x - mouse.x;
            const mdy = p.y - mouse.y;
            const md = Math.hypot(mdx, mdy);
            if (md < 120 && md > 0) {
                p.x += (mdx / md) * 1.2;
                p.y += (mdy / md) * 1.2;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 193, 7, 0.75)';
            ctx.fill();

            for (let j = i + 1; j < particles.length; j++) {
                const q = particles[j];
                const d = Math.hypot(p.x - q.x, p.y - q.y);
                if (d < maxDist) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.strokeStyle = 'rgba(255, 180, 60, ' + (0.18 * (1 - d / maxDist)) + ')';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
    }

    function loop() {
        draw();
        rafId = requestAnimationFrame(loop);
    }

    resize();
    if (prefersReducedMotion) {
        draw();
    } else {
        loop();
    }

    window.addEventListener('resize', () => {
        resize();
        if (prefersReducedMotion) draw();
    });

    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', () => {
        mouse.x = -9999;
        mouse.y = -9999;
    });

    // Pause the animation when the hero is off screen
    if ('IntersectionObserver' in window && !prefersReducedMotion) {
        new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                if (!rafId) loop();
            } else {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }).observe(hero);
    }
})();

// Footer year
(function () {
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
})();

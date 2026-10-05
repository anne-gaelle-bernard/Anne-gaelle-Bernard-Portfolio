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
    document.querySelectorAll('.projects-grid, .hero-content').forEach((group) => {
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

// Cassette card: tracks, counter and transport keys
(function () {
    const tape = document.querySelector('.tape');
    const tracks = [...document.querySelectorAll('#tape-tracks li')];
    const counter = document.getElementById('tape-counter');
    const play = document.getElementById('tape-play');
    if (!tape || !tracks.length || !counter || !play) return;

    let current = 0;
    let timer = null;
    let counterAnim = null;

    function animateCounter(target) {
        cancelAnimationFrame(counterAnim);
        const from = parseInt(counter.textContent, 10) || 0;
        if (prefersReducedMotion) {
            counter.textContent = String(target).padStart(3, '0');
            return;
        }
        const start = performance.now();
        const step = (now) => {
            const t = Math.min((now - start) / 600, 1);
            const value = Math.round(from + (target - from) * (1 - Math.pow(1 - t, 3)));
            counter.textContent = String(value).padStart(3, '0');
            if (t < 1) counterAnim = requestAnimationFrame(step);
        };
        counterAnim = requestAnimationFrame(step);
    }

    function select(index) {
        current = (index + tracks.length) % tracks.length;
        tracks.forEach((li, i) => li.classList.toggle('active', i === current));
        animateCounter(parseInt(tracks[current].querySelector('button').dataset.count, 10));
    }

    function setPlaying(on) {
        clearInterval(timer);
        tape.classList.toggle('playing', on);
        play.innerHTML = on
            ? '<i class="fas fa-pause"></i><span>Pause</span>'
            : '<i class="fas fa-play"></i><span>Play</span>';
        play.setAttribute('aria-label', on ? 'Pause' : 'Lecture');
        if (on) timer = setInterval(() => select(current + 1), 2600);
    }

    function press(btn) {
        btn.classList.add('pressed');
        setTimeout(() => btn.classList.remove('pressed'), 120);
    }

    tracks.forEach((li, i) => li.querySelector('button').addEventListener('click', () => {
        select(i);
        setPlaying(false);
    }));

    play.addEventListener('click', () => setPlaying(!tape.classList.contains('playing')));
    document.getElementById('tape-ff').addEventListener('click', (e) => { press(e.currentTarget); select(current + 1); });
    document.getElementById('tape-rew').addEventListener('click', (e) => { press(e.currentTarget); select(current - 1); });
    document.getElementById('tape-stop').addEventListener('click', (e) => {
        press(e.currentTarget);
        setPlaying(false);
        select(0);
    });

    select(0);
})();

// Skills spec sheet: accessible tabs
(function () {
    const tabs = [...document.querySelectorAll('.spec-tabs [role="tab"]')];
    if (!tabs.length) return;

    function activate(tab) {
        tabs.forEach((t) => {
            const selected = t === tab;
            t.setAttribute('aria-selected', String(selected));
            t.tabIndex = selected ? 0 : -1;
            document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
        });
        // Replay the slot-in animation, staggered
        document.querySelectorAll('#' + tab.getAttribute('aria-controls') + ' .modules li').forEach((li, i) => {
            li.style.animation = 'none';
            void li.offsetWidth;
            li.style.animation = '';
            li.style.animationDelay = (i * 0.04) + 's';
        });
    }

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => activate(tab));
        tab.addEventListener('keydown', (e) => {
            const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
            if (!dir) return;
            const next = tabs[(i + dir + tabs.length) % tabs.length];
            next.focus();
            activate(next);
        });
    });
})();

// Contact terminal: choose a line, then Return opens a pre-filled email
(function () {
    const options = [...document.querySelectorAll('#screen-options [role="option"]')];
    const returnKey = document.getElementById('screen-return');
    if (!options.length || !returnKey) return;

    let current = 0;

    function select(index, focus) {
        current = (index + options.length) % options.length;
        options.forEach((opt, i) => {
            opt.setAttribute('aria-selected', String(i === current));
            opt.tabIndex = i === current ? 0 : -1;
        });
        if (focus) options[current].focus();
    }

    function send() {
        returnKey.classList.add('pressed');
        setTimeout(() => returnKey.classList.remove('pressed'), 120);
        const subject = encodeURIComponent(options[current].dataset.subject);
        window.location.href = 'mailto:bernarsanne@gmail.com?subject=' + subject;
    }

    options.forEach((opt, i) => {
        opt.addEventListener('click', () => select(i));
        opt.addEventListener('dblclick', send);
        opt.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); select(current + 1, true); }
            if (e.key === 'ArrowUp') { e.preventDefault(); select(current - 1, true); }
            if (e.key === 'Enter') { e.preventDefault(); send(); }
            if (['1', '2', '3'].includes(e.key)) select(Number(e.key) - 1, true);
        });
    });

    returnKey.addEventListener('click', send);
})();

// Footer year
(function () {
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
})();

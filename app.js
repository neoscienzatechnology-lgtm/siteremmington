/* ============================================================================
   Remington · Home — Interactions
   Lenis smooth scroll + GSAP/ScrollTrigger for reveals, parallax mockups,
   animated counters, header shadow, mobile drawer and cursor spotlight.
   ============================================================================ */
(function () {
    'use strict';

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

    /* ---------- Page loader ---------- */
    window.addEventListener('load', () => {
        const loader = document.querySelector('[data-loader]');
        if (!loader) return;
        setTimeout(() => loader.classList.add('is-gone'), 800);
    });

    /* ---------- Current year ---------- */
    const year = document.getElementById('y');
    if (year) year.textContent = new Date().getFullYear();

    /* ---------- Header: scroll state ---------- */
    const header = document.querySelector('[data-header]');
    const onScroll = () => {
        if (!header) return;
        header.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    let lastScrollY = window.scrollY;
    const syncHeaderState = () => {
        if (!header) return;
        const y = window.scrollY;
        if (y !== lastScrollY) {
            header.classList.toggle('is-scrolled', y > 24);
            lastScrollY = y;
        }
        requestAnimationFrame(syncHeaderState);
    };
    requestAnimationFrame(syncHeaderState);

    /* ---------- Mobile drawer ---------- */
    const burger = document.querySelector('[data-burger]');
    const drawer = document.querySelector('[data-drawer]');
    if (burger && drawer) {
        burger.addEventListener('click', () => {
            const open = drawer.classList.toggle('is-open');
            burger.classList.toggle('is-open', open);
            drawer.setAttribute('aria-hidden', !open);
            document.body.style.overflow = open ? 'hidden' : '';
        });
        drawer.querySelectorAll('[data-close]').forEach(a => {
            a.addEventListener('click', () => {
                drawer.classList.remove('is-open');
                burger.classList.remove('is-open');
                drawer.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            });
        });
    }

    /* ---------- Smooth scroll with Lenis ---------- */
    let lenis;
    if (!reduced && window.Lenis) {
        lenis = new Lenis({
            duration: 1.15,
            easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            smoothTouch: false,
        });

        // Keep header state in sync when scroll is driven by Lenis transforms.
        lenis.on('scroll', onScroll);

        const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);

        // anchor clicks
        document.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', (e) => {
                const id = a.getAttribute('href');
                if (!id || id === '#') return;
                const target = document.querySelector(id);
                if (!target) return;
                e.preventDefault();
                lenis.scrollTo(target, { offset: -80, duration: 1.2 });
            });
        });
    }

    /* ---------- GSAP integration ---------- */
    if (window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);

        if (lenis) {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => lenis.raf(time * 1000));
            gsap.ticker.lagSmoothing(0);
        }
    }

    /* ---------- Line-reveal ready flag ---------- */
    document.documentElement.classList.add('is-lines-ready');

    /* ---------- In-view observer (CSS transitions) ---------- */
    const inViewEls = document.querySelectorAll('[data-reveal], [data-reveal-lines], [data-reveal-stagger], [data-reveal-card]');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
        inViewEls.forEach(el => io.observe(el));
    } else {
        inViewEls.forEach(el => el.classList.add('in-view'));
    }

    /* ---------- Animated counters ---------- */
    const counters = document.querySelectorAll('[data-counter]');
    if ('IntersectionObserver' in window) {
        const counterIO = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                const target = parseFloat(el.dataset.counter);
                const dur = 1400;
                const start = performance.now();
                const from = 0;
                const step = (now) => {
                    const t = Math.min((now - start) / dur, 1);
                    const eased = 1 - Math.pow(1 - t, 3);
                    const val = Math.round(from + (target - from) * eased);
                    el.textContent = val;
                    if (t < 1) requestAnimationFrame(step);
                    else el.textContent = target;
                };
                requestAnimationFrame(step);
                counterIO.unobserve(el);
            });
        }, { threshold: 0.5 });
        counters.forEach(el => counterIO.observe(el));
    }

    /* ---------- Mockup parallax (hero only, desktop) ---------- */
    if (isDesktop && !reduced && window.gsap && window.ScrollTrigger) {
        const stage = document.querySelector('[data-parallax-stage]');
        if (stage) {
            const items = stage.querySelectorAll('[data-parallax]');
            items.forEach(el => {
                const speed = parseFloat(el.dataset.parallax) || 0;
                gsap.to(el, {
                    y: () => window.innerHeight * speed,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: stage,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: true,
                    }
                });
            });

            // Pointer-driven subtle tilt on mockups (desktop)
            stage.addEventListener('mousemove', (e) => {
                const r = stage.getBoundingClientRect();
                const cx = (e.clientX - r.left - r.width / 2) / r.width;
                const cy = (e.clientY - r.top - r.height / 2) / r.height;
                items.forEach(el => {
                    const power = parseFloat(el.dataset.parallax) || 0.08;
                    gsap.to(el, {
                        x: cx * 20 * Math.sign(power),
                        rotateY: cx * 4,
                        rotateX: -cy * 4,
                        duration: 1,
                        ease: 'power3.out',
                        overwrite: 'auto'
                    });
                });
            });
            stage.addEventListener('mouseleave', () => {
                items.forEach(el => gsap.to(el, { x: 0, rotateX: 0, rotateY: 0, duration: 1, ease: 'power3.out' }));
            });
        }

        /* Showcase mockups — subtle float on scroll */
        gsap.utils.toArray('.showcase__mockup .mockup').forEach((m) => {
            gsap.fromTo(m,
                { y: 40, rotateZ: m.classList.contains('mockup--phone') ? -6 : 0 },
                {
                    y: -40,
                    rotateZ: m.classList.contains('mockup--phone') ? -2 : 0,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: m,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: true,
                    }
                }
            );
        });
    }

    /* ---------- Cursor spotlight (desktop only) ---------- */
    if (isDesktop && !reduced) {
        const spot = document.querySelector('[data-spotlight]');
        if (spot) {
            let x = window.innerWidth / 2, y = window.innerHeight / 2;
            let tx = x, ty = y;
            const follow = () => {
                tx += (x - tx) * 0.18;
                ty += (y - ty) * 0.18;
                spot.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
                requestAnimationFrame(follow);
            };
            requestAnimationFrame(follow);
            window.addEventListener('mousemove', (e) => {
                x = e.clientX; y = e.clientY;
                spot.classList.add('is-visible');
            });
            window.addEventListener('mouseleave', () => spot.classList.remove('is-visible'));
        }
    }

    /* ---------- Hero parallax on mouse (non-stage floats) ---------- */
    if (isDesktop && !reduced) {
        const floats = document.querySelectorAll('.hero__glow');
        window.addEventListener('mousemove', (e) => {
            const cx = (e.clientX / window.innerWidth - 0.5) * 2;
            const cy = (e.clientY / window.innerHeight - 0.5) * 2;
            floats.forEach((el, i) => {
                const power = i === 0 ? 30 : -20;
                el.style.transform = `translate(${cx * power}px, ${cy * power}px)`;
            });
        });
    }

})();

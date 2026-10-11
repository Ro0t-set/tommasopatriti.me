/**
 * Tommaso Patriti Portfolio
 * Language, modal and visual interactions
 */

(function() {
    'use strict';

    const isMobileViewport = () => window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)').matches;

    // ==========================================================================
    // Language Switcher
    // ==========================================================================
    
    const LANG_KEY = 'portfolio-lang';
    const DEFAULT_LANG = 'it';
    
    function getInitialLanguage() {
        const saved = localStorage.getItem(LANG_KEY);
        if (saved && ['it', 'en'].includes(saved)) {
            return saved;
        }
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang && browserLang.startsWith('en')) {
            return 'en';
        }
        return DEFAULT_LANG;
    }
    
    function applyLanguage(lang) {
        document.querySelectorAll('[data-it][data-en]').forEach(el => {
            const text = el.getAttribute(`data-${lang}`);
            if (text) {
                el.textContent = text;
            }
        });
        
        document.documentElement.lang = lang;
        updateMetaTags(lang);
        
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        
        localStorage.setItem(LANG_KEY, lang);
    }
    
    function updateMetaTags(lang) {
        // If <title> has per-page localizations via data-it/data-en, use those (sub-pages).
        // Otherwise fall back to the generic home-page title (legacy behavior).
        const titleEl = document.querySelector('title');
        if (titleEl && titleEl.dataset[lang]) {
            document.title = titleEl.dataset[lang];
        } else {
            const fallback = {
                it: 'Tommaso Patriti - Sviluppo Software e Applicazioni | Software Engineer Freelance Bologna',
                en: 'Tommaso Patriti - Software Development & Applications | Freelance Software Engineer Bologna'
            };
            document.title = fallback[lang];
        }

        // Same logic for meta description
        const descMeta = document.querySelector('meta[name="description"]');
        if (descMeta) {
            const perPageDesc = descMeta.dataset[lang];
            if (perPageDesc) {
                descMeta.content = perPageDesc;
            }
            // else: leave the static content already in HTML (server-rendered for the page)
        }
    }
    
    function initLanguage() {
        const initialLang = getInitialLanguage();
        applyLanguage(initialLang);
        
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                if (lang) {
                    applyLanguage(lang);
                }
            });
        });
    }

    // ==========================================================================
    // Modals
    // ==========================================================================
    
    function initModals() {
        const privacyLink = document.getElementById('privacyLink');
        const termsLink = document.getElementById('termsLink');
        const privacyModal = document.getElementById('privacyModal');
        const termsModal = document.getElementById('termsModal');
        const closePrivacy = document.getElementById('closePrivacy');
        const closeTerms = document.getElementById('closeTerms');
        
        function openModal(modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            lucide.createIcons();
        }
        
        function closeModal(modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        function openModalFromHash() {
            if (window.location.hash === '#privacy' && privacyModal) {
                openModal(privacyModal);
            }

            if (window.location.hash === '#terms' && termsModal) {
                openModal(termsModal);
            }
        }
        
        if (privacyLink && privacyModal) {
            privacyLink.addEventListener('click', (e) => {
                e.preventDefault();
                openModal(privacyModal);
            });
        }
        
        if (termsLink && termsModal) {
            termsLink.addEventListener('click', (e) => {
                e.preventDefault();
                openModal(termsModal);
            });
        }
        
        if (closePrivacy && privacyModal) {
            closePrivacy.addEventListener('click', () => closeModal(privacyModal));
        }
        
        if (closeTerms && termsModal) {
            closeTerms.addEventListener('click', () => closeModal(termsModal));
        }
        
        // Close on backdrop click
        [privacyModal, termsModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        closeModal(modal);
                    }
                });
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                [privacyModal, termsModal].forEach(modal => {
                    if (modal && modal.classList.contains('active')) {
                        closeModal(modal);
                    }
                });
            }
        });

        window.addEventListener('hashchange', openModalFromHash);
        openModalFromHash();
    }

    // ==========================================================================
    // Human / Machine Toggle
    // ==========================================================================

    function initAgentToggle() {
        const buttons = Array.from(document.querySelectorAll('[data-agent-view]'));
        const toggle = document.querySelector('.agent-toggle');
        const humanView = document.getElementById('human-view');
        const machineView = document.getElementById('machine-view');
        if (!buttons.length || !toggle || !humanView || !machineView) return;

        let currentView = 'human';
        const scrollPositions = { human: window.scrollY, machine: 0 };

        function setAgentView(view, updateUrl = true) {
            scrollPositions[currentView] = window.scrollY;
            currentView = view;
            const isMachine = view === 'machine';
            humanView.hidden = isMachine;
            machineView.hidden = !isMachine;
            document.body.classList.toggle('machine-mode', isMachine);

            buttons.forEach(button => {
                const isActive = button.dataset.agentView === view;
                button.setAttribute('aria-checked', String(isActive));
                button.tabIndex = isActive ? 0 : -1;
            });

            if (updateUrl) {
                const url = new URL(window.location.href);
                if (isMachine) url.searchParams.set('view', 'machine');
                else url.searchParams.delete('view');
                window.history.replaceState(window.history.state, '', url);
            }
            window.scrollTo({ top: scrollPositions[view], behavior: 'instant' });
            window.dispatchEvent(new Event('scroll'));
        }

        buttons.forEach((button, index) => {
            button.addEventListener('click', () => setAgentView(button.dataset.agentView));
            button.addEventListener('keydown', event => {
                let next;
                if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (index + 1) % buttons.length;
                else if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = (index - 1 + buttons.length) % buttons.length;
                else if (event.key === 'Home') next = 0;
                else if (event.key === 'End') next = buttons.length - 1;
                else return;
                event.preventDefault();
                setAgentView(buttons[next].dataset.agentView);
                buttons[next].focus({ preventScroll: true });
            });
        });

        if (new URLSearchParams(window.location.search).get('view') === 'machine') {
            setAgentView('machine', false);
        }
        toggle.hidden = false;
    }

    // ==========================================================================
    // Scroll Reveal Animations
    // ==========================================================================

    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger');

        if (!revealElements.length) return;

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -80px 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        revealElements.forEach(el => observer.observe(el));
    }

    // ==========================================================================
    // Nav — hairline & blur after scroll (all pages)
    // ==========================================================================

    function initNavScroll() {
        const nav = document.querySelector('.top-nav');
        if (!nav) return;

        const update = () => nav.classList.toggle('scrolled', window.scrollY > 24);
        update();
        window.addEventListener('scroll', update, { passive: true });
    }

    // ==========================================================================
    // Immersive scene engine (home only)
    // Sticky hero fly-through, pinned titles with zoom-through, card scrub,
    // conversion finale zoom, scene dots, progress hairline, glow parallax.
    // ==========================================================================

    function initCinematic() {
        if (!document.body.classList.contains('home')) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const progressBar = document.querySelector('.scroll-progress');

        // The full scrub engine performs many layout reads and transforms per
        // frame. Mobile gets a lightweight progress update and normal page flow.
        if (isMobileViewport() || document.body.classList.contains('poster-layout')) {
            let framePending = false;

            const updateProgress = () => {
                const max = document.documentElement.scrollHeight - window.innerHeight;
                const progress = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
                if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
                framePending = false;
            };

            const requestProgressUpdate = () => {
                if (framePending) return;
                framePending = true;
                requestAnimationFrame(updateProgress);
            };

            updateProgress();
            window.addEventListener('scroll', requestProgressUpdate, { passive: true });
            window.addEventListener('resize', requestProgressUpdate, { passive: true });
            return;
        }

        const heroScene = document.querySelector('.scene-sticky');
        const heroContent = document.querySelector('.hero-content');
        const heroVisual = document.querySelector('.hero-visual');
        const scrollHint = document.querySelector('.scroll-hint');
        const titleEls = Array.from(document.querySelectorAll('.section-title'));
        const finaleText = document.querySelector('.section--finale .section-text');
        const scrubEls = Array.from(document.querySelectorAll('.reveal-stagger > *'));
        const dots = Array.from(document.querySelectorAll('.scene-dots a'))
            .map(a => ({ link: a, el: document.getElementById(a.dataset.dot) }))
            .filter(d => d.el);

        const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);

        let target = window.scrollY;
        let smooth = target;
        let ticking = true;

        window.addEventListener('scroll', () => {
            target = window.scrollY;
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(loop);
            }
        }, { passive: true });

        function loop() {
            // Hidden sections have no geometry to use for cinematic transforms.
            if (document.body.classList.contains('machine-mode')) {
                ticking = false;
                return;
            }
            smooth += (target - smooth) * 0.12;
            if (Math.abs(target - smooth) < 0.05) smooth = target;

            const vh = window.innerHeight;

            // Progress hairline
            if (progressBar) {
                const max = document.documentElement.scrollHeight - vh;
                progressBar.style.transform = `scaleX(${max > 0 ? clamp(smooth / max, 0, 1) : 0})`;
            }

            // Ambient glow drifts with scroll (depth)
            document.body.style.setProperty('--glow-y', `${smooth * -0.12}px`);

            // Scene 1 — hero: camera flies into it, then through it
            if (heroScene && heroContent) {
                const range = heroScene.offsetHeight - vh;
                const hp = clamp(-heroScene.getBoundingClientRect().top / (range || 1), 0, 1);
                if (hp < 1) {
                    heroContent.style.transform = `scale(${1 + hp * 0.65}) translateY(${hp * -34}px)`;
                    heroContent.style.opacity = String(clamp(1 - hp * 1.7, 0, 1));
                    if (heroVisual) {
                        heroVisual.style.transform = `scale(${1 + hp * 0.35}) translateY(${hp * 80}px)`;
                        heroVisual.style.opacity = String(clamp(1 - hp * 2, 0, 1));
                    }
                }
                if (scrollHint) {
                    scrollHint.style.opacity = String(clamp(1 - hp * 5, 0, 1));
                }
            }

            // Pinned titles: gentle on arrival, dramatic zoom-through on exit
            titleEls.forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.bottom < -80 || r.top > vh + 80) return;
                const t = (r.top + r.height / 2 - vh * 0.5) / vh; // 0 = centered
                const scale = t < 0
                    ? clamp(1 + t * 0.16, 0.92, 1)
                    : clamp(1 + t * 0.55, 1, 1.28);
                const fade = 1 - clamp((Math.abs(t) - 0.4) / 0.3, 0, 1) * 0.9;
                el.style.transform = `scale(${scale})`;
                el.style.opacity = String(fade);
            });

            // Finale: the pitch grows toward the camera
            if (finaleText) {
                const r = finaleText.getBoundingClientRect();
                if (r.bottom > 0 && r.top < vh) {
                    const t = (r.top + r.height / 2 - vh * 0.5) / vh;
                    const scale = clamp(1 + t * 0.3, 0.86, 1.1);
                    const fade = 1 - clamp((Math.abs(t) - 0.42) / 0.3, 0, 1) * 0.9;
                    finaleText.style.transform = `scale(${scale})`;
                    finaleText.style.opacity = String(fade);
                }
            }

            // Card scrub reveals
            scrubEls.forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.bottom < -120 || r.top > vh + 120) return;
                const p = easeOut(clamp((vh - r.top) / (vh * 0.32), 0, 1));
                el.style.opacity = String(p);
                el.style.transform = `translateY(${(1 - p) * 44}px) scale(${0.94 + p * 0.06})`;
            });

            // Scene dots
            if (dots.length) {
                let current = dots[0];
                dots.forEach(d => {
                    if (d.el.getBoundingClientRect().top <= vh * 0.45) current = d;
                });
                dots.forEach(d => d.link.classList.toggle('active', d === current));
            }

            if (Math.abs(target - smooth) >= 0.05) {
                requestAnimationFrame(loop);
            } else {
                ticking = false;
            }
        }

        requestAnimationFrame(loop);
    }

    // ==========================================================================
    // Project strip: automatic movement with native and pointer-driven scrolling.
    // ==========================================================================

    function initProjectCarousel() {
        const section = document.querySelector('[data-project-carousel]');
        if (!section) return;

        const viewport = section.querySelector('.showcase-viewport');
        const track = viewport.querySelector('.showcase-track');
        const originalTiles = Array.from(track.children);
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        const friction = reduced.matches ? 0.008 : 0.0035;
        const autoSpeed = 28;
        let drag = null;
        let momentumFrame = 0;
        let autoFrame = 0;
        let autoLastTime = 0;
        let loopPeriod = 0;
        let touchActive = false;
        let touchNormalizeTimer;
        let resumeTimer;
        let suppressClick = false;
        let clearSuppressionTimer;

        function makeClone(tile) {
            const clone = tile.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            clone.tabIndex = -1;
            clone.draggable = false;
            clone.querySelectorAll('a, button, [tabindex]').forEach(element => {
                element.tabIndex = -1;
            });
            clone.querySelectorAll('a, img').forEach(element => {
                element.draggable = false;
            });
            return clone;
        }

        const beforeClones = document.createDocumentFragment();
        const afterClones = document.createDocumentFragment();
        for (let copy = 0; copy < 2; copy++) {
            originalTiles.forEach(tile => {
                beforeClones.append(makeClone(tile));
                afterClones.append(makeClone(tile));
            });
        }
        track.insertBefore(beforeClones, originalTiles[0]);
        track.append(afterClones);

        function measureLoopPeriod() {
            const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
            loopPeriod = originalTiles.reduce((width, tile) => width + tile.getBoundingClientRect().width, 0)
                + gap * originalTiles.length;
        }

        function normalizeLoop() {
            if (!loopPeriod) return 0;
            const before = viewport.scrollLeft;
            let normalized = before;
            const lowerBound = loopPeriod * 1.5;
            const upperBound = loopPeriod * 2.5;
            while (normalized < lowerBound) normalized += loopPeriod;
            while (normalized > upperBound) normalized -= loopPeriod;
            if (normalized !== before) viewport.scrollLeft = normalized;
            return normalized - before;
        }

        measureLoopPeriod();
        viewport.scrollLeft = loopPeriod * 2;
        window.addEventListener('resize', () => {
            measureLoopPeriod();
            normalizeLoop();
        });
        function scheduleTouchNormalize() {
            clearTimeout(touchNormalizeTimer);
            touchNormalizeTimer = setTimeout(() => {
                if (!touchActive) normalizeLoop();
            }, 260);
        }

        viewport.addEventListener('scroll', () => {
            if (touchActive) scheduleTouchNormalize();
            else normalizeLoop();
        }, { passive: true });

        function stopMomentum() {
            if (momentumFrame) cancelAnimationFrame(momentumFrame);
            momentumFrame = 0;
        }

        function stopAuto() {
            if (autoFrame) cancelAnimationFrame(autoFrame);
            autoFrame = 0;
            autoLastTime = 0;
            clearTimeout(resumeTimer);
        }

        function startAuto() {
            if (autoFrame) return;

            function step(time) {
                const elapsed = autoLastTime ? Math.min(time - autoLastTime, 50) : 0;
                autoLastTime = time;
                viewport.scrollLeft += autoSpeed * elapsed / 1000;
                normalizeLoop();
                autoFrame = requestAnimationFrame(step);
            }

            autoFrame = requestAnimationFrame(step);
        }

        function resumeAuto(delay = 1000) {
            clearTimeout(resumeTimer);
            resumeTimer = setTimeout(startAuto, delay);
        }

        function coast(velocity) {
            if (Math.abs(velocity) < 0.025) {
                resumeAuto();
                return;
            }
            let lastTime = 0;

            function step(time) {
                const elapsed = lastTime ? Math.min(time - lastTime, 40) : 0;
                lastTime = time;
                viewport.scrollLeft += velocity * elapsed;
                normalizeLoop();
                velocity *= Math.exp(-friction * elapsed);
                if (Math.abs(velocity) >= 0.025) {
                    momentumFrame = requestAnimationFrame(step);
                } else {
                    momentumFrame = 0;
                    resumeAuto();
                }
            }

            momentumFrame = requestAnimationFrame(step);
        }

        viewport.addEventListener('pointerdown', event => {
            stopAuto();
            stopMomentum();
            if (event.pointerType === 'touch') {
                clearTimeout(touchNormalizeTimer);
                normalizeLoop();
                touchActive = true;
                return;
            }
            if (event.button !== 0) return;
            drag = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                startScroll: viewport.scrollLeft,
                lastX: event.clientX,
                lastTime: performance.now(),
                velocity: 0,
                moved: false
            };
        });

        viewport.addEventListener('pointermove', event => {
            if (!drag || event.pointerId !== drag.pointerId) return;
            const deltaX = event.clientX - drag.startX;
            const deltaY = event.clientY - drag.startY;
            if (!drag.moved && Math.hypot(deltaX, deltaY) < 6) return;
            if (!drag.moved && Math.abs(deltaY) > Math.abs(deltaX)) {
                drag = null;
                return;
            }

            if (!drag.moved) {
                drag.moved = true;
                viewport.setPointerCapture(event.pointerId);
                viewport.classList.add('is-dragging');
            }

            event.preventDefault();
            const now = performance.now();
            const elapsed = now - drag.lastTime;
            if (elapsed > 0) drag.velocity = -(event.clientX - drag.lastX) / elapsed;
            drag.lastX = event.clientX;
            drag.lastTime = now;
            viewport.scrollLeft = drag.startScroll - deltaX;
            drag.startScroll += normalizeLoop();
        });

        function finishDrag(event, withMomentum) {
            if (!drag || event.pointerId !== drag.pointerId) return false;
            const shouldCoast = drag.moved && withMomentum;
            const velocity = drag.velocity;
            if (drag.moved) {
                viewport.classList.remove('is-dragging');
                suppressClick = true;
                clearTimeout(clearSuppressionTimer);
                clearSuppressionTimer = setTimeout(() => { suppressClick = false; }, 350);
            }
            drag = null;
            if (shouldCoast) coast(velocity);
            return true;
        }

        viewport.addEventListener('pointerup', event => {
            if (event.pointerType === 'touch') {
                touchActive = false;
                scheduleTouchNormalize();
            }
            if (!finishDrag(event, true)) resumeAuto(event.pointerType === 'touch' ? 2600 : 1400);
        });
        viewport.addEventListener('pointercancel', event => {
            if (event.pointerType === 'touch') {
                touchActive = false;
                scheduleTouchNormalize();
            }
            if (!finishDrag(event, false)) resumeAuto(event.pointerType === 'touch' ? 2600 : 1400);
        });
        viewport.addEventListener('lostpointercapture', event => {
            if (drag) finishDrag(event, false);
        });
        viewport.addEventListener('wheel', () => {
            stopAuto();
            stopMomentum();
            resumeAuto(1400);
        }, { passive: true });
        // Keep links clickable, but prevent the browser's native link ghost
        // from taking over when a pointer gesture is meant to scroll the strip.
        viewport.addEventListener('dragstart', event => event.preventDefault());
        viewport.addEventListener('click', event => {
            if (!suppressClick) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            suppressClick = false;
            clearTimeout(clearSuppressionTimer);
        }, true);
        viewport.addEventListener('keydown', e => {
            if (e.target !== viewport || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
            e.preventDefault();
            stopAuto();
            viewport.scrollLeft += e.key === 'ArrowRight'
                ? viewport.clientWidth * 0.75
                : -viewport.clientWidth * 0.75;
            normalizeLoop();
            resumeAuto(1400);
        });

        startAuto();
    }

    // Two coherent circular waves: contours of their summed displacement.
    function initHeroInterference() {
        const canvas = document.querySelector('.hero-waves');
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;
        const hero = canvas.closest('.hero');
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        const step = 8;
        let width = 0, height = 0, columns = 0, rows = 0;
        let first, second, field;
        let phase = 0, frame = 0, lastTime = 0;
        let visible = false;
        const crossings = new Float32Array(8);

        function draw() {
            if (!field) return;
            for (let i = 0; i < field.length; i++) {
                field[i] = Math.sin(first[i] - phase) + .88 * Math.sin(second[i] - phase + .7);
            }
            context.clearRect(0, 0, width, height);
            context.strokeStyle = '#ef6b2e';
            context.lineWidth = 1;
            // Follow the zero contour of the combined field, so wavefronts
            // bend and join around the stationary cancellation fringes.
            for (const level of [0]) {
                context.globalAlpha = .12;
                context.beginPath();
                for (let y = 0; y < rows - 1; y++) {
                    for (let x = 0; x < columns - 1; x++) {
                        const i = y * columns + x;
                        const a = field[i], b = field[i + 1];
                        const c = field[i + columns + 1], d = field[i + columns];
                        const mask = (a >= level ? 1 : 0) | (b >= level ? 2 : 0)
                            | (c >= level ? 4 : 0) | (d >= level ? 8 : 0);
                        if (mask === 0 || mask === 15) continue;
                        const left = x * step, top = y * step;
                        let count = 0;
                        function cross(x1, y1, x2, y2, v1, v2) {
                            if ((v1 >= level) === (v2 >= level)) return;
                            const t = (level - v1) / (v2 - v1);
                            crossings[count++] = x1 + t * (x2 - x1);
                            crossings[count++] = y1 + t * (y2 - y1);
                        }
                        cross(left, top, left + step, top, a, b);
                        cross(left + step, top, left + step, top + step, b, c);
                        cross(left + step, top + step, left, top + step, c, d);
                        cross(left, top + step, left, top, d, a);
                        function segment(p, q) {
                            context.moveTo(crossings[p], crossings[p + 1]);
                            context.lineTo(crossings[q], crossings[q + 1]);
                        }
                        if (count === 4) segment(0, 2);
                        else if ((a >= level) === ((a + b + c + d) / 4 >= level)) {
                            segment(0, 2);
                            segment(4, 6);
                        } else {
                            segment(0, 6);
                            segment(2, 4);
                        }
                    }
                }
                context.stroke();
            }
        }

        function resize() {
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            if (!width || !height) return;
            const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            columns = Math.ceil(width / step) + 1;
            rows = Math.ceil(height / step) + 1;
            first = new Float32Array(columns * rows);
            second = new Float32Array(columns * rows);
            field = new Float32Array(columns * rows);
            const k = 2 * Math.PI / Math.max(68, Math.min(96, width * .085));
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < columns; x++) {
                    const px = x * step, py = y * step, i = y * columns + x;
                    first[i] = k * Math.hypot(px + width * .27, py + height * .35);
                    second[i] = k * Math.hypot(px - width * .6, py + height * .22);
                }
            }
            draw();
            hero.classList.add('has-interference');
        }

        function animate(time) {
            frame = requestAnimationFrame(animate);
            if (!lastTime) lastTime = time;
            if (time - lastTime < 1000 / 12) return;
            phase = (phase + Math.min(time - lastTime, 150) * .00032) % (Math.PI * 2);
            lastTime = time;
            draw();
        }
        function syncAnimation() {
            cancelAnimationFrame(frame);
            frame = 0;
            lastTime = 0;
            if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(animate);
        }
        new ResizeObserver(resize).observe(canvas);
        new IntersectionObserver(entries => {
            visible = entries[0].isIntersecting;
            syncAnimation();
        }).observe(hero);
        reduced.addEventListener('change', syncAnimation);
        document.addEventListener('visibilitychange', syncAnimation);
        window.addEventListener('pagehide', () => cancelAnimationFrame(frame));
        window.addEventListener('pageshow', syncAnimation);
        resize();
    }

    // ==========================================================================
    // Card spotlight — cursor-following warm glow (home only, fine pointers)
    // ==========================================================================

    function initSpotlight() {
        if (!document.body.classList.contains('home')) return;
        if (!window.matchMedia('(pointer: fine)').matches) return;

        document.querySelectorAll('.freelance-card, .service-card, .project-card').forEach(card => {
            card.addEventListener('pointermove', (e) => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
                card.style.setProperty('--my', `${e.clientY - rect.top}px`);
            });
        });
    }

    // ==========================================================================
    // Initialize
    // ==========================================================================

    function init() {
        initLanguage();
        initModals();
        initAgentToggle();
        initScrollReveal();
        initNavScroll();
        initProjectCarousel();
        initCinematic();
        initHeroInterference();
        initSpotlight();

        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

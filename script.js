/**
 * Tommaso Patriti Portfolio
 * Theme, Language & Modal functionality
 */

(function() {
    'use strict';

    const isMobileViewport = () => window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)').matches;

    // ==========================================================================
    // Theme Toggle
    // ==========================================================================
    
    const THEME_KEY = 'portfolio-theme';
    
    function getInitialTheme() {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved && ['light', 'dark'].includes(saved)) {
            return saved;
        }
        return 'light';
    }
    
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
    }
    
    function initTheme() {
        const initialTheme = getInitialTheme();
        setTheme(initialTheme);
        
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme');
                setTheme(current === 'dark' ? 'light' : 'dark');
                lucide.createIcons();
            });
        }
    }

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
    // Interactive Terminal Animation
    // ==========================================================================

    const terminalCommands = [
        {
            cmd: 'whoami',
            output: '<span class="info">tommaso.patriti</span> — Software Engineer'
        },
        {
            cmd: 'cat skills.json | jq',
            output: '<span class="highlight">{</span> microservices, cloud, clean-code <span class="highlight">}</span>'
        },
        {
            cmd: 'docker ps --filter "status=running"',
            output: '<span class="success">3 services running</span> — API, Auth, Gateway'
        },
        {
            cmd: 'git log --oneline -1',
            output: '<span class="info">feat:</span> simplify over-engineered architecture'
        },
        {
            cmd: 'kubectl get pods -n production',
            output: '<span class="success">All pods healthy</span> — 99.9% uptime'
        }
    ];

    function initTerminal() {
        const commandEl = document.getElementById('terminalCommand');
        const outputEl = document.getElementById('terminalOutput');

        if (!commandEl || !outputEl) return;

        // Continuous typing mutates layout while scrolling. Keep the mobile hero
        // stable and reserve the animated terminal for larger viewports.
        if (isMobileViewport()) {
            commandEl.textContent = terminalCommands[0].cmd;
            outputEl.innerHTML = terminalCommands[0].output;
            outputEl.classList.add('visible');
            return;
        }

        let currentIndex = 0;

        function typeCommand(text, callback) {
            let i = 0;
            commandEl.textContent = '';
            outputEl.classList.remove('visible');
            outputEl.innerHTML = '';

            function type() {
                if (i < text.length) {
                    commandEl.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, 50 + Math.random() * 50);
                } else {
                    setTimeout(callback, 400);
                }
            }
            type();
        }

        function showOutput(html) {
            outputEl.innerHTML = html;
            outputEl.classList.add('visible');
        }

        function runSequence() {
            const current = terminalCommands[currentIndex];

            typeCommand(current.cmd, () => {
                showOutput(current.output);
                currentIndex = (currentIndex + 1) % terminalCommands.length;
                setTimeout(runSequence, 3000);
            });
        }

        setTimeout(runSequence, 1000);
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
        if (isMobileViewport()) {
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
        const pauseButton = section.querySelector('[data-carousel-toggle]');
        const directionButtons = section.querySelectorAll('[data-carousel-direction]');
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
        let autoPaused = false;

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
            if (autoFrame || autoPaused) return;

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
            if (autoPaused) return;
            resumeTimer = setTimeout(startAuto, delay);
        }

        pauseButton?.addEventListener('click', () => {
            autoPaused = !autoPaused;
            pauseButton.setAttribute('aria-pressed', String(autoPaused));
            pauseButton.textContent = autoPaused ? 'Riprendi' : 'Pausa';
            if (autoPaused) {
                stopAuto();
                stopMomentum();
            } else {
                startAuto();
            }
        });

        directionButtons.forEach(button => {
            button.addEventListener('click', () => {
                stopAuto();
                stopMomentum();
                const direction = Number(button.dataset.carouselDirection) || 1;
                viewport.scrollBy({ left: direction * viewport.clientWidth * 0.72, behavior: 'smooth' });
                resumeAuto(1800);
            });
        });

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
        initTheme();
        initLanguage();
        initModals();
        initAgentToggle();
        initTerminal();
        initScrollReveal();
        initNavScroll();
        initProjectCarousel();
        initCinematic();
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

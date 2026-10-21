/**
 * Analytics consent, Google Analytics and PostHog bootstrap.
 */
(function() {
    'use strict';

    const CONFIG = {
        consentKey: 'portfolio-cookie-consent-v2',
        gaMeasurementId: 'G-8JSLCWYJYF',
        adsId: 'AW-17681747905',
        contactConversions: {
            whatsapp: 'AW-17681747905/rXrwCNa3u6IdEMGfqO9B',
            phone: 'AW-17681747905/_1nsCNm3u6IdEMGfqO9B'
        },
        posthogToken: 'phc_xNhdREzHSmUE7d24JUju85GWxKw4iyjEPR8L2MpgajFT',
        posthogApiHost: 'https://eu.i.posthog.com',
        posthogUiHost: 'https://eu.posthog.com',
        posthogDefaults: '2026-05-30'
    };

    let analyticsInitialized = false;
    // Explicit QA mode: exercise the real contact handler without creating Ads
    // conversions or opening a phone/messaging app. Never persist this flag.
    const diagnosticMode = new URL(window.location.href).searchParams.get('analytics_debug') === '1';

    function safeLocalStorage() {
        try {
            return window.localStorage;
        } catch (error) {
            return null;
        }
    }

    function getConsent() {
        const storage = safeLocalStorage();
        if (!storage) return null;
        // Previous analytics-only consent does not authorize advertising measurement.
        return storage.getItem(CONFIG.consentKey) ||
            (storage.getItem('portfolio-cookie-consent') === 'rejected' ? 'rejected' : null);
    }

    function setConsent(value) {
        const storage = safeLocalStorage();
        if (storage) {
            storage.setItem(CONFIG.consentKey, value);
        }
    }

    function getLang() {
        const storage = safeLocalStorage();
        const saved = storage ? storage.getItem('portfolio-lang') : null;
        if (saved === 'en' || saved === 'it') {
            return saved;
        }
        return document.documentElement.lang === 'en' ? 'en' : 'it';
    }

    function copy() {
        return getLang() === 'en' ? {
            title: 'Cookie preferences',
            body: 'With your consent, we use Google Analytics, Google Ads and PostHog to measure visits and contact clicks, including those from ads. No personalized advertising. You can refuse or change your choice at any time.',
            accept: 'Accept',
            reject: 'Reject',
            privacy: 'Privacy & Cookie Policy',
            saved: 'Preference saved'
        } : {
            title: 'Preferenze cookie',
            body: 'Con il tuo consenso usiamo Google Analytics, Google Ads e PostHog per misurare visite e clic sui contatti, anche dagli annunci. Nessuna pubblicità personalizzata. Puoi rifiutare o modificare la scelta in qualsiasi momento.',
            accept: 'Accetta',
            reject: 'Rifiuta',
            privacy: 'Privacy & Cookie Policy',
            saved: 'Preferenza salvata'
        };
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.async = true;
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function initGoogleAnalytics() {
        const gaSrc = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.gaMeasurementId}`;

        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function() {
            window.dataLayer.push(arguments);
        };

        window.gtag('consent', 'default', {
            analytics_storage: 'denied', ad_storage: 'denied',
            ad_user_data: 'denied', ad_personalization: 'denied'
        });
        updateGoogleConsent(true);
        window.gtag('js', new Date());
        const gaConfig = {
            anonymize_ip: true,
            allow_ad_personalization_signals: false
        };
        if (diagnosticMode) gaConfig.debug_mode = true;
        window.gtag('config', CONFIG.gaMeasurementId, gaConfig);
        if (!diagnosticMode) {
            window.gtag('config', CONFIG.adsId, { allow_ad_personalization_signals: false });
        }

        loadScript(gaSrc).catch(() => {});
    }

    function updateGoogleConsent(accepted) {
        if (!window.gtag) return;
        const state = accepted ? 'granted' : 'denied';
        window.gtag('consent', 'update', {
            analytics_storage: state, ad_storage: diagnosticMode ? 'denied' : state,
            ad_user_data: diagnosticMode ? 'denied' : state, ad_personalization: 'denied'
        });
    }

    function trackContactClick(event) {
        const link = event.target.closest && event.target.closest('a[href]');
        if (!link) return;
        const url = new URL(link.href, window.location.href);
        let method;
        if (url.protocol === 'tel:' && url.pathname.replace(/\D/g, '') === '393920752599') {
            method = 'phone';
        } else if (url.protocol === 'https:' && url.hostname === 'wa.me' && url.pathname === '/393920752599') {
            method = 'whatsapp';
        }
        if (!method) return;
        if (diagnosticMode) event.preventDefault();
        if (getConsent() !== 'accepted' || !analyticsInitialized || !window.gtag) return;

        const eventName = diagnosticMode ? 'contact_click_test' : 'contact_click';
        const contact = { contact_method: method };
        if (diagnosticMode) contact.is_test = true;
        window.gtag('event', eventName, {
            send_to: CONFIG.gaMeasurementId,
            ...contact,
            ...(diagnosticMode ? { debug_mode: true } : {})
        });
        if (window.posthog && typeof window.posthog.capture === 'function') {
            window.posthog.capture(eventName, contact);
        }
        if (diagnosticMode) return;

        const conversion = { send_to: CONFIG.contactConversions[method] };
        // Give the tag time to send before a same-tab phone/app handoff, with a fallback.
        if (!event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey &&
            !event.shiftKey && !event.altKey && (!link.target || link.target === '_self')) {
            event.preventDefault();
            let navigated = false;
            const navigate = function() {
                if (navigated) return;
                navigated = true;
                window.location.href = link.href;
            };
            conversion.event_callback = navigate;
            conversion.event_timeout = 800;
            window.setTimeout(navigate, 800);
        }
        window.gtag('event', 'conversion', conversion);
    }

    function syncPostHogConsent(posthog) {
        if (getConsent() === 'accepted') {
            if (posthog.has_opted_out_capturing()) {
                posthog.opt_in_capturing({ captureEventName: false });
            }
        } else {
            posthog.opt_out_capturing();
        }
    }

    function initPostHog() {
        if (window.posthog && window.posthog.__loaded) {
            syncPostHogConsent(window.posthog);
            return;
        }
        if (window.posthog && window.posthog.__SV) {
            return;
        }

        !function(t, e) {
            var o, n, p, r;
            e.__SV || (window.posthog && window.posthog.__loaded) || (window.posthog = e, e._i = [], e.init = function(i, s, a) {
                function g(t, e) {
                    var o = e.split('.');
                    2 == o.length && (t = t[o[0]], e = o[1]), t[e] = function() {
                        t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
                    };
                }
                (p = t.createElement('script')).type = 'text/javascript';
                p.crossOrigin = 'anonymous';
                p.async = true;
                p.src = s.api_host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js';
                (r = t.getElementsByTagName('script')[0]).parentNode.insertBefore(p, r);
                var u = e;
                for (void 0 !== a ? u = e[a] = [] : a = 'posthog', u.people = u.people || [], u.toString = function(t) {
                    var e = 'posthog';
                    return 'posthog' !== a && (e += '.' + a), t || (e += ' (stub)'), e;
                }, u.people.toString = function() {
                    return u.toString(1) + '.people (stub)';
                }, o = 'init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload getFeatureFlagResult getAllFeatureFlags isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties unsetPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty createPersonProfile setInternalOrTestUser opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric'.split(' '), n = 0; n < o.length; n++) {
                    g(u, o[n]);
                }
                e._i.push([i, s, a]);
            }, e.__SV = 1);
        }(document, window.posthog || []);

        window.posthog.init(CONFIG.posthogToken, {
            api_host: CONFIG.posthogApiHost,
            ui_host: CONFIG.posthogUiHost,
            defaults: CONFIG.posthogDefaults,
            person_profiles: 'identified_only',
            opt_out_capturing_by_default: true,
            loaded: syncPostHogConsent
        });
    }

    function initAnalytics() {
        window[`ga-disable-${CONFIG.gaMeasurementId}`] = false;

        if (analyticsInitialized) {
            updateGoogleConsent(true);
            initPostHog();
            return;
        }

        analyticsInitialized = true;
        initGoogleAnalytics();
        initPostHog();
    }

    function deleteCookie(name) {
        const hostParts = window.location.hostname.split('.');
        const domains = ['', window.location.hostname];

        if (hostParts.length > 2) {
            domains.push(`.${hostParts.slice(-2).join('.')}`);
        }

        domains.forEach(domain => {
            const domainPart = domain ? `; domain=${domain}` : '';
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainPart}; SameSite=Lax`;
        });
    }

    function clearAnalyticsStorage() {
        window[`ga-disable-${CONFIG.gaMeasurementId}`] = true;
        if (window.gtag) {
            updateGoogleConsent(false);
        }
        if (window.posthog && window.posthog.__loaded && typeof window.posthog.opt_out_capturing === 'function') {
            window.posthog.opt_out_capturing();
        }

        document.cookie.split(';').forEach(cookie => {
            const name = cookie.split('=')[0].trim();
            if (name === '_ga' || name === '_gid' || name === '_gat' || name.startsWith('_ga_') || name.startsWith('_gcl_') || name.startsWith('ph_')) {
                deleteCookie(name);
            }
        });

        const storage = safeLocalStorage();
        if (storage) {
            Object.keys(storage).forEach(key => {
                if (key.startsWith('ph_') || key.startsWith('posthog')) {
                    storage.removeItem(key);
                }
            });
        }
    }

    function closeBanner() {
        const banner = document.getElementById('cookieConsent');
        if (banner) {
            banner.remove();
        }
    }

    function showSavedNotice() {
        const text = copy().saved;
        const notice = document.createElement('div');
        notice.className = 'cookie-toast';
        notice.textContent = text;
        document.body.appendChild(notice);
        window.setTimeout(() => notice.remove(), 2200);
    }

    function showBanner(force) {
        if (!force && getConsent()) {
            return;
        }

        closeBanner();

        const text = copy();
        const banner = document.createElement('div');
        banner.className = 'cookie-consent';
        banner.id = 'cookieConsent';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-live', 'polite');
        banner.setAttribute('aria-label', text.title);

        banner.innerHTML = `
            <div class="cookie-consent-copy">
                <strong>${text.title}</strong>
                <p>${text.body}</p>
                <a href="/#privacy">${text.privacy}</a>
            </div>
            <div class="cookie-consent-actions">
                <button type="button" class="cookie-btn cookie-btn-secondary" data-cookie-choice="rejected">${text.reject}</button>
                <button type="button" class="cookie-btn cookie-btn-primary" data-cookie-choice="accepted">${text.accept}</button>
            </div>
        `;

        banner.addEventListener('click', event => {
            const button = event.target.closest('[data-cookie-choice]');
            if (!button) {
                return;
            }

            const choice = button.getAttribute('data-cookie-choice');
            setConsent(choice);

            if (choice === 'accepted') {
                initAnalytics();
            } else {
                clearAnalyticsStorage();
            }

            closeBanner();
            showSavedNotice();
        });

        document.body.appendChild(banner);
    }

    function bindPreferenceLinks() {
        document.querySelectorAll('[data-cookie-preferences]').forEach(link => {
            link.addEventListener('click', event => {
                event.preventDefault();
                showBanner(true);
            });
        });
    }

    function init() {
        bindPreferenceLinks();
        document.addEventListener('click', trackContactClick);
        if (diagnosticMode) {
            document.title = '[TEST ANALYTICS] ' + document.title;
            const notice = document.createElement('div');
            notice.className = 'cookie-toast';
            notice.setAttribute('role', 'status');
            notice.textContent = getLang() === 'en'
                ? 'Analytics test: contact buttons send test events without opening calls or WhatsApp.'
                : 'Test Analytics: i pulsanti inviano eventi di prova senza aprire chiamate o WhatsApp.';
            document.body.appendChild(notice);
        }

        if (getConsent() === 'accepted') {
            initAnalytics();
        } else if (!getConsent()) {
            showBanner(false);
        }
    }

    window.openCookiePreferences = function() {
        showBanner(true);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

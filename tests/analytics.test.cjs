const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require('node:path').join(__dirname, '../analytics.js'), 'utf8');

function site({ consent = 'accepted', diagnostic = false } = {}) {
    const values = new Map(consent ? [['portfolio-cookie-consent-v2', consent]] : []);
    const elements = [];
    const handlers = {};
    const captures = [];
    const timers = [];
    const storage = {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: key => values.delete(key)
    };
    const posthog = {
        __loaded: true,
        capture: (...args) => captures.push(args),
        has_opted_out_capturing: () => false,
        opt_in_capturing() {},
        opt_out_capturing() {}
    };
    const append = element => elements.push(element);
    const document = {
        title: 'Portfolio', readyState: 'complete', cookie: '',
        documentElement: { lang: 'it' },
        head: { appendChild: append }, body: { appendChild: append },
        querySelector: () => null, querySelectorAll: () => [],
        getElementById: id => elements.find(element => element.id === id),
        addEventListener: (name, handler) => { handlers[name] = handler; },
        createElement: tagName => ({
            tagName, style: {}, setAttribute() {}, remove() {},
            addEventListener(name, handler) { this[name] = handler; }
        })
    };
    const window = {
        localStorage: storage, posthog,
        location: { href: 'https://tommasopatriti.me/' + (diagnostic ? '?analytics_debug=1' : '') },
        setTimeout: callback => timers.push(callback)
    };
    vm.runInNewContext(source, { window, document, URL, Date, Promise });
    const commands = () => Array.from(window.dataLayer || [], command => Array.from(command));
    const click = (href, target = '') => {
        const link = { href, target };
        const event = {
            target: { closest: () => link }, button: 0, defaultPrevented: false,
            preventDefault() { this.defaultPrevented = true; }
        };
        handlers.click(event);
        return event;
    };
    const choose = choice => {
        const banner = elements.findLast(element => element.id === 'cookieConsent');
        banner.click({ target: { closest: () => ({ getAttribute: () => choice }) } });
    };
    return { window, document, elements, captures, commands, click, choose, timers };
}

test('no tracking is initialized or captured before consent or after rejection', () => {
    for (const consent of [null, 'rejected']) {
        const page = site({ consent });
        page.click('tel:+393920752599');
        assert.equal(page.commands().length, 0);
        assert.equal(page.captures.length, 0);
        assert.equal(page.elements.filter(element => element.tagName === 'script').length, 0);
    }
});

test('acceptance configures GA once and reacceptance does not duplicate pageview config', () => {
    const page = site({ consent: null });
    page.choose('accepted');
    page.window.openCookiePreferences();
    page.choose('accepted');
    const gaConfigs = page.commands().filter(command => command[0] === 'config' && command[1] === 'G-8JSLCWYJYF');
    assert.equal(gaConfigs.length, 1);
    assert.notEqual(gaConfigs[0][2].send_page_view, false);
    assert.equal(page.elements.filter(element => element.tagName === 'script').length, 1);
});

test('phone and WhatsApp clicks reach GA, PostHog and the correct Ads conversion once', () => {
    for (const [href, method, label] of [
        ['tel:+393920752599', 'phone', '_1nsCNm3u6IdEMGfqO9B'],
        ['https://wa.me/393920752599?text=Ciao', 'whatsapp', 'rXrwCNa3u6IdEMGfqO9B']
    ]) {
        const page = site();
        const event = page.click(href);
        const contacts = page.commands().filter(command => command[1] === 'contact_click');
        const conversions = page.commands().filter(command => command[1] === 'conversion');
        assert.equal(contacts.length, 1);
        assert.equal(contacts[0][2].send_to, 'G-8JSLCWYJYF');
        assert.equal(contacts[0][2].contact_method, method);
        assert.equal(conversions.length, 1);
        assert.equal(conversions[0][2].send_to, `AW-17681747905/${label}`);
        assert.equal(page.captures[0][0], 'contact_click');
        assert.equal(page.captures[0][1].contact_method, method);
        assert.deepEqual(Object.keys(page.captures[0][1]), ['contact_method']);
        assert.equal(event.defaultPrevented, true);
        assert.equal(page.window.location.href, 'https://tommasopatriti.me/');
        conversions[0][2].event_callback();
        assert.equal(page.window.location.href, href);
    }
});

test('unrelated links and withdrawn consent never generate contact conversions', () => {
    const page = site();
    for (const href of ['https://example.com/', 'tel:+390000000000', 'https://wa.me/0000000000']) page.click(href);
    page.window.openCookiePreferences();
    page.choose('rejected');
    page.click('tel:+393920752599');
    assert.equal(page.commands().filter(command => command[0] === 'event').length, 0);
    assert.equal(page.captures.length, 0);
});

test('diagnostic clicks exercise both methods but never open contacts or configure/convert Ads', () => {
    const page = site({ diagnostic: true });
    for (const href of ['tel:+393920752599', 'https://wa.me/393920752599?text=Ciao']) {
        assert.equal(page.click(href, '_blank').defaultPrevented, true);
    }
    const events = page.commands().filter(command => command[0] === 'event');
    assert.equal(events.length, 2);
    assert.ok(events.every(command => command[1] === 'contact_click_test' && command[2].is_test && command[2].debug_mode));
    assert.deepEqual(events.map(command => command[2].contact_method), ['phone', 'whatsapp']);
    assert.equal(page.commands().filter(command => command[0] === 'config' && command[1].startsWith('AW-')).length, 0);
    assert.equal(page.captures.length, 2);
    assert.equal(page.window.location.href, 'https://tommasopatriti.me/?analytics_debug=1');
    assert.equal(page.timers.length, 0);
    const noConsent = site({ diagnostic: true, consent: null });
    assert.equal(noConsent.click('tel:+393920752599').defaultPrevented, true);
    assert.equal(noConsent.commands().length, 0);
});

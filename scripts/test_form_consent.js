const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const EXPECTED_CONSENT_MESSAGE =
  'Подтвердите согласие на обработку персональных данных.';

function createRequiredCheckbox(checked) {
  const classes = new Set();
  const attributes = new Map();
  return {
    name: 'privacy_consent',
    type: 'checkbox',
    checked,
    classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
      contains(name) { return classes.has(name); },
    },
    focusCount: 0,
    focus() { this.focusCount += 1; },
    setAttribute(name, value) { attributes.set(name, value); },
    removeAttribute(name) { attributes.delete(name); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    setCustomValidity(message) {
      this.validationMessage = message;
    },
    validationMessage: '',
  };
}

function createFormHarness(checked, options = {}) {
  const {
    hostname = 'example.test',
    metaEndpoint = '',
    windowEndpoint = 'https://forms.example.test/lead',
  } = options;
  const checkbox = createRequiredCheckbox(checked);
  const status = { className: '', innerHTML: '' };
  const submit = {
    dataset: {},
    textContent: 'Отправить заявку',
    setAttribute() {},
    removeAttribute() {},
  };
  let submitHandler;
  let endpointCalls = 0;
  const endpointUrls = [];
  let readyHandler;

  const form = {
    reset() { checkbox.checked = false; },
    addEventListener(event, handler) {
      assert.equal(event, 'submit');
      submitHandler = handler;
    },
    querySelector(selector) {
      if (selector === '[data-form-status]') return status;
      if (selector === '[type="submit"]') return submit;
      if (selector === '[name="service"]') return null;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[required]') return [checkbox];
      if (selector === '.form__input--error') {
        return checkbox.classList.contains('form__input--error') ? [checkbox] : [];
      }
      return [];
    },
  };

  const context = {
    AbortController,
    FormData: class {
      entries() {
        return [];
      }
    },
    URLSearchParams,
    document: {
      title: 'Test page',
      addEventListener(event, handler) {
        assert.equal(event, 'DOMContentLoaded');
        readyHandler = handler;
      },
      getElementById() {
        return null;
      },
      querySelector(selector) {
        if (selector === 'meta[name="ls-form-endpoint"]') {
          return metaEndpoint ? { content: metaEndpoint } : null;
        }
        return null;
      },
      querySelectorAll(selector) {
        if (selector === '.lead-form, #consultForm') return [form];
        return [];
      },
    },
    fetch: async (url) => {
      endpointCalls += 1;
      endpointUrls.push(url);
      return { ok: true };
    },
    sessionStorage: { getItem() { return ''; }, setItem() {} },
    window: {
      LS_FORM_ENDPOINT: windowEndpoint,
      clearTimeout() {},
      location: { href: `http://${hostname}/contact`, hostname, search: '' },
      setTimeout() { return 1; },
    },
  };

  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
  vm.runInContext(source, context);
  readyHandler();

  return {
    checkbox,
    endpointCalls: () => endpointCalls,
    endpointUrls,
    status,
    async submit() {
      let prevented = false;
      await submitHandler({ preventDefault() { prevented = true; } });
      assert.equal(prevented, true);
    },
  };
}

(async () => {
  const unchecked = createFormHarness(false);
  await unchecked.submit();
  assert.equal(unchecked.endpointCalls(), 0);
  assert.equal(unchecked.status.innerHTML, EXPECTED_CONSENT_MESSAGE);
  assert.equal(unchecked.checkbox.focusCount, 1);
  assert.equal(unchecked.checkbox.getAttribute('aria-invalid'), 'true');

  unchecked.checkbox.checked = true;
  await unchecked.submit();
  assert.equal(unchecked.endpointCalls(), 1);
  assert.equal(unchecked.checkbox.getAttribute('aria-invalid'), null);
  assert.equal(unchecked.checkbox.classList.contains('form__input--error'), false);
  assert.equal(unchecked.checkbox.checked, false);

  const local = createFormHarness(true, {
    hostname: '127.0.0.1',
    windowEndpoint: '',
  });
  await local.submit();
  assert.equal(local.endpointCalls(), 1);
  assert.deepEqual(local.endpointUrls, ['http://127.0.0.1:8787/api/leads']);

  const production = createFormHarness(true, {
    hostname: 'ls-detailing.ru',
    windowEndpoint: '',
  });
  await production.submit();
  assert.equal(production.endpointCalls(), 0);

  const explicit = createFormHarness(true, {
    hostname: '127.0.0.1',
    metaEndpoint: 'https://api.example.test/api/leads',
    windowEndpoint: '',
  });
  await explicit.submit();
  assert.deepEqual(explicit.endpointUrls, ['https://api.example.test/api/leads']);
})();

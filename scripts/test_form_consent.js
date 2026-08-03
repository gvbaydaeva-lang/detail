const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const EXPECTED_CONSENT_MESSAGE =
  'Подтвердите согласие на обработку персональных данных.';

function createRequiredCheckbox(checked) {
  return {
    name: 'privacy_consent',
    type: 'checkbox',
    checked,
    classList: { add() {} },
    focus() {},
    setAttribute() {},
    setCustomValidity(message) {
      this.validationMessage = message;
    },
    validationMessage: '',
  };
}

function createFormHarness(checked) {
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
  let readyHandler;

  const form = {
    reset() {},
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
      if (selector === '.form__input--error') return [];
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
        if (selector === 'meta[name="ls-form-endpoint"]') return null;
        return null;
      },
      querySelectorAll(selector) {
        if (selector === '.lead-form, #consultForm') return [form];
        return [];
      },
    },
    fetch: async () => {
      endpointCalls += 1;
      return { ok: true };
    },
    sessionStorage: { getItem() { return ''; }, setItem() {} },
    window: {
      LS_FORM_ENDPOINT: 'https://forms.example.test/lead',
      clearTimeout() {},
      location: { href: 'https://example.test/contact', search: '' },
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

  const checked = createFormHarness(true);
  await checked.submit();
  assert.equal(checked.endpointCalls(), 1);
})();

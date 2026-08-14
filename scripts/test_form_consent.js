import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const EXPECTED_CONSENT_MESSAGE =
  'Подтвердите согласие на обработку персональных данных.';
const EXPECTED_ERROR_MESSAGE =
  'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.';

function createField({ name, type = 'text', value = '', checked = false }) {
  const classes = new Set();
  const attributes = new Map();
  return {
    name,
    type,
    value,
    checked,
    classList: {
      add(className) { classes.add(className); },
      remove(className) { classes.delete(className); },
      contains(className) { return classes.has(className); },
    },
    focusCount: 0,
    focus() { this.focusCount += 1; },
    setAttribute(attribute, attributeValue) { attributes.set(attribute, attributeValue); },
    removeAttribute(attribute) { attributes.delete(attribute); },
    getAttribute(attribute) { return attributes.get(attribute) ?? null; },
  };
}

function createFormHarness(options = {}) {
  const {
    consentChecked = true,
    hostname = 'ls-detailing.ru',
    metaEndpoint = '',
    windowEndpoint = '',
    fetchStatus = 201,
    deferredFetch = false,
  } = options;
  const name = createField({ name: 'name', value: 'Анна' });
  const phone = createField({ name: 'phone', type: 'tel', value: '+7 (999) 999-99-99' });
  const checkbox = createField({
    name: 'privacy_consent',
    type: 'checkbox',
    value: 'accepted',
    checked: consentChecked,
  });
  const requiredFields = [name, phone, checkbox];
  const status = { className: '', innerHTML: '' };
  const submit = {
    dataset: {},
    disabled: false,
    textContent: 'Отправить заявку',
    setAttribute(attribute) {
      if (attribute === 'disabled') this.disabled = true;
    },
    removeAttribute(attribute) {
      if (attribute === 'disabled') this.disabled = false;
    },
    hasAttribute(attribute) {
      return attribute === 'disabled' && this.disabled;
    },
  };
  let submitHandler;
  let endpointCalls = 0;
  let resetCalls = 0;
  const endpointUrls = [];
  let readyHandler;
  let releaseFetch;
  const fetchGate = deferredFetch
    ? new Promise((resolve) => { releaseFetch = resolve; })
    : Promise.resolve();

  const form = {
    fields: requiredFields,
    reset() {
      resetCalls += 1;
      name.value = '';
      phone.value = '';
      checkbox.checked = false;
    },
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
      if (selector === '[required]') return requiredFields;
      if (selector === '.form__input--error') {
        return requiredFields.filter((field) => field.classList.contains('form__input--error'));
      }
      return [];
    },
  };

  class HarnessFormData {
    constructor(targetForm) {
      this.targetForm = targetForm;
    }

    entries() {
      return this.targetForm.fields
        .filter((field) => field.type !== 'checkbox' || field.checked)
        .map((field) => [field.name, field.value]);
    }
  }

  const context = {
    AbortController,
    FormData: HarnessFormData,
    URLSearchParams,
    document: {
      title: 'Test page',
      referrer: '',
      addEventListener(event, handler) {
        assert.equal(event, 'DOMContentLoaded');
        readyHandler = handler;
      },
      getElementById() { return null; },
      querySelector(selector) {
        if (selector === 'meta[name="ls-form-endpoint"]') {
          return metaEndpoint ? { content: metaEndpoint } : null;
        }
        if (selector === 'h1') return null;
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
      await fetchGate;
      return { ok: fetchStatus >= 200 && fetchStatus < 300, status: fetchStatus };
    },
    sessionStorage: { getItem() { return ''; }, setItem() {} },
    window: {
      LS_FORM_ENDPOINT: windowEndpoint,
      clearTimeout,
      location: { href: `https://${hostname}/contact`, hostname, search: '' },
      setTimeout,
    },
  };

  vm.createContext(context);
  const source = fs.readFileSync(path.join(scriptDirectory, '../js/main.js'), 'utf8');
  vm.runInContext(source, context);
  readyHandler();

  return {
    checkbox,
    endpointCalls: () => endpointCalls,
    endpointUrls,
    name,
    phone,
    releaseFetch: () => releaseFetch?.(),
    resetCalls: () => resetCalls,
    status,
    submitButton: submit,
    async submit() {
      let prevented = false;
      await submitHandler({ preventDefault() { prevented = true; } });
      assert.equal(prevented, true);
    },
  };
}

const unchecked = createFormHarness({ consentChecked: false });
await unchecked.submit();
assert.equal(unchecked.endpointCalls(), 0);
assert.equal(unchecked.status.innerHTML, EXPECTED_CONSENT_MESSAGE);
assert.equal(unchecked.checkbox.focusCount, 1);
assert.equal(unchecked.checkbox.getAttribute('aria-invalid'), 'true');

unchecked.checkbox.checked = true;
await unchecked.submit();
assert.equal(unchecked.endpointCalls(), 1);
assert.deepEqual(unchecked.endpointUrls, ['/api/leads']);
assert.equal(unchecked.resetCalls(), 1);
assert.match(unchecked.status.innerHTML, /Заявка отправлена/);
assert.doesNotMatch(unchecked.status.innerHTML, /WhatsApp|wa\.me/i);

const production = createFormHarness();
await production.submit();
assert.deepEqual(production.endpointUrls, ['/api/leads']);

const explicit = createFormHarness({
  metaEndpoint: 'https://api.example.test/api/leads',
});
await explicit.submit();
assert.deepEqual(explicit.endpointUrls, ['https://api.example.test/api/leads']);

const failed = createFormHarness({ fetchStatus: 502 });
await failed.submit();
assert.equal(failed.endpointCalls(), 1);
assert.equal(failed.resetCalls(), 0);
assert.equal(failed.name.value, 'Анна');
assert.equal(failed.phone.value, '+7 (999) 999-99-99');
assert.equal(failed.status.innerHTML, EXPECTED_ERROR_MESSAGE);
assert.doesNotMatch(failed.status.innerHTML, /WhatsApp|wa\.me/i);
assert.equal(failed.submitButton.disabled, false);

const duplicate = createFormHarness({ deferredFetch: true });
const firstSubmission = duplicate.submit();
await Promise.resolve();
const secondSubmission = duplicate.submit();
await Promise.resolve();
assert.equal(duplicate.endpointCalls(), 1);
duplicate.releaseFetch();
await Promise.all([firstSubmission, secondSubmission]);
assert.equal(duplicate.endpointCalls(), 1);

console.log('Проверка форм пройдена: согласие, отправка, ошибка и защита от повтора.');

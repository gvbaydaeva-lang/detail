const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const EXPECTED_CONSENT_MESSAGE =
  'Подтвердите согласие на обработку персональных данных.';

function requiredCheckbox(checked) {
  return {
    name: 'privacy_consent',
    type: 'checkbox',
    checked,
    classList: { add() {} },
    setAttribute() {},
    setCustomValidity(message) {
      this.validationMessage = message;
    },
    validationMessage: '',
  };
}

const context = {
  document: {
    addEventListener() {},
  },
};
vm.createContext(context);
const source = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
vm.runInContext(`${source}\nglobalThis.__validateLeadForm = validateLeadForm;`, context);

const unchecked = requiredCheckbox(false);
const uncheckedForm = {
  querySelectorAll(selector) {
    assert.equal(selector, '[required]');
    return [unchecked];
  },
};
assert.equal(context.__validateLeadForm(uncheckedForm, {}), unchecked);
assert.equal(unchecked.validationMessage, EXPECTED_CONSENT_MESSAGE);

const checked = requiredCheckbox(true);
const checkedForm = {
  querySelectorAll() {
    return [checked];
  },
};
assert.equal(context.__validateLeadForm(checkedForm, {}), null);
assert.equal(checked.validationMessage, '');

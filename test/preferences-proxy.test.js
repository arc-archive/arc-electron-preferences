const { assert } = require('chai');
const path = require('path');
const fs = require('fs-extra');
const { PreferencesProxy } = require('../renderer');

describe('PreferencesProxy class - renderer process', function() {
  const file = path.join('test', 'test.json');

  function fire(type, detail) {
    const e = new CustomEvent(type, {
      bubbles: true,
      cancelable: true,
      detail
    });
    document.body.dispatchEvent(e);
    return e;
  }

  describe('Read data web event handler', function() {
    let instance;
    beforeEach(() => {
      instance = new PreferencesProxy();
      instance.observe();
    });

    afterEach(async () => {
      instance.unobserve();
      await fs.remove(file)
    });

    it('Handles the event', async () => {
      const e = fire('settings-read', {});
      assert.isTrue(e.defaultPrevented, 'Event is canceled');
      assert.ok(e.detail.result, 'Has promise on detail');
      await e.detail.result;
    });
  });

  describe('Store data web event handler', function() {
    let instance;
    const name = 'test-name';
    const value = 'test-value';
    beforeEach(() => {
      instance = new PreferencesProxy();
      instance.observe();
    });

    afterEach(async () => {
      instance.unobserve();
      await fs.remove(file)
    });

    it('Handles the event', async () => {
      const e = fire('settings-changed', { name, value });
      assert.isTrue(e.defaultPrevented, 'Event is canceled');
      assert.ok(e.detail.result, 'Has promise on detail');
      await e.detail.result;
    });
  });
});

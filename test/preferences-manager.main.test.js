const { assert } = require('chai');
const path = require('path');
const fs = require('fs-extra');
const { PreferencesManager } = require('../main');

describe('PreferencesManager class - main process', function() {
  const file = path.join('test', 'test.json');

  describe('Reading preferences', function() {
    afterEach(async () => await fs.remove(file));

    it('Responds with app-preferences event', async () => {
      const instance = new PreferencesManager({
        file: file
      });
      const result = await instance._readHandler();
      assert.deepEqual(result, {});
    });
  });

  describe('Updating preferences', function() {
    afterEach(async () => await fs.remove(file));

    const name = 'test-name';
    const value = 'test-value';

    it('Updates settings', async () => {
      const instance = new PreferencesManager({
        file
      });
      await instance._changeHandler({}, name, value);
      const data = await fs.readJson(file);
      assert.equal(data[name], value, 'Value stored in file');
    });

    it('overrides the value settings', async () => {
      const i1 = new PreferencesManager({
        file
      });
      await i1._changeHandler({}, name, value);
      const i2 = new PreferencesManager({
        file
      });
      await i2._changeHandler({}, name, 'other');
      const data = await fs.readJson(file);
      assert.equal(data[name], 'other', 'Value stored in file');
    });

    it('emmits change event', async () => {
      const i1 = new PreferencesManager({
        file
      });
      let n;
      let v;
      i1.on('settings-changed', (name, value) => {
        n = name;
        v = value;
      });
      await i1._changeHandler({}, name, value);
      assert.equal(n, name, 'name passed as an event argument');
      assert.equal(v, value, 'value passed as an event argument');
    });
  });
});

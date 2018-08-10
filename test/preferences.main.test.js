const assert = require('chai').assert;
const {ArcPreferences} = require('../');

describe('ArcPreferences class - main process', function() {
  describe('Setting up paths', function() {
    it('Sets default paths', function() {
      const instance = new ArcPreferences();
      assert.typeOf(instance.userSettingsDir, 'string');
      assert.typeOf(instance.settingsFile, 'string');
    });

    it('Default file is settings.json', function() {
      const instance = new ArcPreferences();
      assert.notEqual(instance.settingsFile.indexOf('settings.json'), -1);
    });

    it('Accepts "file" option', function() {
      const data = 'path/to/a/file.json';
      const instance = new ArcPreferences({
        file: data
      });
      assert.equal(instance.settingsFile, data);
    });

    it('Accepts "fileName" option', function() {
      const data = 'other-file.json';
      const instance = new ArcPreferences({
        fileName: data
      });
      assert.notEqual(instance.settingsFile.indexOf(data), -1);
    });

    it('Accepts "filePath" option', function() {
      const data = 'path/to/a/file/';
      const instance = new ArcPreferences({
        filePath: data
      });
      assert.equal(instance.settingsFile, data + 'settings.json');
    });

    it('Accepts "filePath" and "fileName" option', function() {
      const p = 'path/to/a';
      const f = 'file.json';
      const instance = new ArcPreferences({
        filePath: p,
        fileName: f
      });
      assert.equal(instance.settingsFile, 'path/to/a/file.json');
    });

    it('File overrides other options', function() {
      const p = 'path/to/a';
      const f = 'file.json';
      const data = 'path/to/a/file.json';
      const instance = new ArcPreferences({
        filePath: p,
        fileName: f,
        file: data
      });
      assert.equal(instance.settingsFile, data);
    });
  });

  describe('_resolvePath()', function() {
    let instance;
    before(() => {
      instance = new ArcPreferences();
    });

    it('Resolves ~ as home dir', function() {
      const data = '~/path';
      const result = instance._resolvePath(data);
      assert.notEqual(result, data);
      assert.equal(result.indexOf('~'), -1);
      assert.notEqual(result.indexOf('/path'), -1);
    });

    it('Returns the same path', function() {
      const data = 'path/to/a/file.json';
      const result = instance._resolvePath(data);
      assert.equal(result, data);
    });
  });
});

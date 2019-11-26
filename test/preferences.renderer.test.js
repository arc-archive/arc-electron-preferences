const assert = require('chai').assert;
const path = require('path');
const fs = require('fs-extra');
const { AppPreferences } = require('../');

describe('AppPreferences class - renderer process', function() {
  const file = path.join('test', 'test.json');

  describe('Setting up paths', function() {
    it('Sets default paths', function() {
      const instance = new AppPreferences();
      assert.typeOf(instance.userSettingsDir, 'string');
      assert.typeOf(instance.settingsFile, 'string');
    });

    it('Default file is settings.json', function() {
      const instance = new AppPreferences();
      assert.notEqual(instance.settingsFile.indexOf('settings.json'), -1);
    });

    it('Accepts "file" option', function() {
      const data = 'path/to/a/file.json';
      const instance = new AppPreferences({
        file: data
      });
      assert.equal(instance.settingsFile, data);
    });

    it('Accepts "fileName" option', function() {
      const data = 'other-file.json';
      const instance = new AppPreferences({
        fileName: data
      });
      assert.notEqual(instance.settingsFile.indexOf(data), -1);
    });

    it('Accepts "filePath" option', function() {
      const data = 'path/to/a/file/';
      const instance = new AppPreferences({
        filePath: data
      });
      assert.equal(instance.settingsFile, data + 'settings.json');
    });

    it('Accepts "filePath" and "fileName" option', function() {
      const p = 'path/to/a';
      const f = 'file.json';
      const instance = new AppPreferences({
        filePath: p,
        fileName: f
      });
      assert.equal(instance.settingsFile, 'path/to/a/file.json');
    });

    it('File overrides other options', function() {
      const p = 'path/to/a';
      const f = 'file.json';
      const data = 'path/to/a/file.json';
      const instance = new AppPreferences({
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
      instance = new AppPreferences();
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

  describe('_restoreFile()', function() {
    afterEach(() => {
      return fs.remove(file);
    });

    it('Creates the file', async () => {
      const instance = new AppPreferences();
      await instance._restoreFile(file);
      const exists = await fs.pathExists(file);
      assert.isTrue(exists);
    });

    it('Reads file content', async () => {
      const data = {
        test: true,
        _restoreFile: true
      };
      const instance = new AppPreferences();
      await fs.outputJson(file, data);
      const content = await instance._restoreFile(file);
      assert.deepEqual(content, data);
    });
  });

  describe('_storeFile()', () => {
    const data = {
      test: true,
      _storeFile: true
    };

    afterEach(() => {
      return fs.remove(file);
    });

    it('Creates the file', async () => {
      const instance = new AppPreferences();
      await instance._storeFile(file, data);
      const exists = await fs.pathExists(file);
      assert.isTrue(exists);
    });

    it('Writes to the file', async () => {
      const instance = new AppPreferences();
      await instance._storeFile(file, data);
      const content = await fs.readJson(file);
      assert.deepEqual(content, data);
    });
  });

  describe('load()', function() {
    const data = {
      test: true,
      load: true
    };

    afterEach(async () => await fs.remove(file));

    it('Returns empty data for non existing file', async () => {
      const instance = new AppPreferences({
        file
      });
      const content = await instance.load();
      assert.deepEqual(content, {});
    });

    it('Returns defaultSettings for non existing file', async () => {
      const instance = new AppPreferences({
        file
      });
      instance.defaultSettings = async () => {
        return data;
      };
      const content = await instance.load();
      assert.deepEqual(content, data);
    });

    it('Creates the file with default data', async () => {
      const instance = new AppPreferences({
        file
      });
      instance.defaultSettings = async () => {
        return data;
      };
      await instance.load();
      const content = await fs.readJson(file);
      assert.deepEqual(content, data);
    });

    it('Sets up "__settings"', async () => {
      const instance = new AppPreferences({
        file
      });
      instance.defaultSettings = async () => {
        return data;
      };
      await instance.load();
      assert.deepEqual(instance.__settings, data);
    });

    it('Returns "__settings" when available', async () => {
      const instance = new AppPreferences({
        file
      });
      instance.defaultSettings = async () => {
        return data;
      };
      await instance.load();
      const settings = instance.__settings;
      settings.testValue = true;
      const content = await instance.load();
      assert.deepEqual(content, settings);
    });
  });
});

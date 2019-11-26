const { assert } = require('chai');
const fs = require('fs-extra');
const { AppMeta } = require('../main/index.js');

describe('AppMeta class - main process', function() {
  describe('File path', function() {
    it('Sets correct file path', function() {
      const instance = new AppMeta();
      assert.notEqual(instance.settingsFile.indexOf('app-meta.json'), -1);
    });
  });

  describe('Reading data', function() {
    let instance;
    let data;

    beforeEach(() => {
      instance = new AppMeta();
      data = {
        appId: 'appid-test',
        aid: 'aid-test'
      };
    });

    after(async () => await fs.remove(instance.settingsFile));

    it('Creates the settings', async () => {
      const meta = await instance.load();
      assert.typeOf(meta, 'object', 'Returns is an object');
      assert.typeOf(meta.appId, 'string', 'appId is set');
      assert.typeOf(meta.aid, 'string', 'aid is set');
    });

    it('Created data is persistent', async () => {
      const meta = await instance.load();
      const other = new AppMeta();
      const otherMeta = await other.load();
      assert.equal(otherMeta.appId, meta.appId);
      assert.equal(otherMeta.aid, meta.aid);
    });

    it('getAppId() returns the id', async () => {
      await fs.outputJson(instance.settingsFile, data);
      const appId = await instance.getAppId();
      assert.equal(appId, data.appId);
    });

    it('getAninimizedId() returns the id', async () => {
      await fs.outputJson(instance.settingsFile, data);
      const aid = await instance.getAninimizedId();
      assert.equal(aid, data.aid);
    });
  });
});

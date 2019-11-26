import EventEmitter from 'events';
import electron from 'electron';
import path from 'path';
import fs from 'fs-extra';
import log from 'electron-log';

const defaultSettingsFile = 'settings.json';

/**
 * A module responsible for storing / restoring user settings.
 * This works with any file and is not mean to work specifically with
 * ARC settings file. Extending this class you'll get access to most common
 * methods when working with files.
 *
 * By default files are stored in user's application data directory. It can be
 * changed by passing `file` property to the constructor.
 */
export class AppPreferences extends EventEmitter {
  /**
   * @param {Object=} opts - Initialization options:
   * @param {String=} opts.file Path to a settings file. It overrides other settings
   * and uses this file as a final store.
   * @param {String=} opts.fileName A name for the settings file. By default it's `settings.json`
   * @param {String=} opts.filePath Path to the preferences file. By default it's system's
   * application directory for user profile.
   * @param {String=} opts.appendFilePath - If true it appends `filePath` to the default path.
   * @param {Object=} opts.logger - When set this is used as a longer. When not set `electron-log`
   * is used instead.
   * @param {Object} defaults A default settings object to be used when
   * settings file does not exists. Child classes can use `defaultSettings()`
   * function to generate default settings.
   */
  constructor(opts={}, defaults) {
    super();
    /**
     * Current read settings.
     * @type {Object}
     */
    this.__settings = undefined;
    /**
     * The application directory where user settings are stored.
     * @type {String}
     */
    this.userSettingsDir = undefined;
    /**
     * Full path to the preferences file where the data is stored.
     * @type {String}
     */
    this.settingsFile = undefined;
    this.defaults = defaults;
    this.log = opts.logger || log;
    this._setupPaths(opts);
  }
  /**
   * Setups paths to settings files.
   *
   * @param {?Object} opts See constructor for description.
   */
  _setupPaths(opts) {
    const app = (electron.app || electron.remote.app);
    this.userSettingsDir = app.getPath('userData');
    if (opts.file) {
      this.settingsFile = this._resolvePath(opts.file);
    } else {
      const file = opts.fileName || defaultSettingsFile;
      let dir;
      if (opts.filePath) {
        if (opts.appendFilePath) {
          dir = path.join(this.userSettingsDir, opts.filePath);
        } else {
          dir = opts.filePath;
        }
      } else {
        dir = this.userSettingsDir;
      }
      this.userSettingsDir = dir;
      this.settingsFile = path.join(dir, file);
    }
  }
  /**
   * Resolves file path to correct path if it's starts with `~`.
   *
   * @param {String} file Settings file path
   * @return {String} Path to the file.
   */
  _resolvePath(file) {
    if (file[0] === '~') {
      const app = (electron.app || electron.remote.app);
      file = app.getPath('home') + file.substr(1);
    }
    return file;
  }
  /**
   * Ensures that the file exists and reads it's content as JSON.
   * @param {String} file Path to a file
   * @return {Promise} Promise resolved to file content or empty object.
   */
  async _restoreFile(file) {
    await fs.ensureFile(file);
    return await fs.readJson(file, { throws: false });
  }
  /**
   * Stores JSON `data` in `file`.
   *
   * @param {String} file Path to a file.
   * @param {Object} data JavaScript object to store.
   * @return {Promise} Promise resolved when the `file` is updated.
   */
  async _storeFile(file, data) {
    return await fs.outputJson(file, data);
  }
  /**
   * Loads current settings from settings file.
   *
   * @return {Promise} Promise resolved to a settings file.
   */
  async load() {
    if (this.__settings) {
      return this.__settings;
    }
    try {
      const data = await this._restoreFile(this.settingsFile);
      return this._processSettings(data);
    } catch (e) {
      this.log.warn(e);
      return this._processSettings();
    }
  }
  /**
   * Processes data from settings file. Creates default settings if settings
   * file do not exists.
   *
   * @param {?Object} data Settings read from the settings file.
   * @return {Promise<Object>} Settings for the app.
   */
  async _processSettings(data) {
    if (!data || !Object.keys(data).length) {
      if (this.defaults) {
        this.__settings = this.defaults;
        await this.store();
        return this.__settings;
      }
      if (typeof this.defaultSettings === 'function') {
        const settings = await this.defaultSettings();
        this.__settings = settings;
        await this.store();
        return settings;
      }
      this.__settings = {};
      return this.__settings;
    }
    this.__settings = data;
    return data;
  }
  /**
   * Stores current settings to file.
   *
   * @return {Promise} Promise resolved when the settings are stored.
   */
  async store() {
    return await this._storeFile(this.settingsFile, this.__settings);
  }
}

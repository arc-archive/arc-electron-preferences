import { AppPreferences } from '../lib/AppPreferences.js';
import { ipcMain, BrowserWindow } from 'electron';
/**
 * A class handling queries from any application window (renderer) to read
 * or store application preferences.
 */
export class PreferencesManager extends AppPreferences {
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
  constructor(opts, defaults) {
    super(opts, defaults);
    this._readHandler = this._readHandler.bind(this);
    this._changeHandler = this._changeHandler.bind(this);
  }
  /**
   * Listens for application events related to preferences management.
   */
  observe() {
    ipcMain.handle('read-app-preferences', this._readHandler);
    ipcMain.handle('update-app-preference', this._changeHandler);
  }
  /**
   * Handler for the IPC `read-app-preferences` event
   * @param {Event} event
   */
  async _readHandler() {
    try {
      return this.load();
    } catch (cause) {
      this.log.error(cause);
      throw cause;
    }
  }
  /**
   * Handler for the IPC `update-app-preference` event
   * @param {Event} event
   * @param {String} name Preference name
   * @param {any} value Preference value
   */
  async _changeHandler(event, name, value) {
    try {
      if (!this.__settings) {
        await this.load();
      }
      this.__settings[name] = value;
      await this.store();
      this._informChange(name, value);
    } catch (cause) {
      this.log.error(cause);
      throw cause;
    }
  }
  /**
   * Informs all available windows about the change in the preferences.
   * @param {String} name Preference name
   * @param {String} value New value
   */
  _informChange(name, value) {
    this.emit('settings-changed', name, value);
    const windows = BrowserWindow.getAllWindows();
    for (let i = 0, len = windows.length; i < len; i++) {
      const { webContents } = windows[i];
      webContents.send('app-preference-updated', name, value);
    }
  }
}

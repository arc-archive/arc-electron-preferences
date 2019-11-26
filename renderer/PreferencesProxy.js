import { ipcRenderer } from 'electron';
/**
 * Class that provides access to user settings file in the renderer process.
 */
export class PreferencesProxy {
  /**
   * @constructor
   */
  constructor() {
    this._readHandler = this._readHandler.bind(this);
    this._changeHandler = this._changeHandler.bind(this);
    this._mainChangedHandler = this._mainChangedHandler.bind(this);
  }
  /**
   * Observers window and IPC events which makes this class work.
   */
  observe() {
    window.addEventListener('settings-read', this._readHandler);
    window.addEventListener('settings-changed', this._changeHandler);
    ipcRenderer.on('app-preference-updated', this._mainChangedHandler);
  }
  /**
   * Stop observing window and IPC events
   */
  unobserve() {
    window.removeEventListener('settings-read', this._readHandler);
    window.removeEventListener('settings-changed', this._changeHandler);
    ipcRenderer.removeListener('app-preference-updated', this._mainChangedHandler);
  }
  /**
   * Handler for the `settings-read` custom event. Reads current settings.
   * It set's the `result` property on event's detail object with the
   * promise from calling `load()` function.
   *
   * @param {CustomEvent} e Custom event
   */
  _readHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.load();
  }
  /**
   * Loads application settings from the main thread.
   * @return {Promise}
   */
  async load() {
    return await ipcRenderer.invoke('read-app-preferences');
  }
  /**
   * A handler for window `settings-changed` custom event.
   * Sends the intent to the main proces to update preferences.
   * @param {CustomEvent} e
   */
  _changeHandler(e) {
    if (!e.cancelable) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { name, value } = e.detail;
    e.detail.result = this.store(name, value);
  }

  /**
   * Updates the data and stores it in the settings file.
   * @param {String} name Property name
   * @param {?any} value Property value
   * @return {Promise} Promise resolved when the changes has been commited to
   * the file.
   */
  async store(name, value) {
    if (!name) {
      throw new Error('Name is not set.');
    }
    await ipcRenderer.invoke('update-app-preference', name, value);
  }

  /**
   * Handler for `app-preference-updated` main process event.
   * The event is dispatched each time a preference change.
   *
   * If corresponding promise exists it will resolve it.
   * It always dispatches `app-preference-updated` custom event.
   *
   * @param {Event} e
   * @param {String} name Name of changed property
   * @param {any} value
   */
  _mainChangedHandler(e, name, value) {
    document.body.dispatchEvent(new CustomEvent('settings-changed', {
      bubbles: true,
      detail: {
        name,
        value,
      }
    }));
  }
}

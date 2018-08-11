const {ArcPreferences} = require('../lib/preferences');
const {PayloadProcessor} = require(
  '@advanced-rest-client/arc-electron-payload-processor');
const log = require('electron-log');
/**
 * A class handling queries from any application window (renderer) to read
 * or store application preferences.
 */
class WorkspaceManager extends ArcPreferences {
  /**
   * @param {?Number} windowIndex An index of opened renderer window.
   * By Default it is `0` meaning that `workspace.json` is used. Otherwise
   * it uses `workspace.{index}.json`. Note, this option is ignored if
   * `file` or `fileName` is set on the `opts` object.
   * @param {?Object} opts - Initialization options:
   * - file - Path to a workspace state file. It overrides other settings and
   * uses this file as a final store.
   * - fileName - A name for the state file. By default it's `workspace.json`
   * - filePath - Path to the state file. By default it's system's
   * application directory for user profile.
   */
  constructor(windowIndex, opts) {
    if (!opts) {
      opts = {};
    }
    if (!opts.fileName) {
      if (!windowIndex) {
        opts.fileName = 'workspace.json';
      } else {
        opts.fileName = `workspace.${windowIndex}.json`;
      }
    }
    super(opts);
    log.info('State file is ', this.settingsFile);
    /**
     * Store data debounce timer.
     * By default it's 500 ms.
     * @type {Number}
     */
    this.storeDebounce = 500;
  }
  /**
   * Generates the default settings. It is used by the parten class when
   * settings are not avaiolable.
   * @return {Promise}
   */
  defaultSettings() {
    return Promise.resolve({
      requests: [],
      selected: 0,
      environment: 'default'
    });
  }
  /**
   * Restores state file.
   *
   * @return {Promise} Promise resolved to content of the file.
   */
  restore() {
    log.info('Restoring workspace data from', this.settingsFile);
    return this.loadSettings()
    .then((data) => {
      log.info('Restored workspace data from', this.settingsFile);
      this.initialized = true;
      this._processRestoredPayload(data);
      return data;
    })
    .catch((cause) => {
      log.info('Unable to restore workspace data', cause);
      this.initialized = true;
      return {};
    });
  }
  /**
   * Stores current data to state file.
   *
   * This task is async and delayed
   *
   * @param {Object} data Store file contents
   */
  store() {
    if (!this.initialized) {
      return;
    }
    if (this.__storeDebouncer) {
      return;
    }
    this.__storeDebouncer = true;
    setTimeout(() => {
      log.info('Storing workspace data to', this.settingsFile);
      this.updateSettings()
      .catch((cause) => {
        log.error('Unable to store workspace data.', this.settingsFile, cause);
      });
    }, this.storeDebounce);
  }
  /**
   * Updates state of the request entries.
   *
   * @param {Object} requests List of ARC requests objects.
   * @return {Promise} Promise resolved when data is saved.
   */
  updateRequestsSate(requests) {
    if (!this.initialized) {
      return;
    }
    log.info('Updating workspace request data...');
    if (!this.__settings) {
      this.__settings = {};
    }
    return this._processRequests(requests)
    .then((data) => {
      this.__settings.requests = data;
      this.store();
    });
  }
  /**
   * Updates selected request data.
   *
   * @param {Number} selected Selected request
   */
  updateSelected(selected) {
    if (!this.initialized) {
      return;
    }
    log.info('Updating workspace selection data...');
    if (!this.__settings) {
      this.__settings = {};
    }
    this.__settings.selected = selected;
    this.store();
  }
  /**
   * Processes requests payloads and transforms them to string if needed.
   *
   * @param {Array<Object>} requests List of ARC requests
   * @param {?Number} index Index of processed request
   * @param {?Array} result Result of processing.
   * @return {Promise} Promise resolved when all requests has been processed.
   * Resolved promise contains the copy of request objects.
   */
  _processRequests(requests, index, result) {
    index = index || 0;
    result = result || [];
    const item = requests[index];
    if (!item) {
      return Promise.resolve(result);
    }
    return PayloadProcessor.payloadToString()
    .then((request) => {
      result[index] = request;
      index++;
      return this._processRequests(requests, index, result);
    });
  }
  /**
   * When restoring data it processes requests payload data.
   * @param {Object} state
   */
  _processRestoredPayload(state) {
    if (!state || !state.requests || !state.requests.length) {
      return;
    }
    for (let i = 0, len = state.requests.length; i < len; i++) {
      if (state.requests[i].multipart) {
        try {
          state.requeststs[i].payload = PayloadProcessor.restoreMultipart(
            state.requests[i].multipart);
          delete state.requests[i].multipart;
        } catch (_) {}
      } else if (state.requests[i].blob) {
        try {
          state.requeststs[i].payload = PayloadProcessor._dataURLtoBlob(
            state.requests[i].blob);
          delete state.requests[i].blob;
        } catch (_) {}
      }
    }
  }
}
module.exports.WorkspaceManager = WorkspaceManager;

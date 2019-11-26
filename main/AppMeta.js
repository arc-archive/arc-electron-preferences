import { AppPreferences } from '../lib/AppPreferences.js';
import uuidv4 from 'uuid/v4.js';
import uuidv5 from 'uuid/v5.js';

const metaFile = 'app-meta.json';

/**
 * Application metadata.
 *
 * ## appId
 *
 * The `appId` property is generated automatically when `load()` is called for
 * the first time.
 * It is the application ID that can be used to link user data.
 * This value won't change until application home directory is removed.
 *
 * ## aid
 *
 * The `aid` property is generated automatically when `load()` is called for
 * the first time.
 *
 * Aninimized Id that can be used to link this app with analytics account like Google Analytics.
 * Only this property should be used for any analytical tool.
 * This property is never stored outside local filesystem or analytics server
 * which doesn't allow connect this information with specific app instance.
 */
export class AppMeta extends AppPreferences {
  /**
   * @constructor
   */
  constructor() {
    super({
      fileName: metaFile
    });
  }
  /**
   * Returns generated application ID.
   *
   * @return {Promse} Promise resolved to the application ID.
   */
  async getAppId() {
    const meta = await this.load();
    return meta.appId;
  }
  /**
   * To ensure anynomous app usage reporting the app is using generated UUID
   * from the instance ID. Both are not stored together anywhere outside user's
   * local filesystem.
   *
   * @return {Promse} Promise resolved to the application anonymized ID.
   */
  async getAninimizedId() {
    const meta = await this.load();
    return meta.aid;
  }
  /**
   * Creates default metadata for ARC.
   *
   *
   * @return {Promise} Generated metadata object
   */
  async defaultSettings() {
    const appId = uuidv4();
    const aid = uuidv5('app-meta', appId);
    const result = {
      appId,
      aid,
    };
    return result;
  }
}

# arc-electron-preferences


**This library only works with Electron >= 7.0.0**. Electron is required as a peer dependency of this project.

A module to be used in Electron application to add support for storing preferences.

It is mainly used for Advanced REST Client and API Console projects. However it is made in the most universal way.

It contains classes to work in both main and renderer processes.

## ESM zone

The models are ES modules. If your application does not support ESM then always use `index.js` files located in main package,
`lib/`, `main/`, and `renderer/` directories.

## Main process

Application settings storing/restoring/updating is only handled in the main process. Even though it is possible to use `AppPreferences` class in the renderer process,
to minimize the risk of desynchronizing settings always use `PreferencesManager` in the main process and `PreferencesProxy` in the renderer process.
If the application, however, has only single window and the main process do not store instance of the `AppPreferences` or `PreferencesManager` in the memory it is safe to read and update file directly from the renderer process.

```javascript
import { PreferencesManager } from '@advanced-rest-client/arc-electron-preferences';
const mgr = new PreferencesManager();
mgr.observe();
```

## Renderer process

### Working with Preferences manager

Use the proxy to communicate with the main process using channels (not regular IPC events!).

```javascript
import { ArcPreferencesProxy } from '@advanced-rest-client/arc-electron-preferences/renderer';

const proxy = new ArcPreferencesProxy();
proxy.observe();
```

#### Direct API

```javascript
const settings = await proxy.load(); // load current settings
await proxy.store('name', 'someValue');
```

#### Web events

##### Reading settings

```javascript
const e = new CustomEvent('settings-read', {
  bubbles: true,
  composed: true, // assuming custom element
  cancelable: true,
  detail: {} // must be set!
});
this.dispatchEvent(e); // assuming custom element

if (e.defaultPrevented) {
  e.detail.result.then((settings) => console.log(settings));
}
```

##### Updating settings

```javascript
const e = new CustomEvent('settings-changed', {
  bubbles: true,
  composed: true, // assuming custom element
  cancelable: true,
  detail: {
    name: 'my-setting',
    value: 'my-value'
  }
});
this.dispatchEvent(e); // assuming custom element

if (e.defaultPrevented) {
  e.detail.result.then((settings) => console.log('Settings saved'));
}
```

When settings are updates every browser window receives `app-preference-updated`
event from the main page on the ipc main bus and the proxy dispatches non cancellable
`settings-changed` custom event. Therefore once the proxy is initialized the
components / application should just listen to this event to know if a setting
changed.

## Application meta data (main process)

When first run the app creates a meta data file. The file contains `appId` which is an `uuid` version 4 string and `aid` which is `uuid` version 5.

The `appId` property can be used to identify specific instance of the application.
This can be used to synchronize data between the instance and the application server.

The `aid` is anonymised application id that should be used with analytics suite.
This property cannot be used anywhere else to ensure that any analytics data cannot be connected to specific instance.

### Usage

```javascript
import { AppMeta } from '@advanced-rest-client/arc-electron-preferences';

const meta = new AppMeta();
// appId is persistent and can be used to identify the app instance
const appId = await meta.getAppId();
// aid can be only used to record a user session.
const aid = await meta.getAninimizedId();
```

## Session control (window meta)

The `SessionControl` updates application's window state to the state file.
It includes window position and size.

### Example usage

```javascript
import { SessionControl } from '@advanced-rest-client/arc-electron-preferences';

// The argument is the index of the window.
const session = new SessionControl(1);
const state = await session.load();
const win = new BrowserWindow({
  width: state.size.width,
  height: state.size.height,
  x: state.position.x,
  y: state.position.y,
});
session.trackWindow(win);
win.metaSession = session;
win.addListener('closed', () => {
  win.metaSession.untrackWindow();
});
```

The constructor takes window index as an argument. Each window has it's own
state file that keeps its size and position.

The second optional argument is a map of default values for window `width` and `height`
and `debounce` to store the state after this amount of ms.

The application can call `updatePosition()` and `updateSize()` function by it's
own. The class provides the `trackWindow()` function that tracks both `resize`
and `move` events of the window object. **when using this function** clear
event listeners when the window is closed or it will newer get garbage collected.

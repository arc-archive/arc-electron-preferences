const path = require('path');
const { PreferencesManager } = require('../main');

const file = path.join('test', 'test.json');
const mgr = new PreferencesManager({
  file
});
mgr.observe();

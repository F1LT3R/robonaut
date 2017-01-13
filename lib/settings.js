const path = require('path');

const fs = require('fs-extra');

// Robonaut Default Settings
const rootPath = path.resolve(path.join(__dirname, '..'));
const packageJsonPath = path.join(rootPath, 'package.json');
const packageJson = fs.readJsonSync(packageJsonPath, {throws: false});

const settings = packageJson.settings.robonaut;

module.exports = settings;

#!/usr/bin/env node
// 📡🛰👽👾🎮📦☄🌚

// const path = require('path');

// const gitRevSync = require('git-rev-sync');
// const Promise = require('bluebird');
// const charm = require('promise-charm');
// const term = require('terminal-kit');

const settings = require('./lib/settings');
const log = require('./lib/log')(settings);
const file = require('./lib/file')(settings, log);
const spawn = require('./lib/spawn')(settings, log);
const helpers = require('./lib/helpers');

const main = {};
main.assemble = require('./lib/assemble')(settings, log, file, spawn);
main.disassemble = require('./lib/disassemble')(settings, log, file, spawn);
main.current = require('./lib/current')(settings, log, file);
main.sync = require('./lib/sync')(settings, log, file, spawn, main);
main.fuse = require('./lib/fuse')(settings, log, file, spawn, main, helpers);

const core = require('./lib/core')(settings, log, file, spawn, main);

// (for testing/remote-control)
module.exports = {
	begin: core.begin
};

if (process.stdin.isTTY) {
	core.begin(process.argv);
}

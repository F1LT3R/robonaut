#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const jsonfile = require('jsonfile');

jsonfile.spaces = 4;

const strap = chalk.bgYellow.black.bold('[:|]');
const cwdRoot = process.cwd();

const log = (msg, col) => {
	console.log(`${strap} ${chalk[col || 'white'](msg)}`);
};

const showHelp = flag => {
	log('robonaut help');
	console.log(flag);
};

// const fileExistsSync = path => {
// 	let exists;

// 	try {
// 		const stat = fs.statSync(path);
// 		if (stat.isFile()) {
// 			exists = true;
// 		}
// 	} catch (err) {
// 		exists = false;
// 	}

// 	return exists;
// };

const dirExistsSync = path => {
	let exists;

	try {
		const stat = fs.statSync(path);
		if (stat.isDirectory()) {
			exists = true;
		}
	} catch (err) {
		exists = false;
	}

	return exists;
};

const loadJson = url => {
	log(`'loadJson: ${url}`);

	try {
		// eslint-disable-next-line
		const json = require(url);

		if (json) {
			return json;
		}
	} catch (err) {
		log(err, 'red');
	}

	return {};
};

const saveJson = (url, data) => {
	log(`'saveJson: ${url}`);

	try {
		jsonfile.writeFileSync(url, data);

		log(`${url} updated`);
		return true;
	} catch (err) {
		log(`${url} NOT updated!`);

		log(err, 'red');

		return false;
	}
};

const getPkg = () => {
	log('getPkg');

	const pkgPath = path.join(cwdRoot, 'package.json');
	const pkg = loadJson(pkgPath);

	return {data: pkg, path: pkgPath};
};

const init = () => {
	log('init');

	const pkg = getPkg();

	if (!Reflect.has(pkg, 'robonautDeps')) {
		pkg.data.robonautDeps = [];
		saveJson(pkg.path, pkg.data);
	}

	const roboModsDir = path.join(cwdRoot, 'robonaut_modules');
	const exists = dirExistsSync(roboModsDir);

	if (exists) {
		log(`init: ${roboModsDir} already exists`);
	} else {
		log(`init: creating ${roboModsDir}`);
		fs.mkdirSync(roboModsDir);
	}
};

const gather = deps => {
	const roboDeps = deps[0].split(',');

	log(`gather ${JSON.stringify(roboDeps)}`);

	const pkg = getPkg();

	console.log(pkg.data);

	for (dep of roboDeps) {
		if (pkg.data.robonautDeps.indexOf(dep) === -1) {
			pkg.data.robonautDeps.push(dep);
		}
	}

	saveJson(pkg.path, pkg.data);
};

const crosslink = props => {
};

const npm = props => {
};

const git = props => {
};

const exec = props => {
};

const prime = props => {
};

const transmit = props => {
};

const main = {
	init,
	gather,
	crosslink,
	npm,
	git,
	exec,
	prime,
	transmit
};

const stackCmds = args => {
	const cmds = [];

	for (let n = 0; n < args.length; n += 2) {
		const newCmd = [];
		newCmd.push(process.argv[n], process.argv[n + 1]);
		cmds.push(newCmd);
	}

	return cmds;
};

const processCmds = cmds => {
	log('Process Cmds');
	for (let cmd of cmds) {
		const cmdName = cmd.shift();

		if (Reflect.has(main, cmdName)) {
			main[cmdName](cmd);
		}
	}
};

const begin = args => {
	log('Begin');

	// Remove the first 2 args [path, script]
	args.shift();
	args.shift();

	const cmdStack = stackCmds(args);

	if (cmdStack && cmdStack.length > 0) {
		return processCmds(cmdStack);
	}

	return showHelp(args);
};

// Exports for tests
module.exports = {
	begin
};

if (process.stdin.isTTY) {
	begin(process.argv);
}

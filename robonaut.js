#!/usr/bin/env node

var fs = require('fs-extra')
const path = require('path');
const childProcess = require('child_process');

const chalk = require('chalk');
const jsonfile = require('jsonfile');
const packageJson = require('package-json');
const gitRevSync = require('git-rev-sync');

jsonfile.spaces = 4;

// 📡🛰👽👾🎮📦☄🌚

const strap = chalk.bgGreen.black.bold(' Robonaut ');
const cwdRoot = process.cwd();

const log = (msg, col) => {
	let logMsg;
	if (typeof msg === 'string') {
		logMsg = `${strap} ${chalk[col || 'white'](msg)}`;
	} else if (typeof msg === 'object') {
		logMsg = `${strap} ${chalk[col || 'white'](JSON.stringify(msg))}`;
	}

	console.log(logMsg);

	return logMsg;
};

const showHelp = () => {
	log('robonaut help');
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

const skyjack = deps => {
	const roboDeps = deps[0].split(',');

	log(`skyjack: ${JSON.stringify(roboDeps)}`);

	const pkg = getPkg();

	let depsAdded = 0;

	if (!Reflect.has(pkg, 'data') || !Reflect.has(pkg.data, 'robonautDeps')) {
		throw log(`skyjack: failed, no robonautDeps in package (try 'robonaut init')`);
	}

	for (dep of roboDeps) {
		if (pkg.data.robonautDeps.indexOf(dep) === -1) {
			pkg.data.robonautDeps.push(dep);
			log(`skyjack: '${chalk.underline(dep)}' has been skyjacked`);
			depsAdded += 1;
		}
	}

	if (depsAdded > 0) {
		saveJson(pkg.path, pkg.data);
	} else {
		log(`skyjack: no new deps added`);
	}
};

const assemble = () => {
	decimate();

	const pkg = getPkg();

	if (!Reflect.has(pkg, 'data') ||
		!Reflect.has(pkg.data, 'robonautDeps') ||
		pkg.data.robonautDeps.length < 1) {
		throw log(`assembled: failed, no robonautDeps in package (try 'robonaut init')`);
	}

	const roboModsDir = path.join(cwdRoot, 'robonaut_modules');

	let cloned = 0;
	let installed = 0;
	let depCount = pkg.data.robonautDeps.length;

	const robonautDeps = pkg.data.robonautDeps;
	const depStack = {};

	const logAssembleResults = () => {
		// log(chalk.yellow.underline('ASSEMBLED...'));
		log(`assemble: ${chalk.cyan('ALL PACKAGES ASSEMBLED OK ✔  ')}`);
		// spawnNpmInstall(def);

		log('🏁  ' + chalk.yellow.underline('ASSEMBLED...'));
		for (name of robonautDeps) {
			const def = depStack[name];
			log(`${chalk.green(def.name)}: ${chalk.blue('  ')}@${def.gitHash} ${chalk.blue('  ')}@${def.version}  ${chalk.blue('✔')} `);
		};

	};

	const logFinishedClones = () => {
		log('🏁  ' + chalk.yellow.underline('CLONED...'));
		for (name of robonautDeps) {
			const def = depStack[name];
			const gitHash = gitRevSync.short(def.dir);
			def.gitHash = gitHash;
			log(`${chalk.green(name)} @${gitHash}`);
		};
	};

	const logFinishedInstalls = () => {
		log('🏁  ' + chalk.yellow.underline('INSTALLED...'));
		for (name of robonautDeps) {
			const version = depStack[name].version;
			log(`${chalk.green(name)} @${version}`);
		};
		logAssembleResults();
	};

	const spawnNpmInstall = name => {
		const def = depStack[name];

		def.npmInstallOpts = {
			cwd: def.dir,
			// detached: true,
			stdio: ['ignore', 1, 2]
		};

		def.npmInstallArgs = ['install'];
		def.npmInstall = childProcess.spawn('npm', def.npmInstallArgs, def.npmInstallOpts);

		log(`assemble: 📡  ${chalk.yellow('npm install ' + name)}`);

		def.npmInstall.on('close', code => {
			// log(`assemble: npm install 📦  ${chalk.green(def.name)} ${chalk.cyan('✔')} `);
			log(`assemble: npm install ${chalk.cyan('')}  ${chalk.green(def.name)} ${chalk.cyan('✔')} `);

			installed += 1;

			if (installed === depCount) {
				logFinishedInstalls();
			}
		});
	};

	const queueInstalls = () => {
		for (depName of robonautDeps) {
			spawnNpmInstall(depName);
		}
	};

	const spawnGitClone = json => {
		const name = json.name;
		const def = depStack[name];

		def.dir = path.join(roboModsDir, json.name);
		def.repo = json.repository.url.replace('git+', '');
		def.version = json.version;
		def.json = json;

		def.gitCloneOpts = {
			cwd: roboModsDir,
			stdio: ['ignore', 1, 2]
		};

		def.gitCloneArgs = ['clone', def.repo];
		def.gitClone = childProcess.spawn('git', def.gitCloneArgs, def.gitCloneOpts);

		log(`assemble: 📡  ${chalk.yellow('git clone ' + json.name)}`);

		def.gitClone.on('close', code => {
			cloned += 1;

			const doneMsg = `assemble: git clone ${chalk.cyan('')}  ${chalk.green(def.name)} ${chalk.cyan('✔')}`;
			log(doneMsg);

			if (cloned === depCount) {
				logFinishedClones();
				queueInstalls();
			}
		});
	};

	const fetchPackages = () => {
		for (depName of robonautDeps) {
			const depDef = {
				name: depName,
			};

			depStack[depName] = depDef;

			packageJson(depName, 'latest')
			.then(function (json) {
				spawnGitClone(json);
			})
			.catch(err => {
				throw err;
			});
		}
	};

	fetchPackages();
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
	//git status -s
};

const transmit = props => {
};

const decimate = () => {
	log(`🔥  decimating...`);
	const roboModsDir = path.join(cwdRoot, 'robonaut_modules');
	fs.removeSync(roboModsDir);
	fs.mkdirSync(roboModsDir);
	log(`decimate: ${chalk.green(roboModsDir)} ${chalk.bgGreen.black(' DECIMATED OK ')} 👍  `);
};

const main = {
	init,
	skyjack,
	assemble,
	crosslink,
	npm,
	git,
	exec,
	prime,
	decimate,
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

	let validCmds = 0;

	for (let cmd of cmds) {
		const cmdName = cmd.shift();

		if (Reflect.has(main, cmdName)) {
			validCmds += 1;
			main[cmdName](cmd);
		}
	}

	if (validCmds === 0) {
		showHelp();
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

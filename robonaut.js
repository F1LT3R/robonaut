#!/usr/bin/env node

var fs = require('fs-extra')
const path = require('path');
const childProcess = require('child_process');

const chalk = require('chalk');
const jsonfile = require('jsonfile');
const packageJson = require('package-json');
const gitRevSync = require('git-rev-sync');
const Promise = require('bluebird');
const charm = require('promise-charm');

var term = require( 'terminal-kit' ).terminal ;

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

const chars = (n, char) => {
	let str = '';

	for (let i = 0; i < n; i += 1) {
		str += char;
	}

	return str;
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
	// log(`'loadJson: ${url}`); // trace

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

const embed = () => {
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

const prime = deps => {
	const roboDeps = deps[0].split(',');

	log(`prime: ${JSON.stringify(roboDeps)}`);

	const pkg = getPkg();

	let depsAdded = 0;

	if (!Reflect.has(pkg, 'data') || !Reflect.has(pkg.data, 'robonautDeps')) {
		throw log(`prime: failed, no robonautDeps in package (try 'robonaut init')`);
	}

	for (dep of roboDeps) {
		if (pkg.data.robonautDeps.indexOf(dep) === -1) {
			pkg.data.robonautDeps.push(dep);
			log(`prime: '${chalk.underline(dep)}' has been primeed`);
			depsAdded += 1;
		}
	}

	if (depsAdded > 0) {
		saveJson(pkg.path, pkg.data);
	} else {
		log(`prime: no new deps added`);
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
		log(`assemble: ${chalk.cyan('ALL PACKAGES ASSEMBLED OK ✔  ')}`);

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

		let hasEnded = false;
		const ended = code => {
			hasEnded = true;

			// log(`assemble: npm install 📦  ${chalk.green(def.name)} ${chalk.cyan('✔')} `);
			log(`assemble: npm install ${chalk.cyan('')}  ${chalk.green(def.name)} ${chalk.cyan('✔')} `);

			installed += 1;

			if (installed === depCount) {
				logFinishedInstalls();
			}
		};
		def.npmInstall.on('close', code => {
			if (!hasEnded) {
				ended();
			}
		});
		def.npmInstall.on('exit', code => {
			if (!hasEnded) {
				ended();
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

		let hasEnded = false;
		const ended = code => {
			hasEnded = true;
			cloned += 1;

			const doneMsg = `assemble: git clone ${chalk.cyan('')}  ${chalk.green(def.name)} ${chalk.cyan('✔')}`;
			log(doneMsg);

			if (cloned === depCount) {
				logFinishedClones();
				queueInstalls();
			}
		};

		def.gitClone.on('close', code => {
			if (!hasEnded) {
				ended();
			}
		});
		def.gitClone.on('exit', code => {
			if (!hasEnded) {
				ended();
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

const fuse = props => {
	const pkg = getPkg();

	const deps = pkg.data.robonautDeps;
	const roboModsDir = path.join(cwdRoot, 'robonaut_modules');

	const packages = {};
	const linkMap = {};
	let toLinked = 0;
	let linkedIn = 0;
	let linkedInsExpected = 0;

	for (name of deps) {
		const pkgPath = path.join(roboModsDir, name, 'package.json');
		packages[name] = loadJson(pkgPath);
	}

	for (toLink of deps) {
		Reflect.ownKeys(packages).forEach(insideOf => {
			const dep = packages[insideOf];

			if (Reflect.has(dep, 'dependencies') &&
				Reflect.has(dep.dependencies, toLink)) {
				const linkMsg = '🔗  ' + chalk.cyan(toLink) + ' should be linked inside of: ' + chalk.cyan(insideOf);
				log(linkMsg);

				if (!Reflect.has(linkMap, toLink)) {
					linkMap[toLink] = {};
				}

				if (!Reflect.has(linkMap[toLink], insideOf)) {
					linkMap[toLink][insideOf] = 0;
				}

				linkMap[toLink][insideOf] += 1;
				linkedInsExpected += 1;
			}
		});
	}


	const logFinishedLinks = () => {
		log('🏁  ' + chalk.yellow.underline('LINKED...'));

		const invertedMap = {};

		Reflect.ownKeys(linkMap).forEach(toLink => {
			Reflect.ownKeys(linkMap[toLink]).forEach((insideOf, idx) => {
				if (!Reflect.has(invertedMap, insideOf)) {
					invertedMap[insideOf] = {};
				}
				if (!Reflect.has(invertedMap, insideOf[toLink])) {
					invertedMap[insideOf][toLink] = true;
				}
			});
		});

		Reflect.ownKeys(invertedMap).forEach(parentPkg => {
			// «
			const linkMsg = parentPkg + chalk.yellow(' ⇠ ') + chalk.green('━┓');
			console.log(linkMsg);
			const space = chars(linkMsg.length - 21, ' ');

			const childKeys = Reflect.ownKeys(invertedMap[parentPkg]);
			childKeys.forEach((childPkg, idx) => {
				if (idx === childKeys.length - 1) {
					console.log(space + chalk.green('┗━') + chalk.yellow(' ⇠ ') + childPkg);
				} else {
					console.log(space + chalk.green('┣━') + chalk.yellow(' ⇠ ') + childPkg);
				}
			});
		});
	};

	const spawnNpmLinkIn = (toLink, insideOf) => {
		const dir = path.join(roboModsDir, insideOf);

		const npmLinkInOpts = {
			cwd: dir,
			stdio: ['ignore', 1, 2]
		};

		const npmLinkInArgs = ['link', toLink];
		const npmLinkIn = childProcess.spawn('npm', npmLinkInArgs, npmLinkInOpts);

		log(`fuse: 📡  ${chalk.red('cd ') + chalk.yellow(insideOf) + chalk.red(' && ') + chalk.yellow('npm link ' + toLink)}`);

		npmLinkIn.on('close', code => {
			linkedIn += 1;

			const doneMsg = `fuse: npm link 🔗  ${chalk.green(toLink)} ${chalk.blue('linked-in >')} ${chalk.green(insideOf)} ${chalk.cyan('✔')} `;
			log(doneMsg);

			if (linkedIn === linkedInsExpected) {
				logFinishedLinks();
			}
		});
	};

	const linkIn = () => {
		Reflect.ownKeys(linkMap).forEach(toLink => {
			Reflect.ownKeys(linkMap[toLink]).forEach(insideOf => {
				spawnNpmLinkIn(toLink, insideOf);
			});
		});
	};

	const spawnNpmToLink = link => {
		const dir = path.join(roboModsDir, link);

		const npmToLinkOpts = {
			cwd: dir,
			stdio: ['ignore', 1, 2]
		};

		const npmToLinkArgs = ['link'];
		const npmToLink = childProcess.spawn('npm', npmToLinkArgs, npmToLinkOpts);

		log(`fuse: 📡  ${chalk.red('cd ') + chalk.yellow(link) + chalk.red(' && ') + chalk.yellow('npm link')}`);

		npmToLink.on('close', code => {
			toLinked += 1;

			const doneMsg = `fuse: npm link 🔗  ${chalk.green(link)} ${chalk.cyan('✔')} ${chalk.cyan('linked-out >')}`;
			log(doneMsg);

			if (Reflect.ownKeys(linkMap).length === toLinked) {
				linkIn();
			}
		});
	};

	const linkOut = () => {
		Reflect.ownKeys(linkMap).forEach(toLink => {
			spawnNpmToLink(toLink);
		});
	};

	linkOut();
};

const scan = silent => new Promise((resolve, reject) => {
	// console.log(!!silent);
	// console.log(silent);

	const pkg = getPkg();

	const deps = pkg.data.robonautDeps;
	const roboModsDir = path.join(cwdRoot, 'robonaut_modules');

	const spawnGitDiff = dir => new Promise((resolve, reject) => {
		const gitDiffOpts = {
			cwd: dir,
			// stdio: ['ignore', 1, 2]
		};

		gitDiffArgs = [
			'diff',
			// '--name-only',
			'--word-diff=color',
			'--color=always',
			'-U1',
			// '--minimal',
			'--ws-error-highlight=new,old'

		];

		const gitDiffCmd = childProcess.spawn('git', gitDiffArgs, gitDiffOpts);

		let retData = '';

		gitDiffCmd.stdout.on('data', data => {
			retData += data;
		});

		gitDiffCmd.stderr.on('data', data => {});

		gitDiffCmd.on('close', code => {
			resolve(retData);
		});
	});

	const spawnGitStatus = dir => new Promise((resolve, reject) => {
		const gitStatusOpts = {
			cwd: dir,
			// stdio: ['ignore', 1, 2]
		};

		gitStatusArgs = [
			'status',
			'-s',
			// '-b'
		];

		const gitStatusCmd = childProcess.spawn('git', gitStatusArgs, gitStatusOpts);

		let retData = '';

		gitStatusCmd.stdout.on('data', data => {
			retData += data;
		});

		gitStatusCmd.stderr.on('data', data => {});

		gitStatusCmd.on('close', code => {
			resolve(retData);
		});
	});


	const promises = [];

	for (name of deps) {
		const pkgPath = path.join(roboModsDir, name);
		promises.push(spawnGitStatus(pkgPath));
		promises.push(spawnGitDiff(pkgPath));
	}

	charm(promises)
	.then(results => {
		const changeStack = [];

		results.forEach((result, idx) => {
			if (idx % 2 === 0 && result) {
				changeStack.push(deps[idx/2]);
			}

			if (!silent) {
				if (idx % 2 === 0 && result) {
					console.log('' + chalk.bold.bgMagenta.white.underline(` ${deps[idx / 2].toUpperCase()} `));
					console.log('\n ' + chalk.bgRed.white.bold(' STATUS '));
					console.log(result);
				} else if(result) {
					console.log('\n ' + chalk.bgRed.white.bold(' DIFF '));
					console.log(' ' + result.replace(/\n/g, '\n '));
				}
			}
		});

		resolve(changeStack);
	})
	.catch(err => {
		throw err;
	});
});

const numerate = props => {
	// const pkg = getPkg();
	// const deps = pkg.data.robonautDeps;
	const roboModsDir = path.join(cwdRoot, 'robonaut_modules');

	let longestName = 0;

	const numeration = {
		major: 0,
		minor: 0,
		patch: 0,
		// release: undefined,
		// release: 'alpha',
		// build: undefined
		// build: 'a4b23C33'
	};

	let cursor = 'patch';

	const select = which => {
		Reflect.ownKeys(numeration).forEach(key => {
			numeration[key] = 0;
		});

		numeration[which] = 1;
	};

	select(cursor);

	const x = k => {
		return numeration[k] ? 'yellow' : 'cyan';
	};

	const y = k => {
		return numeration[k] ? 'italic' : 'bold';
	};

	const col = (k, v) => {
		return chalk[y(k)][x(k)](v[k]);
	}

	const colz = (k, str) => {
		return chalk[y(k)][x(k)](str);
	}

	const bg = k => {
		const isSelected = cursor === k;
		const retCol = isSelected ? 'bgYellow' : 'bgBlack';
		return retCol;
	};

	const fg = k => {
		const isSelected = cursor === k;
		const retCol = isSelected ? 'black' : 'italic';
		return retCol;
	};

	const csel = (k, str) => {
		return chalk[bg(k)][fg(k)](str);
	}

	const spaced = (name, len, flip, char) => {
		const nDiff = (len || longestName) - name.length;
		if (flip) {
			return name + chars(nDiff, char || ' ');
		}

		return chars(nDiff, char || ' ') + name;
	};

	var separators = ['\\.', '-', '\\+'];

	const unpackVer = versionStr => {
		const parts = versionStr.split(new RegExp(separators.join('|'), 'g'));

		const version = {
			major: parseInt(parts[0], 10),
			minor: parseInt(parts[1], 10),
			patch: parseInt(parts[2], 10),
			release: parts[3],
			build: parts[4],
		};

		return version;
	};

	const packVer = (v, color) => {
		let versionStr = '';

		if (color) {
			versionStr += col('major', v) + '.';
			versionStr += col('minor', v) + '.';
			versionStr += col('patch', v);

			// if (!!v.release) {
			// 	versionStr += '-' + col('release', v);
			// }

			// if (!!v.build) {
			// 	versionStr += '-' + col('build', v);
			// }
		} else {
			versionStr += v['major'] + '.';
			versionStr += v['minor'] + '.';
			versionStr += v['patch'];
		}

		return versionStr;
	};

	const computeVer = version => {
		const updatedVer = {
			major: version.major + numeration.major,
			minor: version.minor + numeration.minor,
			patch: version.patch + numeration.patch,
		};

		if (numeration.major) {
			updatedVer.minor = 0;
			updatedVer.patch = 0;
		}

		if (numeration.minor){
			updatedVer.patch = 0;
		}

		return updatedVer;
	};

	const updatedVersionMap = {};

	const delin = versionStr => {
		const oldVer = unpackVer(versionStr);
		const newVer = computeVer(oldVer);
		return newVer;
	};

	const line = (...deets) => {
		const [name, version] = deets;
		const updatedVersion = delin(version);
		updatedVersionMap[name] = packVer(updatedVersion);
		const nextVerColor = packVer(updatedVersion, true);
		console.log(` ${chalk.blue(name)} ${chalk.dim('(' + version + ')')} » ${nextVerColor}`);
	};

	const ul = chalk.underline;

	const sel   = '   +   ';
	const desel = '_______';


	scan(true).then(changeStack => {
		const printStack = () => {
			let parts1 = '\n';
			parts1 += ' ' + colz('major', csel('major', ' Major ')) + '';
			parts1 += ' ' + colz('minor', csel('minor', ' Minor ')) + '';
			parts1 += ' ' + colz('patch', csel('patch', ' Patch ')) + '';
			// parts1 += ' ' + colz('release', csel('release', ' Pre-Release ')) + '';
			// parts1 += ' ' + colz('build', csel('build', ' Build  ')) + '';

			let parts2 = '';
			parts2 += ' ' + colz('major', !!numeration['major'] ? sel : desel) + '';
			parts2 += ' ' + colz('minor',  !!numeration['minor'] ? sel : desel) + '';
			parts2 += ' ' + colz('patch',  !!numeration['patch'] ? sel : desel) + '';
			// parts2 += ' ' + colz('release', !!numeration['release'] ? csel('release', spaced(numeration['release'], 13, true)) : unselected('_____________'));
			// parts2 += ' ' + colz('build',   !!numeration['build']   ? csel('build', spaced(numeration['build'], 8, true)) : unselected('________'));

			console.log(parts1);
			console.log(parts2);

			changeStack.forEach(name => {
				const modPath = path.join(roboModsDir, name);
				const pkgPath = path.join(modPath, 'package.json');
				const hash = gitRevSync.short(pkgPath);
				const branch = gitRevSync.branch(pkgPath);
				const version = loadJson(pkgPath).version;
				line(spaced(name), version);
			});
		}

		term.grabInput();

		const numeKeys = Reflect.ownKeys(numeration);
		const numeLen = numeKeys.length;
		let cursorIdx = numeKeys.indexOf(cursor);

		const setCursor = () => {
			cursor = numeKeys[cursorIdx];
			select(cursor);
			console.log('\x1b\x5b' + (changeStack.length + 4) + '\x41');
			printStack();
		};

		term.on('key', (name, matches, data) => {
			// console.log(name);

			if (name === 'ENTER') {
				console.log(updatedVersionMap);
			}

			if (name === 'CTRL_C') {
				process.exit();
			}

			if (name === 'LEFT') {
				cursorIdx -= 1;
				if (cursorIdx < 0) {
					cursorIdx = numeLen - 1;
				}
				setCursor();
			}

			if (name === 'RIGHT') {
				cursorIdx += 1;
				if (cursorIdx > numeLen - 1) {
					cursorIdx = 0;
				}
				setCursor();
			}
		});

		changeStack.forEach(name => {
			if (name.length > longestName) {
				longestName = name.length;
			}
		});

		// changeStack.forEach(name => {
		// 	const modPath = path.join(roboModsDir, name);
		// 	const pkgPath = path.join(modPath, 'package.json');
		// 	const hash = gitRevSync.short(pkgPath);
		// 	const branch = gitRevSync.branch(pkgPath);
		// 	const version = loadJson(pkgPath).version;
		// 	console.log(`${chalk.blue(spaced(name))}  ${chalk.yellow(branch)} # ${chalk.cyan(hash)} @ ${chalk.red(version)}`);
		// });



		// const promises = [];

		// for (name of deps) {
		// 	const modPath = path.join(roboModsDir, name);
		// 	const pkgPath = path.join(modPath, 'package.json');
		// 	const gitHash = gitRevSync.short(pkgPath);
		// 	const npmVer = loadJson(pkgPath).version;
		// 	console.log(`${name} @${npmVer} #${gitHash}`);
		// }
		printStack();
	}).catch(err => {
		throw err;
	});

};


const transmit = props => {
};

const decimate = () => {
	log(`🔥  Decimating...`);
	const roboModsDir = path.join(cwdRoot, 'robonaut_modules');
	fs.removeSync(roboModsDir);
	fs.mkdirSync(roboModsDir);
	log(`decimate: ${chalk.green(roboModsDir)} ${chalk.bgGreen.black(' DECIMATED OK ')} 👍  `);
};

const npm = props => {
};

const git = props => {
};

const exec = props => {
};

const main = {
	// Robonaut Commands
	embed,
	prime,
	assemble,
	fuse,
	scan,
	numerate,
	transmit,
	decimate,

	// NPM/Git/CLI Proxy Commands
	npm,
	git,
	exec
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
			// main[cmdName](cmd);
			main[cmdName]();
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

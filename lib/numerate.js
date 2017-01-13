const path = require('path');

const chalk = require('chalk');
const gitRevSync = require('git-rev-sync');
const term = require('terminal-kit');

module.exports = (settings, ...args) => {
	const [log, file, spawn, main, helpers] = args;

	const numerate = roboRoot => new Promise((resolve, reject) => {
		const roboModsDir = path.join(roboRoot, settings.modulesDir);
		// const project = file.getProject(roboRoot);
		// const dependencies = project.dependencies;
		// const depKeys = Reflect.ownKeys(dependencies);

		let longestName = 0;

		const numeration = {
			major: 0,
			minor: 0,
			patch: 0
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
		};

		const colz = (k, str) => {
			return chalk[y(k)][x(k)](str);
		};

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
		};

		const spaced = (name, len, flip, char) => {
			const nDiff = (len || longestName) - name.length;
			if (flip) {
				return name + helpers.chars(nDiff, char || ' ');
			}

			return helpers.chars(nDiff, char || ' ') + name;
		};

		const separators = ['\\.', '-', '\\+'];

		const unpackVer = versionStr => {
			const parts = versionStr.split(new RegExp(separators.join('|'), 'g'));

			const version = {
				major: parseInt(parts[0], 10),
				minor: parseInt(parts[1], 10),
				patch: parseInt(parts[2], 10),
				release: parts[3],
				build: parts[4]
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
				versionStr += v.major + '.';
				versionStr += v.minor + '.';
				versionStr += v.patch;
			}

			return versionStr;
		};

		const computeVer = version => {
			const updatedVer = {
				major: version.major + numeration.major,
				minor: version.minor + numeration.minor,
				patch: version.patch + numeration.patch
			};

			if (numeration.major) {
				updatedVer.minor = 0;
				updatedVer.patch = 0;
			}

			if (numeration.minor) {
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
			const [name, branch, version] = deets;
			const updatedVersion = delin(version);
			updatedVersionMap[name.replace(/\s/g, '')] = packVer(updatedVersion);
			const nextVerColor = packVer(updatedVersion, true);
			console.log(chalk.blue(name) + chalk.cyan('  ') + chalk.magenta(branch) + ` ${chalk.dim('(' + version + ')')} » ${nextVerColor}                `);
		};

		const sel = '   +   ';
		const desel = '_______';

		const updatePkgs = versionMap => {
			Reflect.ownKeys(versionMap).forEach(key => {
				const modPath = path.join(roboModsDir, key);
				const pkgPath = path.join(modPath, 'package.json');
				const pkgJson = file.loadJson(pkgPath);

				const oldVersion = pkgJson.version;
				const newVersion = versionMap[key];

				pkgJson.version = newVersion;
				file.saveJson(pkgPath, pkgJson);

				log.info(`NUMERATED: ${chalk.blue(key)} ${chalk.dim('(' + oldVersion + ')')} » ${chalk.green(newVersion)} ` + chalk.blue('✔'));
			});

			file.updateProjectDepsJson(roboRoot);
		};

		const beginNumerateControl = () => {
			main.scan(roboRoot, true)
			.then(results => {
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

					results.dependencies.forEach((depName, idx) => {
						// Two commands are used to scan, so filter out doubles
						if (idx % 2 === 0) {
							const modPath = path.join(roboModsDir, depName);
							const pkgPath = path.join(modPath, 'package.json');
							const branch = gitRevSync.branch(pkgPath);
							const version = file.loadJson(pkgPath).version;
							line(spaced(depName), branch, version);
						}
					});

					console.log(); // blank line
				};

				term.terminal.grabInput();

				const numeKeys = Reflect.ownKeys(numeration);
				const numeLen = numeKeys.length;
				let cursorIdx = numeKeys.indexOf(cursor);

				const setCursor = () => {
					cursor = numeKeys[cursorIdx];
					select(cursor);
					console.log('\x1b\x5b' + (results.commands.length - 5) + '\x41');
					printStack();
				};

				term.terminal.on('key', (name, matches, data) => {
					// console.log(name);

					if (name === 'ENTER') {
						term.terminal.processExit();
						updatePkgs(updatedVersionMap);
					}

					if (name === 'ESCAPE') {
						log.info('enumerate: ' + chalk.red('[CANCELLED]'));
						term.terminal.processExit();
					}

					if (name === 'CTRL_C') {
						log.info('enumerate: ' + chalk.red('[CANCELLED]'));
						term.terminal.processExit();
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

				results.dependencies.forEach(name => {
					if (name.length > longestName) {
						longestName = name.length;
					}
				});

				printStack();
			}).catch(err => {
				throw err;
			});
		};

		main.current(roboRoot, true)
		.then(results => {
			if (results.count > 0) {
				log.error('You dependencies are not current.');
				log.info('Try: "robonaut sync". (there may be conflicts)');
				reject(results);
			} else {
				beginNumerateControl();
			}
		}).catch(err => {
			console.log(err);
			reject(err);
		});
	});

	return numerate;
};

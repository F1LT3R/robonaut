const path = require('path');

const splint = str => {
	const parts = str.split('.');

	const version = parts.map(val => {
		return parseInt(val, 10);
	});

	return version;
};

const isLocalVersionOld = (local, remote) => {
	const l = splint(local);
	const r = splint(remote);

	if (l[0] < r[0]) {
		return true;
	}

	if (l[0] === r[0] && l[1] < r[1]) {
		return true;
	}

	if (l[1] === r[1] && l[2] < r[2]) {
		return true;
	}

	return false;
};

module.exports = (settings, ...args) => {
	const [log, file, spawn] = args;

	const commandType = 'current';

	const current = (roboRoot, silent) => new Promise((resolve, reject) => {
		// PHASE 1 - Check remote Git repo commits are not ahead of local
		// PHASE 2 - Check local NPM version is not older than registry

		const project = file.getProject(roboRoot);
		const dependencies = project.dependencies;
		const depKeys = Reflect.ownKeys(dependencies);

		const notCurrentGit = {};
		const notCurrentNpm = {};

		let errorCount = 0;

		const gitReposAreCurrent = () => new Promise((resolve, reject) => {
			if (!silent) {
				log.info('CURRENT: Checking local git repos are up to date with remotes...');
			}

			const commands = file.generateCommands(roboRoot, commandType);

			spawn.stack(commands).then(results => {
				results.stdout.forEach((stdout, idx) => {
					let ridx = parseInt(idx / 2, 10);

					if (stdout.length > 0) {
						if (!silent) {
							log.error(`✖ OUTDATED: ${log.ul(depKeys[ridx])} ${log.hl('git repo')}`, 'red');
							log.error('Remote commits...');
							console.log(stdout);
						}
						errorCount += 1;
						notCurrentGit[depKeys[ridx]] = true;
					} else if (stdout.length < 1 && !silent) {
						log.info(`✔ CURRENT: ${log.ul(depKeys[ridx])} ${log.hl('git repo')}`, 'green');
					}
				});

				resolve(results);
			}).catch(err => {
				console.log(err);
				reject(err);
			});
		});

		const npmVersionsAreCurrent = () => new Promise((resolve, reject) => {
			if (!silent) {
				log.info('CURRENT: Checking local NPM packages are up to date with the registry...');
			}

			let count = depKeys.length;
			let current = 0;

			const notCurrent = [];

			depKeys.forEach(dependency => {
				const registryDep = dependencies[dependency];
				const depPath = path.join(roboRoot, settings.modulesDir, dependency);

				if (!file.dirExistsSync(depPath)) {
					if (!silent) {
						log.error(`CURRENT: ${depPath} does not exist!`);
						log.info(`Try: '${log.hl('robonaut assemble')}'`);
					}

					return reject();
				}

				const localDepJsonPath = path.join(roboRoot, settings.modulesDir, dependency, 'package.json');
				const localDepJson = file.loadJson(localDepJsonPath);

				const localIsOutOfDate = isLocalVersionOld(localDepJson.version, registryDep.version);

				if (localIsOutOfDate) {
					if (!silent) {
						log.error(`✖ OUTDATED: ${log.ul(registryDep.name)} ${log.hl('package.json')}`, 'red');

						log.info(`Local: ${log.hl(localDepJson.version)} < Remote: ${log.hl(registryDep.version)}`);

						log.info(`NOT CURRENT: '${log.hl(registryDep.name)}' should be at version: ${log.hl(registryDep.version)}!`);
						log.info(`NOT CURRENT: Your local '${log.hl(registryDep.name)}' is only at version: ${log.hl(localDepJson.version)}!`);
						log.info(`Try: '${log.hl('robonaut sync')}'`, 'green');
						errorCount += 1;
					}

					// notCurrent.push(dependency);
					notCurrentNpm[dependency] = true;
				} else {
					if (!silent) {
						log.info(`✔ CURRENT: ${log.ul(registryDep.name)} ${log.hl('package.json')}`, 'green');
					}
					current += 1;
				}
			});

			if (current === count) {
				if (!silent) {
					log.info('CURRENT: All npm dependencies are newer than their registry counterparts :)', 'green');
				}

				resolve(true);
			} else {
				if (!silent) {
					log.error('CURRENT: Some npm dependencies are older their registry counterparts :(');
				}

				resolve(notCurrent);
			}
		});

		gitReposAreCurrent()
		.then(() => {
			npmVersionsAreCurrent()
			.then(() => {
				const outdated = {
					git: Reflect.ownKeys(notCurrentGit),
					npm: Reflect.ownKeys(notCurrentNpm)
				};

				if (!silent && errorCount > 0) {
					log.info(`CURRENT: Found ${errorCount} dependenc(y/ies) to be out of date.`);

					outdated.git.forEach(dep => {
						log.error(`✖ OUTDATED: (git) ${log.ul(dep)}`);
					});

					outdated.npm.forEach(dep => {
						log.error(`✖ OUTDATED: (npm) ${log.ul(dep)}`);
					});

					log.info('Try: "robonaut sync" to update these dependenceis. (there may be conflicts)');
				}

				resolve(outdated);
			})
			.catch(err => {
				console.log(err);
				reject(err);
			});
		})
		.catch(err => {
			console.log(err);
			reject(err);
		});
	});

	return current;
};


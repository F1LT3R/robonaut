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
	const [log, file] = args;

	const current = (roboRoot, silent) => new Promise((resolve, reject) => {
		const project = file.getProject(roboRoot);
		const dependencies = project.dependencies;
		const depKeys = Reflect.ownKeys(dependencies);

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
					return reject();
				}
			}

			const localDepJsonPath = path.join(roboRoot, settings.modulesDir, dependency, 'package.json');
			const localDepJson = file.loadJson(localDepJsonPath);

			const localIsOutOfDate = isLocalVersionOld(localDepJson.version, registryDep.version);

			if (localIsOutOfDate) {
				if (!silent) {
					log.error(`NOT CURRENT: Package '${registryDep.name}' is not current!`);

					log.info(`Local: ${log.hl(localDepJson.version)} < Remote: ${log.hl(registryDep.version)}`);

					log.info(`NOT CURRENT: '${log.hl(registryDep.name)}' should be at version: ${log.hl(registryDep.version)}!`);
					log.info(`NOT CURRENT: Your local '${log.hl(registryDep.name)}' is only at version: ${log.hl(localDepJson.version)}!`);
					log.info(`Try: '${log.hl('robonaut sync')}'`, 'green');
				}
				notCurrent.push(dependency);
			} else {
				current += 1;
			}
		});

		if (current === count) {
			log.info('CURRENT: All your robonaut npm dependencies are newer than their registry counterparts.', 'green');
			resolve(true);
		} else {
			resolve(notCurrent);
		}
	});

	return current;
};


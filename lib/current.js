const path = require('path');

module.exports = (settings, ...args) => {
	const [log, file] = args;

	const current = (roboRoot, silent) => new Promise((resolve, reject) => {
		file.getDepsInfo(roboRoot)
		.then(dependencies => {
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

				if (registryDep.version === localDepJson.version) {
					current += 1;
				} else {
					if (!silent) {
						log.error(`NOT CURRENT: Package '${registryDep.name}' is not current!`);
						log.info(`NOT CURRENT: '${log.hl(registryDep.name)}' should be at version: ${log.hl(registryDep.version)}!`);
						log.info(`NOT CURRENT: Your local '${log.hl(registryDep.name)}' is only at version: ${log.hl(localDepJson.version)}!`);
						log.info(`Try: '${log.hl('robonaut sync')}'`, 'green');
					}
					notCurrent.push(dependency);
				}
			});

			if (current === count) {
				log.info('CURRENT: All your robonaut dependencies are up-to-date!', 'green');
				resolve(true);
			} else {
				resolve(notCurrent);
			}
		})
		.catch(reject);
	});

	return current;
};


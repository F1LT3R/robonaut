module.exports = (settings, ...args) => {
	const [log, file, spawn, main] = args;

	const sync = roboRoot => new Promise((resolve, reject) => {
		log.info('SYNC: Checking ifA; dependencies are current using "CURRENT" ...');

		main.current(roboRoot, true).then(outdated => {
			const filter = outdated;

			// console.log(outdated);
			// process.exit();

			let commandStack = [];

			if (Reflect.has(filter, 'npm') && filter.npm.length > 0) {
				const commandType = ['sync', 'npm'];
				const commands = file.generateCommands(roboRoot, commandType, filter.git);
				commandStack = commandStack.concat(commands);
			}

			if (Reflect.has(filter, 'git') && filter.git.length > 0) {
				const commandType = ['sync', 'git'];
				const commands = file.generateCommands(roboRoot, commandType, filter.git);
				commandStack = commandStack.concat(commands);
			}

			// console.log(commandStack);

			spawn.stack(commandStack)
			.then(results => {
				log.info('SYNC: Local dependencies synced with remotes.');
				log.report(results);
				file.updateProjectDepsJson(roboRoot);
				log.info(`SYNC: Done.`);
				resolve(results);
			})
			.catch(err => {
				console.log(err);
				reject(err);
			});
		});
	});

	return sync;
};


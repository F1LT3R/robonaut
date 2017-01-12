module.exports = (settings, ...args) => {
	const [log, file, spawn, main] = args;

	const commandType = 'sync';

	const current = roboRoot => new Promise((resolve, reject) => {
		main.current(roboRoot, true).then(outdated => {
			const filter = outdated;

			file.generateCommands(roboRoot, commandType, filter)
			.then(commands => {
				spawn.stack(commands)
				.then(results => {
					log.report(results);
					resolve(results);
				})
				.catch(reject);
			})
			.catch(reject);
		})
		.catch(reject);
	});

	return current;
};


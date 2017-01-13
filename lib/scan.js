module.exports = (settings, ...args) => {
	const [log, file, spawn] = args;

	const commandType = 'scan';

	const scan = (roboRoot, silent) => new Promise((resolve, reject) => {
		const commands = file.generateCommands(roboRoot, commandType);

		// process.exit();

		spawn.stack(commands).then(results => {
			if (!silent) {
				results.commands.forEach((result, idx) => {
					log.info(results.commandsColor[idx]);
					console.log(results.stdout[idx]);
				});
			}

			resolve(results);
		}).catch(err => {
			console.log(err);
			reject(err);
		});
	});

	return scan;
};


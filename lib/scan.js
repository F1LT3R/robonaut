module.exports = (settings, ...args) => {
	const [log, file, spawn] = args;

	const commandType = 'scan';

	const scan = roboRoot => new Promise((resolve, reject) => {
		const commands = file.generateCommands(roboRoot, commandType);

		// console.log(commands);
		// process.exit();

		spawn.stack(commands).then(results => {
			// log.report(results);
			resolve(results);
		}).catch(err => {
			console.log(err);
		});
	});

	return scan;
};


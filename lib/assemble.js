module.exports = (settings, ...args) => {
	const [log, file, spawn] = args;

	const commandType = 'assemble';

	const assemble = roboRoot => new Promise((resolve, reject) => {
		const commands = file.generateCommands(roboRoot, commandType);

		spawn.stack(commands).then(results => {
			log.report(results);
			resolve(results);
		}).catch(reject);
	});

	return assemble;
};


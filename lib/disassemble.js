module.exports = (settings, ...args) => {
	const [log, file, spawn] = args;

	const commandType = 'disassemble';

	const assemble = roboRoot => new Promise((resolve, reject) => {
		file.generateCommands(roboRoot, commandType)
		.then(commands => {
			spawn.stack(commands).then(results => {
				log.report(results);
				resolve(results);
			}).catch(reject);
		})
		.catch(reject);
	});

	return assemble;
};


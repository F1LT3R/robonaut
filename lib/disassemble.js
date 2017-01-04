module.exports = (settings, ...args) => {
	const [log, file, spawn] = args;

	const commandType = 'disassemble';

	const disassemble = roboRoot => new Promise((resolve, reject) => {
		const commands = file.generateCommands(roboRoot, commandType);

		// console.log(commands);

		spawn.stack(commands).then(results => {
			log.report(results);
			resolve(results);
		}).catch(err => {
			console.log(err);
		});
	});

	return disassemble;
};


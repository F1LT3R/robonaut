const path = require('path');

module.exports = (settings, ...args) => {
	const [log, file, spawn, main, helpers] = args;

	const commandType = 'publish';

	const publish = roboRoot => new Promise((resolve, reject) => {
		const filter = 'roboroot';
		const commands = file.generateCommands(roboRoot, commandType, 'roboroot');

		// console.log(commands);
		// process.exit();

		spawn.stack(commands).then(results => {
			resolve(results);
		}).catch(err => {
			console.error(err);
			reject(err);
		});
	});

	return publish;
};

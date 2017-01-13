const path = require('path');

module.exports = (settings, ...args) => {
	const [log, file, spawn, main, helpers] = args;

	const commandType = 'transmit';

	const transmit = (roboRoot, commitMsg) => new Promise((resolve, reject) => {
		if (!commitMsg) {
			const errMsg = 'You must provide a commit message!';
			log.error(errMsg);
			log.info('Try: \'robonaut transmit "foobar"\'');
			return reject(errMsg);
		}

		const commands = file.generateCommands(roboRoot, commandType);

		// console.log(commands);
		// process.exit();

		spawn.stack(commands).then(results => {
			resolve(results);
		}).catch(err => {
			console.error(err);
			reject(err);
		});
	});

	return transmit;
};

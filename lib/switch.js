module.exports = (settings, ...args) => {
	const [log, file, spawn] = args;

	const _switch = roboRoot => new Promise((resolve, reject) => {
		// const commands = file.generateCommands(roboRoot, commandType);

		const commandSatck = {
			 checkout: {
			 	command: 'git',
			 	args: ['checkout', 'dependency
		};
	// - [ ] Switch
	// + [name]
	// 	+ git checkout [name]
	// 	+ [if no branch exists by name]
	// 		+ git pull
	// 		+ git checkout [name]
	// 		+ [if no branch exists on origin by name]
	// 			+ git checkout -b [name] (Create a working branch inside each repo)
	// 	+ [else]
	// 		+ git checkout -b [name] (Create a working branch inside each repo)


		console.log(commands);
		process.exit();

		spawn.stack(commands).then(results => {
			// log.report(results);
			resolve(results);
		}).catch(err => {
			console.log(err);
		});
	});

	return _switch;
};


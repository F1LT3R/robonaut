module.exports = (settings, ...args) => {
	const [log, file, spawn] = args;

	const _switch = (roboRoot, ...args) => new Promise((resolve, reject) => {

		const project = file.getProject(roboRoot);

		const checkout = () => {
			const filterList = [];

			Reflect.ownKeys(project.dependencies).forEach(dependency => {
				const struct = {
					dependency,
					branch: args[0]
				};

				filterList.push(struct);
			});

			return filterList;
		};

		const filterList = checkout();
		const commandType = 'switch';
		const commands = file.generateCommands(roboRoot, commandType, filterList);

		console.log(commands);

		spawn.stack(commands).then(results => {
			// log.report(results);
			resolve(results);
		}).catch(err => {
			console.log(err);
		});
	});

	return _switch;
};

// Game plan
// 	- [ ] Switch
// 	+ [name]
// 		+ git checkout [name]
// 		+ [if no branch exists by name]
// 			+ git pull
// 			+ git checkout [name]
// 			+ [if no branch exists on origin by name]
// 				+ git checkout -b [name] (Create a working branch inside each repo)
// 		+ [else]
// 			+ git checkout -b [name] (Create a working branch inside each repo)

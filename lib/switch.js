const path = require('path');

const gitRevSync = require('git-rev-sync');

module.exports = (settings, ...args) => {
	const [log, file, spawn] = args;

	const _switch = (roboRoot, ...args) => new Promise((resolve, reject) => {
		const branch = args[0];

		const project = file.getProject(roboRoot);

		const checkout = () => {
			const filterList = [];

			Reflect.ownKeys(project.dependencies).forEach(dependency => {
				const struct = {
					dependency,
					branch
				};

				filterList.push(struct);
			});

			return filterList;
		};

		const filterList = checkout();
		const commandType = 'switch';
		const commands = file.generateCommands(roboRoot, commandType, filterList);

		// console.log(commands);

		spawn.stack(commands).then(results => {
			// log.report(results);
			file.updateProjectDepsJson(roboRoot);
			log.info(`SWITCH: Switched branches for each repo and updated ${log.ul(settings.projectFile)}.`);
			resolve(results);
		}).catch(err => {
			console.log(err);
			reject(err);
		});
	});

	return _switch;
};

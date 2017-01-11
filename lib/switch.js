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

		const updateProjectDependencies = function () {
			Reflect.ownKeys(project.dependencies).forEach(dependency => {
				const dependencyDir = path.join(roboRoot, settings.modulesDir, dependency);
				const gitBranch = gitRevSync.branch(dependencyDir);
				const gitCommit = gitRevSync.long(dependencyDir);
				project.dependencies[dependency].branch = gitBranch;
				project.dependencies[dependency].commit = gitCommit;
			});
		};

		const filterList = checkout();
		const commandType = 'switch';
		const commands = file.generateCommands(roboRoot, commandType, filterList);

		// console.log(commands);

		spawn.stack(commands).then(results => {
			// log.report(results);
			updateProjectDependencies();
			file.saveProject(roboRoot, project);
			log.info(`SWITCH: Switched branches for each repo and updated ${log.ul(settings.projectFile)}.`);
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

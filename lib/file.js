const path = require('path');

const fs = require('fs-extra');
const jsonfile = require('jsonfile');
const gitRevSync = require('git-rev-sync');
const packageJson = require('package-json');
const deepReplace = require('./deep-replace');

jsonfile.spaces = 2;

const deepExtend = (obj1, obj2) => {
	let outputObj;

	const obj1Copy = JSON.parse(JSON.stringify(obj1));
	outputObj = obj1Copy;

	if (obj2) {
		const obj2Copy = JSON.parse(JSON.stringify(obj2));
		outputObj = Object.assign({}, obj1Copy, obj2Copy);
	}

	return outputObj;
};

const replace = (search, replace) => str => {
	return str.replace(new RegExp(search, 'g'), replace);
};

module.exports = (settings, ...deps) => {
	const [log, file] = deps;

	const cwd = process.cwd();

	const existsSync = url => {
		let exists;

		try {
			const stat = fs.statSync(url);
			if (stat.isFile()) {
				exists = true;
			}
		} catch (err) {
			exists = false;
		}

		return exists;
	};

	const dirExistsSync = path => {
		let exists;

		try {
			const stat = fs.statSync(path);
			if (stat.isDirectory()) {
				exists = true;
			}
		} catch (err) {
			exists = false;
		}

		return exists;
	};

	const loadJson = url => {
		// log(`'loadJson: ${url}`); // trace

		try {
			// eslint-disable-next-line
			const json = require(url);

			if (json) {
				return json;
			}
		} catch (err) {
			log.error(err, 'red');
		}

		return {};
	};

	const saveJson = (url, data) => {
		// log(`'saveJson: ${url}`); //trace

		try {
			jsonfile.writeFileSync(url, data);

			// log(`${url} updated`);
			return true;
		} catch (err) {
			log.info(`${log.ul(url)} NOT updated!`);

			log.info(err, 'red');

			return false;
		}
	};

	const getPkgJson = () => {
		log('getPkg');

		const pkgPath = path.join(cwd, 'package.json');
		const pkgJson = fs.readJson(pkgPath);

		return {data: pkgJson, path: pkgPath};
	};

	const getProject = roboRoot => {
		const jsonPath = path.join(roboRoot, settings.projectFile);
		const json = fs.readJsonSync(jsonPath);
		return json;
	};

	const saveProject = (roboRoot, projectData) => {
		const jsonPath = path.join(roboRoot, settings.projectFile);
		const json = fs.writeJsonSync(jsonPath, projectData);
		return json;
	};

	const breakoutRepoUrl = repo => {
		const result = {
			// commitish: null,
			// repo: null,
			// type: null
		};

		if (Reflect.has(repo, 'type')) {
			result.type = repo.type;
		}

		const commitish = repo.url.split('#')[1];
		if (commitish) {
			result.commitish = commitish;
		}

		const gitUrl = repo.url.replace('git+', '').split('#')[0];
		result.repo = gitUrl;

		return result;
	};

	const isHash = str => {
		const rxp = str.replace(new RegExp('[a-fA-F0-9]{40}', 'g'), '');
		console.log('.......................(ishash).........');
		console.log(rxp);
		return rxp === '';
	};

	const buildDepsTree = dependencyObject => new Promise((resolve, reject) => {
		const promises = [];

		const getVersion = dependency => new Promise((resolve, reject) => {
			packageJson(dependency, 'latest').then(json => {
				const result = {
					name: dependency,
					// Leave the nulls to so references exist in the json to
					// update branch, etc.
					branch: null,
					commit: null,
					version: null
				};

				if (Reflect.has(json, 'version')) {
					result.version = json.version;
				}

				if (Reflect.has(json, 'repository')) {
					const parts = breakoutRepoUrl(json.repository);

					if (typeof parts.commitish === 'string') {
						if (isHash(parts.commitish)) {
							result.commit = parts.commit;
						} else {
							result.branch = parts.commit;
						}
					}

					result.repository = parts.repo;
				}

				log.info(`'${log.ul(result.name)}' resolved via registry (NPM).`);
				resolve(result);
			}).catch(reject);
		});

		Reflect.ownKeys(dependencyObject).forEach(dependency => {
			// Only resolve dependencies that do not have attached info
			if (Reflect.ownKeys(dependencyObject[dependency]).length < 1) {
				promises.push(getVersion(dependency));
			}
		});

		Promise.all(promises).then(results => {
			const packages = {};

			results.forEach(result => {
				packages[result.name] = result;
			});

			resolve(packages);
		}).catch(reject);
	});

	const pluckCommand = (commands, keys) => {
		if (typeof keys === 'string') {
			return commands[keys];
		}

		if (!Array.isArray(keys)) {
			return false;
		}

		if (keys.length > 0) {
			const nextKey = keys.shift();
			const plucked = commands[nextKey];
			return pluckCommand(plucked, keys);
		}

		return commands;
	};

	// filter is an array of dependancies that remain
	const generateCommands = (roboRoot, commandType, filter, ...args) => {
		const project = getProject(roboRoot);

		const projectDeps = Reflect.ownKeys(project.dependencies);
		const commands = pluckCommand(project.commands, commandType);

		let dependencies = [];

		let filterMode = Array.isArray(filter);

		if (filterMode) {
			filter.forEach(depObj => {
				let dependency;

				if (typeof depObj === 'object') {
					if (!Reflect.has(depObj, 'dependency')) {
						throw new Error('FATAL: "dependency" MUST be defined in structured filter map.');
					}
					dependency = depObj.dependency;
				} else if (typeof depObj === 'string') {
					dependency = depObj;
				} else {
					throw new Error('Encountered an unknown type of dependency!');
				}

				dependencies.push(dependency);
			});
		} else if (!filterMode && filter !== 'roboroot') {
			dependencies = projectDeps;
		} else if (!filterMode && filter === 'roboroot') {
			dependencies = ['roboroot'];
		}

		// console.log(dependencies);

		const commandStack = [];

		dependencies.forEach((dependency, idx) => {
			commands.forEach(cmd => {
				const command = deepExtend(cmd); // copy out of json

				const robonautModsDir = path.join(roboRoot, settings.modulesDir);
				deepReplace(command, replace('{{robonaut}}', robonautModsDir + path.sep));

				let filterMap;

				if (filterMode) {
					filterMap = filter[idx];
				}

				if (filterMode && typeof filterMap === 'object') {
					// Special case for structured command maps (such as fuse)
					Reflect.ownKeys(filterMap).forEach(key => {
						deepReplace(command, replace(`{{${key}}}`, filterMap[key]));
					});
				} else {
					// The normal case for flat command maps
					deepReplace(command, replace('{{dependency}}', dependency));
				}

				const dependencyDir = path.join(robonautModsDir, dependency);

				if (filter === 'roboroot') {
					const branch = gitRevSync.branch(roboRoot);
					deepReplace(command, replace('{{branch}}', branch));
				} else if (dirExistsSync(dependencyDir)) {
					const branch = gitRevSync.branch(dependencyDir);
					deepReplace(command, replace('{{branch}}', branch));
				}

				deepReplace(command, replace('{{roboroot}}', roboRoot));

				if (filter !== 'roboroot') {
					const repository = project.dependencies[dependency].repository;
					deepReplace(command, replace('{{repository}}', repository));

					const projectBranch = project.dependencies[dependency].branch;
					deepReplace(command, replace('{{projectBranch}}', projectBranch));
				}

				const prog = command.command;
				const args = command.args;
				const opts = deepExtend(settings.defaults.processOptions, command.options);

				const spawnCommand = [prog, args, opts];

				commandStack.push(spawnCommand);
			});
		});

		// console.log(commandStack);
		// process.exit(0);

		return commandStack;
	};

	const updateProjectDepsJson = roboRoot => {
		const project = getProject(roboRoot);

		Reflect.ownKeys(project.dependencies).forEach(dependency => {
			// Update Git Things
			const dependencyDir = path.join(roboRoot, settings.modulesDir, dependency);
			const gitBranch = gitRevSync.branch(dependencyDir);
			const gitCommit = gitRevSync.long(dependencyDir);
			project.dependencies[dependency].branch = gitBranch;
			project.dependencies[dependency].commit = gitCommit;

			// Update Npm Things
			const depPkgJsonFile = path.join(dependencyDir, 'package.json');
			const depPkgJson = loadJson(depPkgJsonFile);
			const version = depPkgJson.version;
			project.dependencies[dependency].version = version;
		});

		saveProject(roboRoot, project);
		log.info(`Updated ${log.ul(settings.projectFile)}.`);
	};

	const exports = {
		removeSync: fs.removeSync,
		copySync: fs.copySync,

		cwd: cwd,

		buildDepsTree,
		deepExtend,
		generateCommands,
		existsSync,
		dirExistsSync,
		loadJson,
		saveJson,
		getProject,
		saveProject,
		getPkgJson,
		updateProjectDepsJson
	};

	return exports;
};

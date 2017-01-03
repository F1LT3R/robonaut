const path = require('path');

const fs = require('fs-extra');
const jsonfile = require('jsonfile');
const gitRevSync = require('git-rev-sync');
const packageJson = require('package-json');
const deepReplace = require('./deep-replace');

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
			log(`${url} NOT updated!`);

			log(err, 'red');

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

		console.log(result);

		return result;
	};

	const isHash = str => {
		console.log(str);
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

				resolve(result);
			}).catch(reject);
		});

		Reflect.ownKeys(dependencyObject).forEach(dependency => {
			promises.push(getVersion(dependency));
		});

		Promise.all(promises).then(results => {
			const packages = {};

			results.forEach(result => {
				log.info(`'${log.ul(result.name)}' rsolved via registry (NPM).`);
				packages[result.name] = result;
			});

			resolve(packages);
		}).catch(reject);
	});

	// filter is an array of dependancies that remain
	const generateCommands = (roboRoot, commandType, filter) => {
		const project = getProject(roboRoot);

		const projectDeps = Reflect.ownKeys(project.dependencies);
		const commands = project.commands[commandType];

		let dependencies = [];

		// Add dependencies we don't want to build commands for to the filter
		if (Array.isArray(filter)) {
			projectDeps.forEach(dependency => {
				if (filter.indexOf(dependency) > -1) {
					dependencies.push(dependency);
				}
			});
		} else {
			dependencies = projectDeps;
		}

		const commandStack = [];

		dependencies.forEach(dependency => {
			commands.forEach(cmd => {
				const command = deepExtend(cmd); // copy out of json

				const robonautModsDir = path.join(roboRoot, settings.modulesDir);
				deepReplace(command, replace('{{robonaut}}', robonautModsDir + path.sep));

				deepReplace(command, replace('{{dependency}}', dependency));

				const dependencyDir = path.join(robonautModsDir, dependency);

				if (dirExistsSync(dependencyDir)) {
					const branch = gitRevSync.branch(dependencyDir);
					deepReplace(command, replace('{{branch}}', branch));
				}

				const repository = project.dependencies[dependency].repository;
				deepReplace(command, replace('{{repository}}', repository));

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

	const exports = {
		removeSync: fs.removeSync,
		copySync: fs.copySync,

		cwd: cwd,

		buildDepsTree,
		generateCommands,
		existsSync,
		dirExistsSync,
		loadJson,
		saveJson,
		getProject,
		saveProject,
		getPkgJson
	};

	return exports;
};

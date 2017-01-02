const path = require('path');

const fs = require('fs-extra');
const jsonfile = require('jsonfile');
const packageJson = require('package-json');
const gitRevSync = require('git-rev-sync');

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

	const getDepsInfo = roboRoot => new Promise((resolve, reject) => {
		const project = getProject(roboRoot);
		const dependencies = project.dependencies;

		const promises = [];

		const getVersion = dependency => new Promise((resolve, reject) => {
			packageJson(dependency, 'latest').then(json => {
				const result = {
					name: dependency,
					version: json.version,
					repository: json.repository.url.replace('git+', '')
				};

				resolve(result);
			}).catch(reject);
		});

		for (const dependency of dependencies) {
			promises.push(getVersion(dependency));
		}

		Promise.all(promises).then(results => {
			const packages = {};

			results.forEach(result => {
				packages[result.name] = result;
			});

			resolve(packages);
		}).catch(reject);
	});

	// filter is an array of dependancies that remain
	const generateCommands = (roboRoot, commandType, filter) => new Promise((resolve, reject) => {
		getDepsInfo(roboRoot)
		.then(dependencyInfo => {
			const project = getProject(roboRoot);

			const projectDeps = project.dependencies;
			const commands = project.commands[commandType];

			let dependencies = [];

			// Filter in dependencies we don't want to build commands for
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

					const repository = dependencyInfo[dependency].repository;
					deepReplace(command, replace('{{repository}}', repository));

					// console.log(command);

					const prog = command.command;
					const args = command.args;
					const opts = deepExtend(settings.defaults.processOptions, command.options);

					const spawnCommand = [prog, args, opts];

					commandStack.push(spawnCommand);
				});
			});

			resolve(commandStack);
		})
		.catch(reject);
	});

	const exports = {
		removeSync: fs.removeSync,
		copySync: fs.copySync,

		cwd: cwd,

		getDepsInfo,
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

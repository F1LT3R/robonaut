const path = require('path');
const fs = require('fs');

const Promise = require('bluebird');
const merge = require('merge-array-object');

module.exports = (settings, ...deps) => {
	const [log, file, spawn, main] = deps;
	const cwd = process.cwd();

	const findRoboRoot = dir => {
		const url = path.join(dir, 'robonaut.json');

		if (file.existsSync(url)) {
			return dir;
		}

		const nextPath = path.resolve(path.join(dir, '..'));

		if (nextPath === path.sep) {
			return false;
		}

		return findRoboRoot(nextPath);
	};

	const setupRobonaut = dir => {
		const pkgJsonPath = path.join(dir, 'package.json');
		const pkgJsonExists = file.existsSync(pkgJsonPath);

		if (!pkgJsonExists) {
			log.info(`PRIME: Robonaut requires a '${log.hl('package.json')}' file in your project in order to prime.`, 'red');
			log.info(`PRIME: Try: "npm init"`);
			return 1;
		}

		const robonautJsonTemplatePath = path.join(__dirname, '..', settings.projectFileTemplate);
		const robonautJsonPath = path.join(dir, settings.projectFile);

		try {
			file.copySync(robonautJsonTemplatePath, robonautJsonPath);
			log.info(`PRIME: Created: ${log.ul(robonautJsonPath)}`);
		} catch (err) {
			console.log(err);
			log.error(`PRIME: Could not create: '${settings.projectFile}' in ${log.ul(dir)}/`);
			return 1;
		}

		const robonautPackageJsonTemplatePath = path.join(__dirname, '..', settings.packageJsonTemplate);
		const packageJsonPath = path.join(dir, 'package.json');
		const roboPackageJsonTemplate = file.loadJson(robonautPackageJsonTemplatePath);
		const localPackageJson = file.loadJson(packageJsonPath);
		const mergedPackageJsonData = merge(roboPackageJsonTemplate, localPackageJson, true);
		file.saveJson(packageJsonPath, mergedPackageJsonData);
		log.info(`PRIME: Updated: ${log.ul(packageJsonPath)}`);

		const modDir = path.join(dir, settings.modulesDir);
		const exists = file.dirExistsSync(modDir);

		if (exists) {
			log.info(`PRIME: '${log.ul(modDir)}' already exists`);
		} else {
			log.info(`PRIME: Creating dir: ${log.ul(modDir)}`);
			fs.mkdirSync(modDir);
		}

		// npm link = dev mode; npm install = prod mode
		// const installRoboCmd = ['npm', ['install', 'robonaut', '--save'], defaultProcOpts];
		const installRoboCmd = ['npm', ['link', 'robonaut'], settings.defaults.processOptions];

		spawn.single(installRoboCmd)
		.then(() => {
			log.info(`PRIME: robotnaut npm module installed.`);
		})
		.catch(err => {
			log.info(`PRIME: error installing npm module installed!`, 'red');
			console.error(err);
		});
	};

	const prime = dir => {
		const url = path.join(dir, settings.projectFile);

		if (file.existsSync(url)) {
			const errMsg = `PRIME: '${url}' already exists!`;
			log.info(errMsg, 'red');
			return 1;
		}

		setupRobonaut(dir);
	};

	const selfDestructForReal = roboRoot => {
		// Maybe do these 1-by-1 to make it feel less "-hangy"
		const roboModsDir = path.join(roboRoot, settings.modulesDir);
		file.removeSync(roboModsDir);
		log.info(`SELF-DESTRUCT: The '${log.ul(settings.modulesDir)}' directory has been removed from your project.`, 'green');

		const roboJson = path.join(roboRoot, settings.projectFile);
		file.removeSync(roboJson);
		log.info(`SELF-DESTRUCT: The '${log.ul(settings.projectFile)}' file has been removed from your project.`, 'green');

		const removeRoboCmd = ['npm', ['unlink', 'robonaut'], settings.defaults.processOptions];

		spawn.single(removeRoboCmd)
		.then(() => {
			log.info(`PRIME: robotnaut npm module removed.`);
			// Remove robonaut from package.json
			log.info(`SELF-DESTRUCT: COMPLETE.`, 'green');
		})
		.catch(err => {
			log.info(`PRIME: error removing npm module installed!`, 'red');
			console.error(err);
		});
	};

	const selfDestruct = (roboRoot, forReal) => {
		if (typeof forReal === 'string' && forReal === 'for-real') {
			log.info('SELF-DESTRUCT: Ok, I can see you mean business!', 'yellow');
			selfDestructForReal(roboRoot);
			return;
		}

		log.info(`SELF-DESTRUCT: Self-destruct will remove the '${log.ul(settings.projectFile)}' file and the '${log.ul(settings.modulesDir)}' directory from your project!`, 'red');
		log.info(`SELF-DESTRUCT: To proceed with Self-Destruct, please type: "robonaut self-destruct for-real".`);
		return 0;
	};

	const help = roboRoot => {
		const robonautJsonPath = path.join(roboRoot, settings.projectFile);
		const robonautJson = file.loadJson(robonautJsonPath);
		console.log(robonautJsonPath);
		console.log(robonautJson);
	};

	const embed = (roboRoot, ...roboModDeps) => new Promise((resolve, reject) => {
		log.info(`PRIME: ${JSON.stringify(roboModDeps)}`);

		const project = file.getProject(roboRoot);

		if (!Reflect.has(project, 'dependencies')) {
			log.error(`EMBED: failed, no 'dependencies' array in '${settings.projectFile}' (Try: 'robonaut init')`);
		}

		const dependencies = project.dependencies;

		let depsAdded = 0;

		roboModDeps.forEach(depName => {
			console.log(depName);
			if (Reflect.has(dependencies, depName)) {
				log.info(`EMBED: '${log.ul(depName)}' already listed! (skipping)`);
			} else {
				dependencies[depName] = {};
			}
		});

		file.buildDepsTree(dependencies).then(tree => {
			Reflect.ownKeys(tree).forEach(depName => {
				log.info(`EMBED: '${log.ul(depName)}' embedded.`);
				project.dependencies[depName] = tree[depName];
				depsAdded += 1;
			});

			if (depsAdded > 0) {
				file.saveProject(roboRoot, project);
			} else {
				log.error(`EMBED: No new dependancies added to '${settings.projectFile}'!`);
				return 1;
			}

			resolve(project);
		}).catch(err => {
			log.error('Error while embedding dependencies!');
			log.error(err);
			reject(err);
		});
	});

	const coreCommands = {
		'self-destruct': selfDestruct,
		embed
	};

	const begin = args => {
		// Remove the first 2 args [path, script]
		args.shift();
		args.shift();

		const argStr = args.join(' ');
		log.info(`"${argStr.toUpperCase()}"...`, 'yellow');

		const [cmd, ...rest] = args;

		if (cmd === 'prime') {
			return prime(cwd);
		}

		const roboRoot = findRoboRoot(cwd);

		if (roboRoot) {
			log.info(`Your project root is: ${roboRoot}.`, 'yellow');
		} else {
			log.info(`YOU HAVE NO PROJECT ROOT!`, 'red');
			log.info('Robonaut has not been primed for the project!', 'red');
			log.info('Try: "robonaut prime"');
			return 1;
		}

		// Try internal cmds first
		if (Reflect.has(coreCommands, cmd)) {
			return coreCommands[cmd](roboRoot, ...rest);
		}

		// Then try customizable project-level cmds
		if (Reflect.has(main, cmd)) {
			return main[cmd](roboRoot, ...rest).then(output => {
				console.log('Done.');
			}).catch(err => {
				console.log(err);
			});
		}

		log.error(`COMMAND '${log.ul(cmd)}' NOT FOUND!`, 'red');
		help(roboRoot);
		return 0;
	};

	const exports = {
		begin
	};

	return exports;
};

const path = require('path');
const fs = require('fs');

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
			log.info(`PRIME: Robonaut requires a 'package.json' file in your project in order to prime.`, 'red');
			log.info(`PRIME: Try: "npm init"`);
			return 1;
		}

		const robonautJsonTemplatePath = path.join(__dirname, '..', settings.projectFileTemplate);
		const robonautJsonPath = path.join(dir, settings.projectFile);

		try {
			file.copySync(robonautJsonTemplatePath, robonautJsonPath);
			log.info(`PRIME: Created '${settings.projectFile}' in ${dir}/`);
		} catch (err) {
			log.error(`PRIME: Could not create '${settings.projectFile}' in ${dir}/!`);
			return 1;
		}

		const modDir = path.join(dir, settings.modulesDir);
		const exists = file.dirExistsSync(modDir);

		if (exists) {
			log.info(`PRIME: '${modDir}/' already exists`);
		} else {
			log.info(`PRIME: creating ${modDir}/`);
			fs.mkdirSync(modDir);
		}

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
		log.info(`SELF-DESTRUCT: The '${settings.modulesDir}/' directory has been removed from your project.`, 'green');

		const roboJson = path.join(roboRoot, settings.projectFile);
		file.removeSync(roboJson);
		log.info(`SELF-DESTRUCT: The '${settings.projectFile}' file has been removed from your project.`, 'green');

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

		log.info(`SELF-DESTRUCT: Self-destruct will remove the '${settings.projectFile}' file and the '${settings.modulesDir}/' directory from your project!`, 'red');
		log.info(`SELF-DESTRUCT: To proceed with Self-Destruct, please type: "robonaut self-destruct for-real".`);
		return 0;
	};

	const embed = (roboRoot, ...roboModDeps) => {
		log.info(`PRIME: ${JSON.stringify(roboModDeps)}`);

		const project = file.getProject(roboRoot);

		if (!Reflect.has(project, 'dependancies')) {
			log.error(`EMBED: failed, no 'dependancies' array in '${settings.projectFile}' (Try: 'robonaut init')`);
		}

		const dependencies = project.dependencies;

		let depsAdded = 0;

		for (const depName of roboModDeps) {
			if (dependencies.indexOf(depName) === -1) {
				dependencies.push(depName);
				log.info(`EMBED: '${log.ul(depName)}' has been embedded.`);
				depsAdded += 1;
			}
		}

		if (depsAdded > 0) {
			file.saveProject(roboRoot, project);
		} else {
			log.error(`EMBED: No new dependancies added to '${settings.projectFile}'!`);
			return 1;
		}
	};

	const coreCommands = {
		'self-destruct': selfDestruct,
		embed
	};

	const loadProject = roboRoot => {
		const roboFile = path.join(roboRoot, settings.projectFile);

		const roboJson = file.loadJson(roboFile);

		if (!roboJson) {
			log.info(`Could not load '${settings.projectFile}'!`, 'red');
			return 1;
		}

		return roboJson;
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

		// Then ctry customizable project-level cmds
		if (Reflect.has(main, cmd)) {
			return main[cmd](roboRoot, ...rest);
		}

		return 0;
	};

	const exports = {
		begin
	};

	return exports;
};

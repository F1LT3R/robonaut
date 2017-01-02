const assemble = () => {
	// decimate();

	const pkg = getPkg();

	if (!Reflect.has(pkg, 'data') ||
		!Reflect.has(pkg.data, 'robonautDeps') ||
		pkg.data.robonautDeps.length < 1) {
		throw log(`assembled: failed, no robonautDeps in package (try 'robonaut init')`);
	}

	const roboModsDir = path.join(cwdRoot, 'robonaut_modules');

	let cloned = 0;
	let installed = 0;
	let depCount = pkg.data.robonautDeps.length;

	const robonautDeps = pkg.data.robonautDeps;
	const depStack = {};

	const logAssembleResults = () => {
		log(`assemble: ${chalk.cyan('ALL PACKAGES ASSEMBLED OK ✔  ')}`);

		log('🏁  ' + chalk.yellow.underline('ASSEMBLED...'));
		for (const name of robonautDeps) {
			const def = depStack[name];
			log(`${chalk.green(def.name)}: ${chalk.blue('  ')}#${def.gitHash} ${chalk.blue('  ')}@${def.version}  ${chalk.blue('✔')} `);
		}
	};

	const logFinishedClones = () => {
		log('🏁  ' + chalk.yellow.underline('CLONED...'));
		for (const name of robonautDeps) {
			const def = depStack[name];
			const gitHash = gitRevSync.short(def.dir);
			def.gitHash = gitHash;
			log(`${chalk.green(name)} @${gitHash}`);
		}
	};

	const logFinishedInstalls = () => {
		log('🏁  ' + chalk.yellow.underline('INSTALLED...'));
		for (const name of robonautDeps) {
			const version = depStack[name].version;
			log(`${chalk.green(name)} @${version}`);
		}
		logAssembleResults();
	};

	const spawnNpmInstall = name => {
		const def = depStack[name];

		def.npmInstallOpts = {
			cwd: def.dir,
			// detached: true,
			stdio: ['ignore', 1, 2]
		};

		def.npmInstallArgs = ['install'];
		def.npmInstall = childProcess.spawn('npm', def.npmInstallArgs, def.npmInstallOpts);

		log(`assemble: 📡  ${chalk.yellow('npm install ' + name)}`);

		let hasEnded = false;
		const ended = () => {
			hasEnded = true;

			// log(`assemble: npm install 📦  ${chalk.green(def.name)} ${chalk.cyan('✔')} `);
			log(`assemble: npm install ${chalk.cyan('')}  ${chalk.green(def.name)} ${chalk.cyan('✔')} `);

			installed += 1;

			if (installed === depCount) {
				logFinishedInstalls();
			}
		};
		def.npmInstall.on('close', code => {
			if (!hasEnded) {
				ended(code);
			}
		});
		def.npmInstall.on('exit', code => {
			if (!hasEnded) {
				ended(code);
			}
		});
	};

	const queueInstalls = () => {
		for (const depName of robonautDeps) {
			spawnNpmInstall(depName);
		}
	};

	const spawnGitClone = json => {
		const name = json.name;
		const def = depStack[name];

		def.dir = path.join(roboModsDir, json.name);
		def.repo = json.repository.url.replace('git+', '');
		def.version = json.version;
		def.json = json;

		def.gitCloneOpts = {
			cwd: roboModsDir,
			stdio: ['ignore', 1, 2]
		};

		def.gitCloneArgs = ['clone', def.repo];
		def.gitClone = childProcess.spawn('git', def.gitCloneArgs, def.gitCloneOpts);

		log(`assemble: 📡  ${chalk.yellow('git clone ' + json.name)}`);

		let hasEnded = false;
		const ended = code => {
			hasEnded = true;
			cloned += 1;

			const doneMsg = `assemble: git clone ${chalk.cyan('')}  ${chalk.green(def.name)} ${chalk.cyan('✔')}`;
			log(doneMsg);

			if (cloned === depCount) {
				logFinishedClones();
				queueInstalls();
			}
		};

		def.gitClone.on('close', code => {
			if (!hasEnded) {
				ended(code);
			}
		});
		def.gitClone.on('exit', code => {
			if (!hasEnded) {
				ended(code);
			}
		});
	};

	const fetchPackages = () => {
		for (const depName of robonautDeps) {
			const depDef = {
				name: depName
			};

			depStack[depName] = depDef;

			packageJson(depName, 'latest')
			.then(function (json) {
				spawnGitClone(json);
			})
			.catch(err => {
				throw err;
			});
		}
	};
};

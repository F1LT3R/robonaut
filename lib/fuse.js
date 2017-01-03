const path = require('path');

const chalk = require('chalk');

module.exports = (settings, ...args) => {
	const [log, file, spawn] = args;

	const commandType = 'assemble';

	const fuse = roboRoot => new Promise((resolve, reject) => {
		const project = file.getProject(roboRoot);
		const deps = Reflect.ownKeys(project.dependencies);

		console.log(deps);
		// console.log(settings);

		const packages = {};
		const linkMap = {};
		let linkedInsExpected = 0;
		// let toLinked = 0;
		// let linkedIn = 0;

		for (const name of deps) {
			const pkgPath = path.join(roboRoot, settings.modulesDir, name, 'package.json');
			packages[name] = file.loadJson(pkgPath);
		}

		// console.log(packages);

		for (const toLink of deps) {
			console.log(toLink);
			const packageList = Reflect.ownKeys(packages);
			for (const insideOf of packageList) {
				const dep = packages[insideOf];

				if (Reflect.has(dep, 'dependencies') &&
					Reflect.has(dep.dependencies, toLink)) {
					const linkMsg = '🔗  ' + chalk.cyan(toLink) + ' should be linked inside of: ' + chalk.cyan(insideOf);
					log.info(linkMsg);

					if (!Reflect.has(linkMap, toLink)) {
						linkMap[toLink] = {};
					}

					if (!Reflect.has(linkMap[toLink], insideOf)) {
						linkMap[toLink][insideOf] = 0;
					}

					linkMap[toLink][insideOf] += 1;
					linkedInsExpected += 1;
				}
			}
		}

		// const commands = file.generateCommands(roboRoot, commandType);

		// spawn.stack(commands).then(results => {
		// 	log.report(results);
		// 	resolve(results);
		// }).catch(reject);
	});

	return fuse;
};

// const fuse = props => {
// 	const pkg = getPkg();

// 	const deps = pkg.data.robonautDeps;
// 	const roboModsDir = path.join(cwdRoot, 'robonaut_modules');

// 	const packages = {};
// 	const linkMap = {};
// 	let toLinked = 0;
// 	let linkedIn = 0;
// 	let linkedInsExpected = 0;


// 	for (toLink of deps) {
// 		Reflect.ownKeys(packages).forEach(insideOf => {
// 			const dep = packages[insideOf];

// 			if (Reflect.has(dep, 'dependencies') &&
// 				Reflect.has(dep.dependencies, toLink)) {
// 				const linkMsg = '🔗  ' + chalk.cyan(toLink) + ' should be linked inside of: ' + chalk.cyan(insideOf);
// 				log(linkMsg);

// 				if (!Reflect.has(linkMap, toLink)) {
// 					linkMap[toLink] = {};
// 				}

// 				if (!Reflect.has(linkMap[toLink], insideOf)) {
// 					linkMap[toLink][insideOf] = 0;
// 				}

// 				linkMap[toLink][insideOf] += 1;
// 				linkedInsExpected += 1;
// 			}
// 		});
// 	}


// 	const logFinishedLinks = () => {
// 		log('🏁  ' + chalk.yellow.underline('LINKED...'));

// 		const invertedMap = {};

// 		Reflect.ownKeys(linkMap).forEach(toLink => {
// 			Reflect.ownKeys(linkMap[toLink]).forEach((insideOf, idx) => {
// 				if (!Reflect.has(invertedMap, insideOf)) {
// 					invertedMap[insideOf] = {};
// 				}
// 				if (!Reflect.has(invertedMap, insideOf[toLink])) {
// 					invertedMap[insideOf][toLink] = true;
// 				}
// 			});
// 		});

// 		Reflect.ownKeys(invertedMap).forEach(parentPkg => {
// 			// «
// 			const linkMsg = parentPkg + chalk.yellow(' ⇠ ') + chalk.green('━┓');
// 			console.log(linkMsg);
// 			const space = chars(linkMsg.length - 21, ' ');

// 			const childKeys = Reflect.ownKeys(invertedMap[parentPkg]);
// 			childKeys.forEach((childPkg, idx) => {
// 				if (idx === childKeys.length - 1) {
// 					console.log(space + chalk.green('┗━') + chalk.yellow(' ⇠ ') + childPkg);
// 				} else {
// 					console.log(space + chalk.green('┣━') + chalk.yellow(' ⇠ ') + childPkg);
// 				}
// 			});
// 		});
// 	};

// 	const spawnNpmLinkIn = (toLink, insideOf) => {
// 		const dir = path.join(roboModsDir, insideOf);

// 		const npmLinkInOpts = {
// 			cwd: dir,
// 			stdio: ['ignore', 1, 2]
// 		};

// 		const npmLinkInArgs = ['link', toLink];
// 		const npmLinkIn = childProcess.spawn('npm', npmLinkInArgs, npmLinkInOpts);

// 		log(`fuse: 📡  ${chalk.red('cd ') + chalk.yellow(insideOf) + chalk.red(' && ') + chalk.yellow('npm link ' + toLink)}`);

// 		npmLinkIn.on('close', code => {
// 			linkedIn += 1;

// 			const doneMsg = `fuse: npm link 🔗  ${chalk.green(toLink)} ${chalk.blue('linked-in >')} ${chalk.green(insideOf)} ${chalk.cyan('✔')} `;
// 			log(doneMsg);

// 			if (linkedIn === linkedInsExpected) {
// 				logFinishedLinks();
// 			}
// 		});
// 	};

// 	const linkIn = () => {
// 		Reflect.ownKeys(linkMap).forEach(toLink => {
// 			Reflect.ownKeys(linkMap[toLink]).forEach(insideOf => {
// 				spawnNpmLinkIn(toLink, insideOf);
// 			});
// 		});
// 	};

// 	const spawnNpmToLink = link => {
// 		const dir = path.join(roboModsDir, link);

// 		const npmToLinkOpts = {
// 			cwd: dir,
// 			stdio: ['ignore', 1, 2]
// 		};

// 		const npmToLinkArgs = ['link'];
// 		const npmToLink = childProcess.spawn('npm', npmToLinkArgs, npmToLinkOpts);

// 		log(`fuse: 📡  ${chalk.red('cd ') + chalk.yellow(link) + chalk.red(' && ') + chalk.yellow('npm link')}`);

// 		npmToLink.on('close', code => {
// 			toLinked += 1;

// 			const doneMsg = `fuse: npm link 🔗  ${chalk.green(link)} ${chalk.cyan('✔')} ${chalk.cyan('linked-out >')}`;
// 			log(doneMsg);

// 			if (Reflect.ownKeys(linkMap).length === toLinked) {
// 				linkIn();
// 			}
// 		});
// 	};

// 	const linkOut = () => {
// 		Reflect.ownKeys(linkMap).forEach(toLink => {
// 			spawnNpmToLink(toLink);
// 		});
// 	};

// 	linkOut();
// };

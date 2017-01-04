const path = require('path');

const chalk = require('chalk');

module.exports = (settings, ...args) => {
	const [log, file, spawn, , helpers] = args;

	const invertMap = linkMap => {
		const invertedMap = {};

		Reflect.ownKeys(linkMap).forEach(toLink => {
			Reflect.ownKeys(linkMap[toLink]).forEach(insideOf => {
				if (!Reflect.has(invertedMap, insideOf)) {
					invertedMap[insideOf] = {};
				}
				if (!Reflect.has(invertedMap, insideOf[toLink])) {
					invertedMap[insideOf][toLink] = true;
				}
			});
		});

		return invertedMap;
	};

	const logLinkTree = invertedMap => {
		Reflect.ownKeys(invertedMap).forEach(parentPkg => {
			const linkMsg = parentPkg + chalk.yellow(' ⇠ ') + chalk.green('━┓');
			log.info(linkMsg);
			const space = helpers.chars(linkMsg.length - 21, ' ');

			const childKeys = Reflect.ownKeys(invertedMap[parentPkg]);
			childKeys.forEach((childPkg, idx) => {
				if (idx === childKeys.length - 1) {
					log.info(space + chalk.green('┗━') + chalk.yellow(' ⇠ ') + childPkg);
				} else {
					log.info(space + chalk.green('┣━') + chalk.yellow(' ⇠ ') + childPkg);
				}
			});
		});
	};

	const linkOut = (roboRoot, linkMap) => {
		const linkOutList = [];

		Reflect.ownKeys(linkMap).forEach(toLink => {
			linkOutList.push(toLink);
		});

		const commandType = ['fuse', 'link-out'];
		const commands = file.generateCommands(roboRoot, commandType, linkOutList);

		return commands;
	};

	const linkIn = (roboRoot, invertedLinkMap) => {
		const linkInList = [];

		Reflect.ownKeys(invertedLinkMap).forEach(insideOf => {
			Reflect.ownKeys(invertedLinkMap[insideOf]).forEach(linkPackage => {
				const struct = {
					dependency: linkPackage,
					linkInside: insideOf
				};

				linkInList.push(struct);
			});
		});

		const commandType = ['fuse', 'link-in'];
		const commands = file.generateCommands(roboRoot, commandType, linkInList);

		return commands;
	};

	const fuse = roboRoot => new Promise((resolve, reject) => {
		const project = file.getProject(roboRoot);
		const deps = Reflect.ownKeys(project.dependencies);

		// console.log(deps);
		// console.log(settings);

		const packages = {};
		const linkMap = {};

		for (const name of deps) {
			const pkgPath = path.join(roboRoot, settings.modulesDir, name, 'package.json');
			packages[name] = file.loadJson(pkgPath);
		}

		// console.log(packages);

		for (const toLink of deps) {
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
				}
			}
		}

		const linkOutCommands = linkOut(roboRoot, linkMap);
		const invertedLinkMap = invertMap(linkMap);
		const linkInCommands = linkIn(roboRoot, invertedLinkMap);

		log.info('Robonaut sees this npm link tree like so:');
		logLinkTree(invertedLinkMap);

		const commands = linkOutCommands.concat(linkInCommands);

		spawn.stack(commands)
		.then(results => {
			log.report(results);
			resolve(results);
		})
		.catch(reject);
	});

	return fuse;
};

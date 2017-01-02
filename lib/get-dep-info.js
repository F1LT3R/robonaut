const packageJson = require('package-json');

module.exports = (settings, ...args) => {
	const [, file] = args;

	return roboRoot => new Promise((resolve, reject) => {
		const project = file.getProject(roboRoot);
		const dependencies = project.dependancies;

		const promises = [];

		const getVersion = dependency => new Promise((resolve, reject) => {
			packageJson(dependency, 'latest').then(json => {
				const result = {
					name: dependency,
					version: json.version,
					repo: json.repository.url
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
				packages[result.name] = {
					version: result.version,
					repo: result.repo
				};
			});

			resolve(packages);
		}).catch(reject);
	});
};

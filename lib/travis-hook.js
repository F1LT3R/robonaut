const Travis = require('travis-ci');

const ROBONAUT_TRAVIS_ACCESS_TOKEN = process.env.ROBONAUT_TRAVIS_ACCESS_TOKEN;

const travis = new Travis({
	version: '2.0.0'
});

const getRepos = () => {
	travis.repos('markserv', 'markserv-cli').get((err, res) => {
		if (err) {
			throw err;
		}
		console.log(res);
	});
};

const branches = () => {
	travis.branches.get((err, res) => {
		if (err) {
			throw err;
		}
		console.log(res);
	});
};

const getBuilds = n => {
	travis.builds(n).get((err, res) => {
		if (err) {
			throw new Error(err);
		}
		const sha = res.commit.sha;
		console.log(sha);
		console.log(res.build);
	});
};

// const getJobs = n => {
// 	travis.jobs(n).get((err, res) => {
// 		if (err) {
// 			throw new Error(err);
// 		}
// 		console.log(res);
// 		return res;
// 	});
// };

const repoBuilds = n => {
	travis.repos('markserv', 'markserv-cli').builds.get((err, res) => {
		if (err) {
			throw new Error(err);
		}
		// console.log(res);

		const buildId = res.builds[0].id;
		console.log(buildId);

		getBuilds(buildId);

		return res;
	});
};

travis.authenticate({
	access_token: ROBONAUT_TRAVIS_ACCESS_TOKEN
}, function (err) {
	if (err) {
		console.error(err);
	}

	console.log(`We've authenticated!`);

	// getRepos();
	// getBuilds();
	// getJobs(186973875);
	// getBuilds(187165480);
	repoBuilds(3);
});


const childProcess = require('child_process');

const Promise = require('bluebird');


const cmdStack = [];
const promiseStack = [];
const resultStack = [];

const progressUpdate = msg => {
	console.log(`${msg}`);
};

const spawnNext = stack => new Promise((resolve, reject) => {
	if (stack.length > 0) {
		const nextCmd = stack.shift()
		spawn(nextCmd).then(() => {
			resolve(spawnNext(stack));
		}).catch(reject);
	} else {
		resolve(resultStack);
	}
});

const hasStd = (type, child) => {
	stdType = 'std' + type;
	return Reflect.has(child, stdType) && !!child[stdType];
};

function spawn (nextCmd) {
	return new Promise((resolve, reject) => {
		const [cmd, args, opts, delay] = nextCmd;

		let stdout = '';
		let stderr = '';
		// let errs = [];
		let ended = false;

		const end = code => {
			if (ended) {
				return;
			}

			ended = true;

			if (code === 0) {
				const output = [stderr, stdout];
				resultStack.push(output);
				resolve();
			} else {
				reject(stderr, stdout);
			}
		};

		setTimeout(function () {
			const child = childProcess.spawn(cmd, args, opts);

			if (hasStd('err', child)) {
				child.stderr.on('data', data => {
					stderr += data;
				});
			}

			if (hasStd('out', child)) {
				child.stdout.on('data', data => {
					progressUpdate(data);
					stdout += data;
				});
			}

			child.on('close', code => {
				end(code);
			});

			child.on('exit', code => {
				end(code);
			});
		}, delay);
	});
};

// const initDelay = 1000 * 5;
const initDelay = 0;

for (let i = 0; i < 1; i +=1) {
	const opts = {
		cwd: './',
		encoding: 'utf8',
		timeout: 5,
		// stdio: ['ignore', 1, 2],
		// stdio: [0, 1, 2],
		// stdio: 'inherit'
	};

	const ls = ['ls', ['-la'], opts, initDelay];
	cmdStack.push(ls);
}

spawnNext(cmdStack).then(results => {
	console.log('Success');
	console.log(results);
}).catch(err => {
	console.log('Error');
	console.error(err);
});







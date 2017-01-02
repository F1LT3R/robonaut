const childProcess = require('child_process');

const chalk = require('chalk');
const Promise = require('bluebird');

module.exports = (settings, ...deps) => {
	const [log] = deps;

	const style = {
		line: chalk.bgBlack.yellow,
		cmd: chalk.underline,
		stdio: chalk.white.dim
	};

	const pretify = (cmd, args) => {
		const str = `${cmd} ${args.join(' ')}`;
		return str;
	};

	const prettyPrintCmd = command => {
		const [cmd, args, opts] = command;

		const prettyCmd = pretify(cmd, args);
		const stdio = JSON.stringify(opts).replace(/"/g, '');

		const commandOutput = style.line(' >> ' + style.cmd(prettyCmd) + ' ') + ' ' + style.stdio(stdio);
		log.info(commandOutput);

		const plainOutput = prettyCmd + ' ' + stdio;
		return plainOutput;
	};

	const single = cmd => {
		prettyPrintCmd(cmd);

		return new Promise((resolve, reject) => {
			const [prog, args, opts] = cmd;
			let ended = false;

			const end = (code, err) => {
				if (ended) {
					return;
				}

				ended = true;

				if (code === 0) {
					resolve();
				} else {
					reject(err);
				}
			};

			const child = childProcess.spawn(prog, args, opts);

			child.on('error', err => {
				// console.log('error', err);
				end(1, err);
			});

			child.on('close', code => {
				// console.log('close', code);
				end(code);
			});

			child.on('exit', code => {
				// console.log('exit', code);
				end(code);
			});
		});
	};

	const stack = commands => new Promise((resolve, reject) => {
		const resultStack = [];

		const spawnNext = stack => new Promise((resolve, reject) => {
			if (stack.length > 0) {
				const nextCmd = stack.shift();
				spawn(nextCmd).then(() => {
					resolve(spawnNext(stack));
				}).catch(reject);
			} else {
				resolve(resultStack);
			}
		});

		spawnNext(commands).then(results => {
			resolve(results);
		}).catch(err => {
			reject(err);
		});

		function spawn(nextCmd) {
			const cmdText = prettyPrintCmd(nextCmd);

			return new Promise((resolve, reject) => {
				const [cmd, args, opts] = nextCmd;

				let ended = false;

				const end = (code, err) => {
					if (ended) {
						return;
					}

					ended = true;

					if (code === 0) {
						resultStack.push(cmdText);
						resolve();
					} else {
						reject(err);
					}
				};

				const child = childProcess.spawn(cmd, args, opts);

				// if (hasStd('err', child)) {
					// child.stderr.on('data', data => {
					// 	progressUpdate(data);
					// 	stderr += data;
					// });
				// }

				// if (hasStd('out', child)) {
					// child.stdout.on('data', data => {
					// 	progressUpdate(data);
					// 	stdout += data;
					// });
				// }

				child.on('error', err => {
					end(1, err);
				});

				child.on('close', code => {
					end(code);
				});

				child.on('exit', code => {
					end(code);
				});
			});
		}
	});

	const exports = {
		single,
		stack
	};

	return exports;
};

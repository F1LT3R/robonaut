const childProcess = require('child_process');
const path = require('path');

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

		let commandOutput;

		if (cmd === 'git' && args[1] === 'diff') {
			commandOutput = style.line(' >> DIFF: ' + log.ul(path.relative(process.cwd(), opts.cwd)));
		} else {
			commandOutput = style.line(' >> ' + style.cmd(prettyCmd) + ' ') + ' ' + style.stdio(stdio);
		}

		// No default output for piped commands as we want to do something
		// manual/conditional with that input later, eg: 'numerate' scans first
		if (command[2].stdio !== 'pipe') {
			log.info(commandOutput);
		}

		const plainOutput = prettyCmd + ' ' + stdio;

		const output = {
			plain: plainOutput,
			color: commandOutput
		};

		return output;
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
		const commandStack = [];
		const commandStackColor = [];
		const stdoutStack = [];
		const stderrStack = [];

		const spawnNext = stack => new Promise((resolve, reject) => {
			if (stack.length > 0) {
				const nextCmd = stack.shift();
				spawn(nextCmd).then(() => {
					resolve(spawnNext(stack));
				}).catch(err => {
					reject(err);
				});
			} else {
				resolve();
			}
		});

		spawnNext(commands).then(() => {
			const results = {
				commands: commandStack,
				commandsColor: commandStackColor,
				stdout: stdoutStack
			};

			resolve(results);
		}).catch(err => {
			const results = {
				error: err,
				commands: commandStack,
				commandsColor: commandStackColor,
				stdout: stdoutStack,
				stderr: stderrStack
			};

			reject(results);
		});

		function spawn(nextCmd) {
			const cmdText = prettyPrintCmd(nextCmd);

			let stdout = '';
			let stderr = '';

			return new Promise((resolve, reject) => {
				const [cmd, args, opts] = nextCmd;

				let ended = false;

				const end = (code, err) => {
					if (ended) {
						return;
					}

					ended = true;

					if (code === 0) {
						commandStack.push(cmdText.plain);
						commandStackColor.push(cmdText.color);
						stdoutStack.push(stdout);
						resolve();
					} else {
						stderrStack.push(stderr);
						reject(err);
					}
				};

				const child = childProcess.spawn(cmd, args, opts);

				if (Reflect.has(child, 'stdout') && child.stdout !== null) {
					child.stdout.on('data', data => {
						stdout += data;
					});
				}

				if (Reflect.has(child, 'stderr') && child.stderr !== null) {
					child.stderr.on('data', data => {
						stderr += data;
					});
				}

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

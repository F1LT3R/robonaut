const childProcess = require('child_process');

const chalk = require('chalk');
const Promise = require('bluebird');

module.exports = () => {
	const pretify = cmdAry => {
		const [cmd, args] = cmdAry;
		return `${cmd} ${args.join(' ')}`;
	};

	const prettyPrintCmd = cmd => {
		const prettyCmd = pretify(cmd);
		const prettyCmdColor = chalk.bgBlack.yellow(' >>> ' + chalk.underline(prettyCmd) + ' ');
		console.log(prettyCmdColor + '\n');
	};

	const single = cmd => {
		prettyPrintCmd(cmd);

		return new Promise((resolve, reject) => {
			const [prog, args, opts] = cmd;
			// console.log(prog, args, opts);

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
				console.log('error', err);
				end(1, err);
			});

			child.on('close', code => {
				console.log('close', code);
				end(code);
			});

			child.on('exit', code => {
				console.log('exit', code);
				end(code);
			});

			return child;
		});
	};

	const exports = {
		single
	};

	return exports;
};

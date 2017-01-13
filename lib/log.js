const chalk = require('chalk');

module.exports = settings => {
	const getStyle = str => {
		let style = chalk;

		if (typeof str === 'string') {
			const styleStack = str.split('.');

			styleStack.forEach(name => {
				style = style[name];
			});
		} else {
			style = chalk[settings.defaults.textStyle];
		}

		return style;
	};

	const strap = getStyle(settings.strap.style)(settings.strap.text);

	const log = (msg, styles, isError) => {
		let logMsg;

		const style = getStyle(styles);

		let strapOut = strap;

		if (isError) {
			strapOut = chalk.reset.bgRed.white(settings.strap.text);
		}

		if (typeof msg === 'string') {
			logMsg = `${strapOut} ${style(msg)}`;
		} else if (typeof msg === 'object') {
			logMsg = `${strapOut} ${style(JSON.stringify(msg))}`;
		}

		console.log(logMsg);

		return logMsg;
	};

	const help = stack => {
		log('robonaut help');
		log(stack);
	};

	const info = (msg, style) => {
		log(msg, style);
	};

	const error = msg => {
		log(msg, 'red', true);
	};

	const report = results => {
		results.commands.forEach(command => {
			info('✔ ' + command, 'green');
		});
	};

	const exports = {
		help,
		info,
		error,
		report,
		ul: chalk.underline,
		hl: chalk.yellow
	};

	return exports;
};

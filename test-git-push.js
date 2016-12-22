const childProcess = require('child_process');

const child = childProcess.spawn('git', ['push', 'origin', 'master', '-v'], {
	cwd: './',
	stdio: 'inherit'
});

child.on('error', err => {
	console.log('ERROR');
	console.error(err);
});

child.on('close', code => {
	console.log('CLOSE');
	console.log(code);
});

child.on('exit', code => {
	console.log('EXIT');
	console.log(code);
});




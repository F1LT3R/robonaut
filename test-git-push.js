const childProcess = require('child_process');

const child2 = childProcess.spawn('ls', ['-la'], {
	cwd: './',
	// stdio: 'ignore'
	stdio: 'inherit'
});

child2.on('error', err => {
	console.log('ERROR2');
	console.error(err);
});

child2.on('close', code => {
	console.log('CLOSE2');
	console.log(code);
});

child2.on('exit', code => {
	console.log('Exit2');
	console.log(code);
});





const child = childProcess.spawn('git', ['push', 'origin', 'master', '-v'], {
	cwd: './',
	// stdio: 'ignore'
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
	console.log('Exit');
	console.log(code);
});



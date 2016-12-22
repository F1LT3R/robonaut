const childProcess = require('child_process');

const child = childProcess.spawn('git', ['push', 'origin', 'master', '-v'], {
	cwd: './',
	stdio: 'inherit'
});



const subSpawn = require('./sub-spawn')();

console.log(subSpawn);

// subSpawn.single([
//     'ls', [
// 		'-la',
// 		// '-v'
//     ],
//     {
// 		stdio: 'inherit'
//     }
// ]);

subSpawn.single([
    'npm', [
		'link',
    ],
    {
		stdio: 'inherit'
    }
]);

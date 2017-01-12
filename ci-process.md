## Setup

- [ ] Embed
	+ [x] Resolve Github Repos urls, commits, branches to to dependency array in robonaut.json
	+ [x] Add npm-package/github repo info to `robotnaut.json`
	+ [ ] First dep added is assumed to be main-depdency

- [ ] Main
	+ Set main dependency in robonaut.json

- [x] Assemble
	+ [x] Git clone each Repo from Github into robonaut modules dir
	+ [x] Npm install inside each repo

- [x] Fuse
	+ Resolve peer-dependency tree
	+ NPM link relevant dependencies

- [x] Switch
	+ [x] git fetch -all (stay up to date)
	+ [x] git checkout [name]
	+ [x] [if not exists] git checkout -b [name]

## Dev Work

Normal dev work. Make changes inside multiple repos.

- [x] Scan
	+ Git diff each repo

- [x] Disassemble
	+ Remove all repos from robonaut modules dir

## Testing

- [ ] Test
	+ Npm test in each repo

- [ ] Rebuild
	+ Npm uninstall (per repo)
	+ Npm install (per repo)
	+ Npm test (per repo)

## Publishing

- [ ] Current
	- [x] Check all git repos have latests
	- [ ] Check all npm verions numbers are current

- [ ] Numerate
	+ [x] [current or exit]
	+ [x] Increment version numbers of all changed repos
	+ [x] Copy master-dependency `package.json` version to monorepo `package.json`

- [ ] Transmit
	+ [ ] [current or exit]
	+ [ ] [not master branch or exit]
	+ [x] Push all changed repos to Github on open branch
	+ [ ] Store commit hashes for each repo (used to verify w/ Travis later)
	+ [ ] Commit and push robonaut monorepo
	+ [ ] Travis checks out and runs each repo

- [ ] Publish
	+ [x] [current or exit]
	+ [ ] [not master branch or exit]
	+ [ ] Ping Travis to see if all builds with storred hashes passed/failed
	+ [if all pass]
		+ [ ] git merge each repo's current branch into master
		+ [ ] git push each repo's branch
		+ [ ] npm publish each repo
		+ [ ] switch back to master and pull on each branch






<!-- - [ ] Transmit
	+ [ ] [current or exit]
	+ [ ] [not master branch or exit]
	+ [x] Push all changed repos to Github on open branch
	+ [ ] Ping Travis to see if all builds with current branch hashes passed/failed
	+ [if all pass]
		+ [ ] git merge each repo's current branch into local master
		+ [ ] git push each repo's branch to remote master
		+ [ ]
		+ [ ] npm publish each repo
 -->

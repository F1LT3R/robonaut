# robonaut
A monorepo manager for NPM+Git libraries.

## Usage

### init

`robonaut init`

Sets up package json and dir for robonaut.

```
 Robonaut  Begin
 Robonaut  Process Cmds
 Robonaut  init
 Robonaut  getPkg
 Robonaut  'loadJson: /Users/al/ms/markserv-robonaut/package.json
 Robonaut  {"code":"MODULE_NOT_FOUND"}
 Robonaut  'saveJson: /Users/al/ms/markserv-robonaut/package.json
 Robonaut  /Users/al/ms/markserv-robonaut/package.json updated
 Robonaut  init: creating /Users/al/ms/markserv-robonaut/robonaut_modules
 ```

### glom

`robonaut glom markserv-cli,markserv-contrib-mod.dir,markserv-contrib-app.github`

Adds array of packages to `package.json` in `robonautDeps`.

```
 Robonaut  Begin
 Robonaut  Process Cmds
 Robonaut  glom: ["markserv-cli","markserv-contrib-mod.dir","markserv-contrib-app.github"]
 Robonaut  getPkg
 Robonaut  'loadJson: /Users/al/ms/markserv-robonaut/package.json
 Robonaut  glom: 'markserv-cli' has been glomed
 Robonaut  glom: 'markserv-contrib-mod.dir' has been glomed
 Robonaut  glom: 'markserv-contrib-app.github' has been glomed
 Robonaut  'saveJson: /Users/al/ms/markserv-robonaut/package.json
 Robonaut  /Users/al/ms/markserv-robonaut/package.json updated
```

### assemble

`robonaut assemble`

- Gets dependencies json from NPM
- Git clones the dependency
- Npm installs the repo

```
 Robonaut  Begin
 Robonaut  Process Cmds
 Robonaut  🔥  decimating...
 Robonaut  decimate: /Users/al/ms/markserv-robonaut/robonaut_modules  DECIMATED OK  👍
 Robonaut  getPkg
 Robonaut  'loadJson: /Users/al/ms/markserv-robonaut/package.json
 Robonaut  assemble: 📡  git clone markserv-contrib-app.github

Cloning into 'markserv-contrib-app.github'...
 Robonaut  assemble: 📡  git clone markserv-contrib-mod.dir

Cloning into 'markserv-contrib-mod.dir'...
 Robonaut  assemble: 📡  git clone markserv-cli

Cloning into 'markserv-cli'...
remote: Counting objects: 2342, done.

 Robonaut  assemble: git clone   markserv-cli ✔
 Robonaut  assemble: git clone   markserv-contrib-app.github ✔
 Robonaut  🏁  CLONED...
 Robonaut  markserv-cli @fac4344
 Robonaut  markserv-contrib-mod.dir @313d3c3
 Robonaut  markserv-contrib-app.github @4319dab
 Robonaut  assemble: 📡  npm install markserv-cli
 Robonaut  assemble: 📡  npm install markserv-contrib-mod.dir
 Robonaut  assemble: 📡  npm install markserv-contrib-app.github
 Robonaut  assemble: npm install   markserv-contrib-mod.dir ✔ eys@1.1.2~install: no script for install, continuing
 Robonaut  assemble: npm install   markserv-contrib-app.github ✔
 Robonaut  assemble: npm install   markserv-cli ✔
 Robonaut  🏁  INSTALLED...
 Robonaut  markserv-cli @1.0.14
 Robonaut  markserv-contrib-mod.dir @1.0.8
 Robonaut  markserv-contrib-app.github @1.0.7
 Robonaut  assemble: ALL PACKAGES ASSEMBLED OK ✔
 Robonaut  🏁  ASSEMBLED...
 Robonaut  markserv-cli:   @fac4344   @1.0.14  ✔
 Robonaut  markserv-contrib-mod.dir:   @313d3c3   @1.0.8  ✔
 Robonaut  markserv-contrib-app.github:   @4319dab   @1.0.7  ✔
```


### yoke

`robonaut yoke`

Cross links all dependencies with `npm link`.

```
 Robonaut  Begin
 Robonaut  Process Cmds
 Robonaut  getPkg
 Robonaut  'loadJson: /Users/al/ms/markserv-robonaut/package.json
 Robonaut  'loadJson: /Users/al/ms/markserv-robonaut/robonaut_modules/markserv-cli/package.json
 Robonaut  'loadJson: /Users/al/ms/markserv-robonaut/robonaut_modules/markserv-contrib-mod.dir/package.json
 Robonaut  'loadJson: /Users/al/ms/markserv-robonaut/robonaut_modules/markserv-contrib-app.github/package.json
 Robonaut  🔗  markserv-contrib-mod.dir should be linked inside of: markserv-contrib-app.github
 Robonaut  🔗  markserv-contrib-app.github should be linked inside of: markserv-cli
 Robonaut  yoke: 📡  cd markserv-contrib-mod.dir && npm link
 Robonaut  yoke: 📡  cd markserv-contrib-app.github && npm link
/usr/local/lib/node_modules/markserv-contrib-mod.dir -> /Users/al/ms/markserv-robonaut/robonaut_modules/markserv-contrib-mod.dir
 Robonaut  yoke: npm link 🔗  markserv-contrib-mod.dir ✔ linked-out >
/usr/local/lib/node_modules/markserv-contrib-app.github -> /Users/al/ms/markserv-robonaut/robonaut_modules/markserv-contrib-app.github
 Robonaut  yoke: npm link 🔗  markserv-contrib-app.github ✔ linked-out >
 Robonaut  yoke: 📡  cd markserv-contrib-app.github && npm link markserv-contrib-mod.dir
 Robonaut  yoke: 📡  cd markserv-cli && npm link markserv-contrib-app.github
/Users/al/ms/markserv-robonaut/robonaut_modules/markserv-contrib-app.github/node_modules/markserv-contrib-mod.dir -> /usr/local/lib/node_modules/markserv-contrib-mod.dir -> /Users/al/ms/markserv-robonaut/robonaut_modules/markserv-contrib-mod.dir
 Robonaut  yoke: npm link 🔗  markserv-contrib-mod.dir linked-in > markserv-contrib-app.github ✔
/Users/al/ms/markserv-robonaut/robonaut_modules/markserv-cli/node_modules/markserv-contrib-app.github -> /usr/local/lib/node_modules/markserv-contrib-app.github -> /Users/al/ms/markserv-robonaut/robonaut_modules/markserv-contrib-app.github
 Robonaut  yoke: npm link 🔗  markserv-contrib-app.github linked-in > markserv-cli ✔
all done!
```

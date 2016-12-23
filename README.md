# robonaut

A mono-(poly)-repo manager for NPM+Git libraries.

Demo: [Youtube](https://www.youtube.com/watch?v=IfnSDgQjTVw)

## Disclaimer

Warning: Robot is packed full of religious convictions that other developers may strongly disagree with.

Robonaut was haked together in 3 days, and is undoubtedly very brittle. It was designed to work with one open-source project ([markserv](https://github.com/markserv)). It is a very early tool that will likely nature alongside the code it is supporting.

## About

Robonaut is designed to manage a NodeJs project that contains many repos. I found that as my project was scaling in size and complexity, I would often make stupid, simple, human errors like:

- Forgetting to increment version numbers
- Increment version numbers incorrectly
- Forgetting to `git push` a package I had updated
- Forgetting to `npm push` a package I had updated
- Etc.

Usually this would result in a Travis build failing, followed by a frantic igging to find out why. (Hey... everything was working fine on my computer!) Clearly I needed to enlist the help of a trusty robot.

Robonaut (currently) works on a few basic principles:

1. Modules imported must already exist as an NPM package and a GIT repo.
1. Only one feature or patch is ever being worked on at a time. (this will change in the future)
1. Version numbers increments are cross-linkedm (packages that are worked on simultaneously will be incremented together).

## Usage

### embed

`robonaut embed`

Embeds robonaut in your directory, by setting up a `package.json` and a `robotnaut_modules` directory.

### prime

`robonaut prime pkg1,pkg2,pk3`

Adds an array of packages to `package.json` in `robonautDeps`.

### assemble

`robonaut assemble`

- Gets dependencies json from NPM
- Git clones the dependency
- Npm installs the repo

### fuse

`robonaut fuse`

Cross links all dependencies with `npm link`.

Example:

```
Robonaut  🏁  LINKED...
markserv-cli ⇠ ━┓
                ┗━ ⇠ markserv-contrib-app.github
markserv-contrib-app.github ⇠ ━┓
                               ┣━ ⇠ markserv-contrib-inc.html
                               ┣━ ⇠ markserv-contrib-inc.less
                               ┣━ ⇠ markserv-contrib-inc.markdown
                               ┣━ ⇠ markserv-contrib-mod.dir
                               ┣━ ⇠ markserv-contrib-mod.file
                               ┣━ ⇠ markserv-contrib-mod.html
                               ┗━ ⇠ markserv-contrib-mod.http-404
```

### scan

`robonaut scan`

Scans all modules for changed `git diff`.

### numerate

`robonaut numerate`

Increments all changed packages by the same pattern in the `package.json` file.

Example:

```
  Major   Minor   Patch
 _______ _______    +
                 markserv-cli  master (1.0.61) » 1.0.62
  markserv-contrib-app.github  master (1.0.75) » 1.0.76
    markserv-contrib-inc.less  master (1.0.5) » 1.0.6
markserv-contrib-mod.http-404  master (1.0.6) » 1.0.7
```

### transmit

`robonaut transmit "My Commit message!"`

Pushes code to their respective GIT repos, then publishes to the NPM repository.


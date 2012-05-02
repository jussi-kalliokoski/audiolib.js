# Building audiolib.js

audiolib.js comes with a collection of build scripts ready for you to use, however they come with a few dependencies. This document lists a few things that are made easy for you and what their dependencies are.

## Joining the scripts together (concatenation)

This is a simple operation, just joins all the scripts in ``js/`` together in the right order and wraps them with the wrappers. This also optionally minifies the result to another file. Both files are stored in ``lib/``.

Operation:

```
$ grunt
```

If you need to minify as well:

```
$ grunt default min
```

Dependencies:
 * A terminal (emulator)
 * git
 * [grunt](http://gruntjs.com/)

## Integration

Integrates bundled packages to audiolib.js. To run this operation, you must first have the submodules ready, and it doesn't make much sense unless you update them to the latest version first as well, say we wanted to update ``` sink.js ```:

```sh

git submodule update --init
cd dependencies/sink.js
git pull origin master
cd ../..
grunt integrate all # all is optional, but recommended so that you can see if the tests still run fine.

```

Dependencies:
 * A terminal (emulator)
 * git
 * sh
 * [grunt](http://gruntjs.com/)

## Templates

Some files of audiolib.js are generated from templates, such as the wrappers, package and documentation. You can find these templates from the `` templates/ `` directory. After updating certain things such as the version, you might want to remake these things from the tempates, and that can be done with these simple commands.

```sh

grunt wrappers
grunt package
grunt docs
# Or to update all
grunt update
# You'll probably also want to do this to update the lib/
grunt all

```

Dependencies:
 * A terminal (emulator)
 * sh
 * nodejs
 * npm
 * paramon & script-builder (npm packages, installation: ``` npm install paramon script-builder ```)
 * [grunt](http://gruntjs.com/)
 * (OPTIONAL) for automatic minification of the docs: ``` npm install uglify-js html-minifier clean-css ```

## Config

The aforementioned templates are affected by source files and configuration data. The configuration data contains things such as the version. To change configurations you can either edit ```templates/variables.json``` directly or recommendedly via the config command. Example uses of the config command:

``sh

# Sets version to 0.5.1
./build config version 0.5.1
# Prints out version
./build config version
# Increments version number (you can pick major, minor and/or patch)
# There's also decrement.
./build config version increment minor

``

After making changes to the config it's recommended to run ``` grunt update all ``` to update template generated data and lib/ files to be able to test whether the changes work.

Dependencies:
 * A terminal (emulator)
 * sh
 * nodejs
 * npm
 * paramon & script-builder (npm packages, installation: `` npm install paramon script-builder ``)
 * [grunt](http://gruntjs.com/)

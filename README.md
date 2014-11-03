# flapjacks

flapjacks is a configuration management module. Its primary goal is to make keeping separate configurations for different environments easy and convenient while making configuration itself as flexible as possible.

## Features

* Stackable configuration based on environment name, machine name, user name, and main module name
* Helpers for deep access into the configuration object hierarchy without null check boilerplate
* Opt-in global configuration to any nested node_modules use the first one loaded

## Paths

flapjacks looks for files based on `process.NODE_ENV`, current user, host name, and main module name. It looks in `.`, `./config/`, `~/.$module/`, and `~/.config/$module/`, where `$module` is the main module. So if the main module is `MyNodeThing`, the paths would be `~/.config/MyNodeThing/` and `~/.MyNodeThing/`.

The files are loaded in order from least to most specific:

* `default.config.js`
* `$user.config.js`
* `$host.config.js`
* `$env.config.js`
* `$host.$env.config.js`
* `$user.$env.config.js`
* `$user.$host.config.js`
* `$user.$host.$env.config.js`

This paths searched are in order from least to most specific as wel:

* `./`
* `./config/`
* `~/.config/$module/`
* `~/.$module/`

Each matching config file that is found will be loaded in order, so general settings may be set in `./config/default.config.js` and user specific settings could be set in `~/.config/$module/$user.config.js`.

## Format

The contents of each config file are loaded as the body to a function:

```js
function(config) {
  // your config code here
}
```

The function is executed and passed a config object. The same config object will be passed through each config file, so more specific settings will override less specific settings.

Any Node.js functionality is available within the config function, so you can do anything that a regular node script can do within the function. **Be careful with how you run a program using this!** To be fair though, if you have a compromised account or codebase, this is probably the least of your worries.

## Config Helpers

The config object that is passed around and subsequently returned to the caller has a few helper methods that make setting nested variables and handling arrays a little less painful.

**Note:** `path` is always a string with `.` separated keys.

### set
```js
set(path, value);
set(settings);
```

If called with a path and value, the value at path will become `value`. If there are missing intermediate levels, they will be created for you.

If called with a settings object, each key/value pair will be handled as if it was passed to `set(key, value)`.

### get
```js
get(path[, [default`]);
```

`get` traverses to the given path and returns any value found there. This can be used to return intermediate objects branches as well as value leaves. If an intermiediate does not exist, the optional `default` (otherwise `undefined`) will be returned instead.

### push, pop, slice, shift, unshift

```js
push(path, value...);
pop(path[, default]);
splice(path, index, drop, add...);
shift(path[, default]);
unshift(path, value...);
```

Each of these does what you'd expect from the corresponding `Array.prototype` version after looking up the array at `path`. If the value at path is truthy but not an array, an exception will be thrown. If the value at `path` is falsey, a new array will be added for `push`, `unshift`, and `splice` and the optional `default` (otherwise `undefined`) will be returned from `shift` and `pop`.

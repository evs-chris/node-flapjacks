# flapjacks

flapjacks is a configuration management module. Its primary goal is to make keeping separate configurations for different environments easy and convenient while making configuration itself as flexible as possible.

## Features

* Stackable configuration based on environment name, machine name, user name, and main module name
* Helpers for deep access into the configuration object hierarchy without null check boilerplate
* Opt-in global configuration to any nested `node_modules` use the first one loaded
* Support for JS, JSON, and relaxed JSON configs.

## Example

```js
var config = require('flapjacks').read();
var someVar = config.get('some.nested.path', []); // if that path is undefined, the [] is returned
if (config.foo) {
  // the properties can also be accessed directly, if that's your thing
}
```

## Paths

flapjacks looks for files based on `process.NODE_ENV`, current user, host name, and main module name. It looks in `.`, `./config/`, `~/.$module/`, and `~/.config/$module/`, where `$module` is the main module. So if the main module is `MyNodeThing`, the paths would be `~/.config/MyNodeThing/` and `~/.MyNodeThing/`. You can also specify a name as the only parameter to the `read` function.

The files are loaded in order from least to most specific:

* ``
* `default`
* `$user`
* `$host`
* `$env`
* `$host.$env`
* `$user.$env`
* `$user.$host`
* `$user.$host.$env`

with extensions applied as such:

* `.json'
* `.config.json`
* `.rjson`
* `.config.rjson`
* `.js`
* `.config.js`
* `.config`

This paths searched are in order from least to most specific as well:

* `./`
* `./config/`
* `~/.config/$module/`
* `~/.$module/`
* `~/`

Each matching config file that is found will be loaded in order, so general settings may be set in `./config/$module.default.config.js` and user specific settings could be set in `~/.config/$module/$user.config.js`.

To prevent accidental config overlap, files for paths that aren't specific to the main module will have the module name prepended. Where the default config for `$module` in its `~/.config/$module/` directory would be `~/.config/$module/default.config`, it would be `~/.$module.default.config` in the home directory and `~/.config/$module.default.config` in the `~/.config` directory.

Note that the least specific file name is an empty string, which means that extensions like `config`, `rjson`, etc end up being the file name. This is handy though, when the module name is automatically prepended e.g. `~/.$module.rjson`.

## Format

The contents of each config file are loaded as the body to a function:

```js
function(config) {
  // your config code here
}
```

The function is executed and passed a config object, which is also the context. The same config object will be passed through each config file, so more specific settings will override less specific settings.

Any Node.js functionality is available within the config function, so you can do anything that a regular node script can do within the function. **Be careful with how you run a program using this!** To be fair though, if you have a compromised account or codebase, this is probably the least of your worries.

### RJSON

Relaxed JSON config files are simply JavaScript files that are expected to contain a top-level object definition. They may contain comments and any other valid JS syntax with the only requirement being that there be a single top level set of matching `{` and `}` and no comments before the opening `{` that also contain a `{`. The contents of an RJSON file are also used as the body of a function, but the first `{` will be replaced with `return {` first.

This format is handy for letting you skip all of the usual JSON boilerplate while also letting you specify functions in your config object.

The result of the RJSON config will be merged into the root of the config.

### JSON

JSON files are parsed with `JSON.parse` and the result is merged into the root of the config.

## API

### `read([name])`

Read config files for the module named `name` or the main module name for this process if `name` was not specified. The configuration will be cached, so subsequent calls to `read` will yield the cached result.

### `reread()`

Throws away any cached config and reads the config files again.

### `literal(content[, type])`

Parses the config from `content` instead of pulling it from config files. This is mostly useful for testing. The `type` parameter is optional and may be `json`, `rjson`, or `js`. The default type is `js`.

### `beGlobal(bool)`

If `bool` is true, then a global variable is set with the current instance of flapjacks so that any other modules that get loaded in the process will use this instance instead of getting their own. If it is false, the global variable is emptied and everybody gets their own box of toys again.

### `config`

After the config has been read, the cached version is accessible as the module property `config`.

## Config Helpers

The config object that is passed around and subsequently returned to the caller has a few helper methods that make setting nested variables and handling arrays a little less painful.

**Note:** `path` is always a string with `.` separated keys.

### set
```js
set(path, value);
set(settings);
```

When called with a path and value, the value at path will become `value`. If there are missing intermediate levels, they will be created for you.

When called with a settings object, each key/value pair will be handled as if it was passed to `set(key, value)`.

When called with an empty path, the `value` will be merged into the root config.

### merge
```js
merge(path, value);
```

Merge the object `value` into the given `path`. This is useful for adding settings to an existing setting hierarchy.

### get
```js
get(path[, [default`]);
```

`get` traverses to the given path and returns any value found there. This can be used to return intermediate objects branches as well as value leaves. If an intermiediate does not exist, the optional `default` (otherwise `undefined`) will be returned instead.

When called with an empty path `''`, the config object is returned.

### push, pop, splice, shift, unshift

```js
push(path, value...);
pop(path[, default]);
splice(path, index, drop, add...);
shift(path[, default]);
unshift(path, value...);
```

Each of these does what you'd expect from the corresponding `Array.prototype` version after looking up the array at `path`. If the value at path is truthy but not an array, an exception will be thrown. If the value at `path` is falsey, a new array will be added for `push`, `unshift`, and `splice` and the optional `default` (otherwise `undefined`) will be returned from `shift` and `pop`.

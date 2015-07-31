## 0.2.1

* __BUG:__ Make sure found config files aren't actually directories.

## 0.2.0

* Paths can now be optionally excluded when searching for config files. A list of additional paths can also be supplied.
* Types can now be optionally skipped.
* __BUG:__ Fixes bug with `get`ing a value that is `false`, `null`, `''`, or `0`.

## 0.1.0

* Adds support for merging objects into the config.
* Adds support for JSON and RJSON config files.
* Eliminates the opportunity to have different module names load the same default config file.
* Adds support for manually specifying the module name when reading config files.
* Empty paths are now supported for `get` and `set` config helpers.

## 0.0.3

* __BUG:__ Fixes issue with reading module path.

## 0.0.2

* *BUG:* Fixes issue with multiplication of path nesting.

## 0.0.1

Initial version

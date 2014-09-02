# flapjacks

flapjacks is a configuration management module. Its primary goal is to make keeping separate configurations for different environments easy and convenient while making configuration itself as flexible as possible.

## Features

* Stackable configuration based on environment name, machine name, user name, and main module name
* Helpers for deep access into the configuration object hierarchy without null check boilerplate
* Opt-in global configuration to any nested node_modules use the first one loaded

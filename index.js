'use strict';

var fs = require('fs');
var path = require('path');
var log = (function() {
  try {
    return require('blue-ox')('flapjacks');
  } catch (e) {
    return { error: function(v) { console.log(v); }, info: function() {}, trace: function() {} };
  }
})();

// global(!) if you want to defeat dependencies of dependencies
// you must opt in though -- beGlobal() in main module
if (global.hasOwnProperty('flapjacks')) {
  module.exports = global.flapjacks;
  return global.flapjacks;
}

var notAnArray = 'That\'s no array, it\'s a space station.';
function slice(target, count) {
  return Array.prototype.slice.call(target, count);
}

var proto = {
  get: function(path, value) {
    path = path.split('.');
    var c = this;
    if (path.length === 1 && path[0] === '') return c || value;
    for (var i = 0; c && i < path.length; i++) {
      c = c[path[i]];
    }
    return c || value;
  },
  set: function(path, value) {
    if (typeof path !== 'string' && arguments.length === 1) {
      for (var k in path) {
        if (path.hasOwnProperty(k)) this.set(k, path[k]);
      }
    } else {
      path = path.split('.');
      var c = this;
      if (path.length === 1 && path[0] === '') {
        this.merge('', value);
        return;
      }
      for (var i = 0; i < path.length - 1; i++) {
        if (!c[path[i]]) {
          c = c[path[i]] = {};
        } else c = c[path[i]];
      }
      c[path[path.length - 1]] = value;
    }
  },
  merge: function(path, value, noOver) {
    if (typeof path !== 'string' && arguments.length === 1) {
      for (var k in path) {
        if (path.hasOwnProperty(k)) this.merge(k, path[k]);
      }
    } else {
      var target = this.get(path), out = target || {};
      assignMerge(out, value, noOver);
      if (!target) this.set(path, out);
    }
  },
  push: function(path) {
    var arr = this.get(path);
    var args = slice(arguments, 1);
    if (!arr) {
      this.set(path, args);
      return args.length;
    } else if (Array.isArray(arr)) return arr.push.apply(arr, args);
    else throw new Error(notAnArray);
  },
  splice: function(path, idx, drop) {
    var arr = this.get(path);
    var ap = Array.prototype;
    var add = slice(arguments, 3);
    if (!arr) {
      this.set(path, add);
      return [];
    } else if (Array.isArray(arr)) {
      add.unshift(drop);
      add.unshift(idx);
      return ap.splice.apply(arr, add);
    } else throw new Error(notAnArray);
  },
  pop: function(path, value) {
    var arr = this.get(path);
    if (!arr) return value;
    else if (Array.isArray(arr)) return arr.pop();
    else throw new Error(notAnArray);
  },
  shift: function(path, value) {
    var arr = this.get(path);
    if (!arr) return value;
    else if (Array.isArray(arr)) return arr.shift();
    else throw new Error(notAnArray);
  },
  unshift: function(path) {
    var arr = this.get(path);
    var args = slice(arguments, 1);
    if (!arr) {
      this.set(path, args);
      return args.length;
    } else if (Array.isArray(arr)) return arr.unshift.apply(arr, args);
    else throw new Error(notAnArray);
  }
};

function assign(target, source, noOver) {
  for (var k in source) {
    if (!noOver || (noOver && !target.hasOwnProperty(k))) {
      target[k] = source[k];
    }
  }
}

function assignMerge(target, source, noOver) {
  for (var k in source) {
    if (target[k] === undefined) target[k] = source[k];
    else if (typeof target[k] === 'object' && typeof source[k] === 'object') {
      assignMerge(target[k], source[k], noOver);
    } else target[k] = source[k];
  }
}

function objectAtPath(target, path) {
  path = path.split('.');
  var key;
  for (var i = 0; i < path.length; i++) {

  }
}

function read() {
  var main = (function() {
    var m = module;
    while (m.parent) m = m.parent;
    var p = path.dirname(m.filename);
    var name;

    while (p.length > 0 && !name) {
      var f = path.join(p, 'package.json');
      if (fs.existsSync(f)) {
        name = JSON.parse(fs.readFileSync(f)).name;
      } else p = path.dirname(p);
    }

    return name;
  })();

  var env = process.env.NODE_ENV || 'development';
  var user = process.env.USER || process.env.USERNAME;
  var home = (function() {
  if (process.env.HOME) return process.env.HOME;
  else if (process.env.HOMEDRIVE) return process.env.HOMEDRIVE + process.env.HOMEPATH;
  })();
  var host = require('os').hostname().replace(/([^\.]*).*/, '$1');

  var files = (function() {
    var roots = [process.cwd(), path.join(process.cwd(), 'config'), path.join(home, '.config', main), path.join(home, '.' + main)];
    var files = ['default', user, host, env, host + '.' + env, user + '.' + env, user + '.' + host, user + '.' + host + '.' + env].reduce(function(a, c) { a.push(s + '.json', s + '.config.json', s + '.rjson', s + '.config.rjson', s + '.js', s + '.config.js', s + '.config'); return a; }, []);
    var res = [];
    for (var r = 0; r < roots.length; r++) {
      for (var i = 0; i < files.length; i++) {
        var tmp = path.join(roots[r], files[i]);
        if (fs.existsSync(tmp)) res.push(tmp);
        else log.trace('not found: ' + tmp);
      }
    }
    return res;
  })();

  var res = Object.create(proto);

  log.info('Loading configuration from ' + files.length + ' files in order\n' + files.join('\n'));

  for (var i = 0; i < files.length; i++) {
    readConfig(fs.readFileSync(files[i]), res, files[i], path.extname(files[i]).toLowerCase());
  }

  return res;
}

function readConfig(str, out, file, type) {
  var res = out || Object.create(proto), fn;

  try {
    if (type === 'json') {
      res.set('', JSON.parse(str));
    } else if (type === 'rjson') {
      str = str.replace(/\{/, 'return {');
      fn = new Function(str);
      res.set('', fn());
    } else {
      /* jshint evil: true */
      fn = new Function('config', str);
      fn.call(res, res);
    }
  } catch (e) {
    log.error('Failed on ' + (file || '<literal>'), e);
  }

  return res;
}

var res, current = false;
var out = module.exports = {};

out.config = res;

out.read = function() {
  if (!current) {
    current = true;
    out.config = res = read();
  }
  return res;
};

out.reread = function() {
  current = false;
  return out.read();
};

out.literal = function(str, type) {
  current = true;
  out.config = res = readConfig(str, null, null, type);
  return res;
};

out.beGlobal = function(please) { if (arguments.length === 0 || please) global.flapjacks = out; else delete global.flapjacks; };

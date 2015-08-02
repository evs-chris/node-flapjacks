'use strict';

var fs = require('fs');
var path = require('path');
var log = (function() {
  try {
    return require('blue-ox')('flapjacks', 'info');
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
    if (path.length === 1 && path[0] === '') return c !== undefined ? c : value;
    for (var i = 0; c && i < path.length; i++) {
      c = c[path[i]];
    }
    return c !== undefined ? c : value;
  },
  has: function(path) {
    path = path.split('.');
    var c = this;
    if (path.length === 1 && path[0] === '') return c !== undefined;
    for (var i = 0; c && i < path.length; i++) {
      if (!(path[i] in c)) return false;
      c = c[path[i]];
    }
    return !!c;
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
  ensure: function(path, value) {
    if (!this.has(path)) this.set(path, value);
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

function assign(target, source, noOver) { // jshint ignore: line
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

function read(opts) {
  opts = opts || {};
  var main = process.env.FLAPJACK_NAME || opts.name || (function() {
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
    var roots = [];
    if (opts.skipAllRoots !== true) {
      if (opts.skipRootCWD !== true) roots.push(process.cwd() + '/');
      if (opts.skipRootCWDConfig !== true) roots.push(path.join(process.cwd(), 'config') + '/' + main + '.');
      if (opts.skipRootConfig !== true) roots.push(path.join(home, '.config', main) + '/');
      if (opts.skipRootHomeModule !== true) roots.push(path.join(home, '.' + main) + '/');
      if (opts.skipRootHome !== true) roots.push(home + '/.' + main + '.');
    }
    if (Array.isArray(opts.roots)) roots = roots.concat(opts.roots);

    var types = [];
    if (opts.skipTypeJSON !== true) types.push('json', 'config.json');
    if (opts.skipTypeRJSON !== true) types.push('rjson', 'config.rjson');
    if (opts.skipTypeScript !== true) types.push('js', 'config.js', 'config');

    var files = ['', 'default', user, host, env, host + '.' + env, user + '.' + env, user + '.' + host, user + '.' + host + '.' + env].reduce(function(a, c) { c = c.length > 0 ? c + '.' : c; a.push.apply(a, types.map(function(t) { return c + t; })); return a; }, []);
    var res = [];
    for (var r = 0; r < roots.length; r++) {
      for (var i = 0; i < files.length; i++) {
        var tmp = roots[r] + files[i];
        var st;
        try { st = fs.statSync(tmp); } catch (e) { st = false; }
        if (st && !st.isDirectory()) res.push(tmp);
        else log.trace('not found: ' + tmp);
      }
    }
    return res;
  })();

  var res = Object.create(proto);

  log.info('Loading configuration from ' + files.length + ' files in order\n' + files.join('\n'));

  var type;
  for (var i = 0; i < files.length; i++) {
    type = path.extname(files[i]).toLowerCase().substr(1);
    if (type === '') type = path.basename(files[i]);
    readConfig(fs.readFileSync(files[i]).toString('utf8'), res, files[i], type);
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
      /* jshint evil: true */
      fn = new Function(str);
      res.set('', fn() || {});
    } else {
      /* jshint evil: true */
      fn = new Function('config', str);
      fn.call(res, res);
    }
  } catch (e) {
    log.error('Failed on ' + (file || '<literal>'), e);
    log.trace(str);
  }

  return res;
}

var res, current = false;
var out = module.exports = {};

out.config = res;

out.read = function(name) {
  if (!current) {
    current = true;
    out.config = res = read(name);
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

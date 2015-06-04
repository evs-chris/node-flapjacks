"use strict";

/* global it */
/* global describe */

require('should');
var mod = require('./');

describe('flapjack config', function() {
  it('should have a set helper', function() {
    var c = mod.literal("config.set('foo.bar', 1);");
    c.foo.bar.should.equal(1);
  });

  it('should be able to set non-nested keys', function() {
    var c = mod.literal("config.set('port', 2121);");
    c.port.should.equal(2121);
  });

  it('should be able to merge objects', function() {
    var c = mod.literal("config.set('foo.bar', { baz: { bar: true } }); config.merge('foo.bar.baz', { bop: false });");
    c.foo.bar.baz.bop.should.equal(false);
    c.foo.bar.baz.bar.should.equal(true);
  });

  it('should return the base object with an empty string path', function() {
    var c = mod.literal("config.set('foo', 10);");
    c.get('').should.equal(c);
    c.get('foo').should.equal(10);
  });

  it('should merge in root sets', function() {
    var c = mod.literal("config.set('foo', 10)");
    c.set('', { bar: 20 });
    c.foo.should.equal(10);
    c.bar.should.equal(20);
  });

  it('should handle json config', function() {
    var c = mod.literal('{ "foo": 10, "bar": [ true ] }', 'json');
    c.foo.should.equal(10);
    c.bar[0].should.equal(true);
  });

  it('should handle relaxed json config', function() {
    var c = mod.literal("{ foo: 'bar', baz: [1, 2, 3], bop: function() { return 'boop'; } }", 'rjson');
    c.bop().should.equal('boop');
    c.foo.should.equal('bar');
  });
});

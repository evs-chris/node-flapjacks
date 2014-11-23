"use strict";

/* global it */
/* global describe */

var should = require('should');
var mod = require('./');

if (should) ; // ...jshint, I swear I'm using this

describe('flapjack config', function() {
  it('should have a set helper', function() {
    var c = mod.literal("config.set('foo.bar', 1);");
    c.foo.bar.should.equal(1);
  });

  it('should be able to set non-nested keys', function() {
    var c = mod.literal("config.set('port', 2121);");
    c.port.should.equal(2121);
  });
});

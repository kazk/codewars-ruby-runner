"use strict";

const expect = require('chai').expect;
const run = require('../');

describe('services', function() {
  it('can run redis', function(done) {
    run({
      language: 'ruby',
      code: [
        'puts `ls`',
        'fork do',
        '  exec "redis-server"',
        'end',
        "require 'redis'",
        'r = Redis.new',
        "r.set('a', 'b')"
      ].join('\n'),
      fixture: "Test.assert_equals(r.get('a'), 'b')",
      testFramework: 'cw-2'
    }, function(buffer) {
      console.log(buffer.stderr);
      expect(buffer.stdout).to.contain('<PASSED::>Test Passed: Value == \"b\"');
      done();
    });
  });
});

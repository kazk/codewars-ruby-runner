"use strict";

const expect = require('chai').expect;
const run = require('../');

describe('ruby runner run', function() {
  it('should handle basic code evaluation', function(done) {
    run({
      language: 'ruby',
      code: 'puts 42'
    }, function(buffer) {
      expect(buffer.stdout).to.equal('42\n');
      done();
    });
  });

  it('should support githubRepo downloading', function(done) {
    run({
      language: 'ruby',
      code: [
        'require "sample"',
        'puts Sample.new.message'
      ].join('\n'),
      githubRepo: 'jhoffner/test'
    }, function(buffer) {
      console.log(buffer.stdout);
      expect(buffer.stdout).to.contain('sample\n');
      done();
    });
  });

  it('should support gist downloading', function(done) {
    run({
      language: 'ruby',
      code: 'puts `ls`',
      setup: '# @config: gist 3acc7b81436ffe4ad20800e242ccaff6',
    }, function(buffer) {
      console.log(buffer.stdout);
      expect(buffer.stdout).to.contain('gist.js\n');
      done();
    });
  });

  it('should support config bash-file', function(done) {
    run({
      language: 'ruby',
      code: 'puts `ls`',
      setup: [
        '# @config: github-repo jhoffner/test',
        '# @config: bash-file start.sh',
      ].join('\n'),
    }, function(buffer) {
      expect(buffer.stdout).to.contain('test.txt\n');
      done();
    });
  });

  it('should support additional files', function(done) {
    run({
      language: 'ruby',
      code: 'puts `ls`',
      files: {
        'myconfig.rb': 'puts 123'
      }
    }, function(buffer) {
      expect(buffer.stdout).to.contain('myconfig.rb');
      done();
    });
  });
});

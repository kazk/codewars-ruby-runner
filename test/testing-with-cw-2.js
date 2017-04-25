"use strict";

const expect = require('chai').expect;
const run = require('../');

describe('cw-2', function() {
  it('should handle a basic assertion', function(done) {
    run({
      language: 'ruby',
      code: 'a = 1',
      fixture: 'Test.expect a == 1',
      testFramework: 'cw-2'
    }, function(buffer) {
      expect(buffer.stdout).to.equal('<PASSED::>Test Passed\n');
      done();
    });
  });

  it('should handle a basic description', function(done) {
    run({
      language: 'ruby',
      code: 'a = 1',
      fixture: 'describe("test") { Test.expect a == 1 }',
      testFramework: 'cw-2'
    }, function(buffer) {
      expect(buffer.stdout).to.contain('<DESCRIBE::>test\n<PASSED::>Test Passed\n<COMPLETEDIN::>');
      expect(buffer.stdout).to.contain('ms');
      done();
    });
  });

  describe('error handling', function() {
    it('should handle a mix of failures and successes', function(done) {
      run({
        language: 'ruby',
        code: 'a = 1',
        fixture: [
          'describe "test" do',
          '  it("test1") { Test.expect(false) }',
          '  it("test2") { Test.expect(true) }',
          'end'
        ].join('\n'),
        testFramework: 'cw-2'
      }, function(buffer) {
        console.log(buffer.stdout);
        expect(buffer.stdout).to.contain('<FAILED::>Value is not what was expected');
        expect(buffer.stdout).to.contain('<PASSED::>Test Passed');
        done();
      });
    });
    it('should gracefully handle custom errors', function(done) {
      run({
        language: 'ruby',
        code: 'a = 1',
        fixture: [
          'describe "test" do',
          '  it("test1") { raise "boom!" }',
          '  it("test2") { Test.expect(true) }',
          'end'
        ].join('\n'),
        testFramework: 'cw-2'
      }, function(buffer) {
        expect(buffer.stdout).to.contain('<ERROR::>');
        expect(buffer.stdout).to.contain('boom!');
        expect(buffer.stdout).to.contain('<PASSED::>Test Passed');
        done();
      });
    });
    it('should gracefully handle reference errors', function(done) {
      run({
        language: 'ruby',
        code: 'a = 1',
        fixture: [
          'describe "test" do',
          '  it("test1") { a.idontexist() }',
          '  it("test2") { Test.expect(true) }',
          'end'
        ].join('\n'),
        testFramework: 'cw-2'
      }, function(buffer) {
        expect(buffer.stdout).to.contain('<ERROR::>');
        expect(buffer.stdout).to.contain('<:LF:>');
        expect(buffer.stdout).to.contain('NoMethodError:');
        expect(buffer.stdout).to.not.contain('from /cli-runner/');
        // expect(buffer.stdout).to.not.contain('-e:');
        // expect(buffer.stdout).to.not.contain('cw-2.rb');
        expect(buffer.stdout).to.contain('<PASSED::>Test Passed');
        done();
      });
    });

    it('should prevent short circuiting', function(done) {
      run({
        language: 'ruby',
        code: [
          "def example",
          "   Test.expect(true);",
          "   raise 'early error'",
          "end"
        ].join("\n"),
        fixture: [
          'describe "test" do',
          '   it("test1") { example }',
          '   it("test2") { Test.expect(false)}',
          'end'
        ].join('\n'),
        testFramework: 'cw-2'
      }, function(buffer) {
        expect(buffer.stdout).to.contain('<ERROR::>');
        done();
      });
    });
  });
});

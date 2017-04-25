"use strict";

const expect = require('chai').expect;
const run = require('../');

describe('rspec', function() {
  it('should handle a basic assertion', function(done) {
    run({
      language: 'ruby',
      code: '$a = 1',
      fixture: [
        'describe "test" do',
        '  it("test2") { expect($a).to eq(1) }',
        'end'
      ].join('\n'),
      testFramework: 'rspec'
    }, function(buffer) {
      expect(buffer.stdout).to.equal('<DESCRIBE::>test\n<IT::>test2\n<PASSED::>Test Passed\n<COMPLETEDIN::>\n<COMPLETEDIN::>\n');
      done();
    });
  });
  it('should support let', function(done) {
    run({
      language: 'ruby',
      code: '$a = 1',
      fixture: [
        'describe "test" do',
        '  let(:b) { $a }',
        '  it("test2") { expect(b).to eq(1) }',
        'end'
      ].join('\n'),
      testFramework: 'rspec'
    }, function(buffer) {
      expect(buffer.stdout).to.equal('<DESCRIBE::>test\n<IT::>test2\n<PASSED::>Test Passed\n<COMPLETEDIN::>\n<COMPLETEDIN::>\n');
      done();
    });
  });
  it('should handle a basic failed assertion', function(done) {
    run({
      language: 'ruby',
      code: '$a = 1',
      fixture: [
        'describe "test" do',
        '  it("test2") { expect($a).to eq(2) }',
        'end'
      ].join('\n'),
      testFramework: 'rspec'
    }, function(buffer) {
      expect(buffer.stdout).to.contain('<DESCRIBE::>test\n<IT::>test2');
      expect(buffer.stdout).to.contain('<FAILED::>');
      expect(buffer.stdout).to.not.contain('<PASSED::>');
      expect(buffer.stdout).to.not.contain('simplified backtrace');
      done();
    });
  });
  it('should handle errored code', function(done) {
    run({
      language: 'ruby',
      code: 'a = 1',
      fixture: [
       'describe "test" do',
       '  it("test1") { a.idontexist() }',
       '  it("test2") { expect(true) }',
       'end',
      ].join('\n'),
      testFramework: 'rspec'
    }, function(buffer) {
      expect(buffer.stdout).to.contain('<DESCRIBE::>test');
      expect(buffer.stdout).to.contain('<IT::>test1');
      expect(buffer.stdout).to.contain('<IT::>test2');
      expect(buffer.stdout).to.contain('<ERROR::>');
      done();
    });
  });
  it('should prevent short circuiting', function(done) {
    run({
      language: 'ruby',
      code: [
        "def example",
        "   expect(true);",
        "   raise 'early error'",
        "end"
      ].join("\n"),
      fixture: [
        'describe "test" do',
        '   it("test1") { example }',
        '   it("test2") { expect(false)}',
        'end'
      ].join('\n'),
      testFramework: 'rspec'
    }, function(buffer) {
      expect(buffer.stdout).to.contain('<ERROR::>');
      done();
    });
  });
});

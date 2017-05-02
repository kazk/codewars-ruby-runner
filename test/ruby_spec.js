"use strict";

const fs = require('fs');

const expect = require('chai').expect;
const yaml = require('js-yaml');
const WritableStreamBuffer = require('stream-buffers').WritableStreamBuffer;

const Docker = require('dockerode');
const docker = new Docker();

describe('ruby runner run', function() {
  it('should handle basic code evaluation', function(done) {
    run({
      format: 'json',
      language: 'ruby',
      code: 'puts 42'
    }).then(function(buffer) {
      expect(buffer.stdout).to.equal('42\n');
      showBuffer(buffer);
      done();
    });
  });

  it('should support githubRepo downloading', function(done) {
    run({
      format: 'json',
      language: 'ruby',
      code: [
        'require "sample"',
        'puts Sample.new.message'
      ].join('\n'),
      githubRepo: 'jhoffner/test'
    }).then(function(buffer) {
      expect(buffer.stdout).to.contain('sample\n');
      showBuffer(buffer);
      done();
    });
  });

  it('should support gist downloading', function(done) {
    run({
      format: 'json',
      language: 'ruby',
      code: 'puts `ls`',
      setup: '# @config: gist 3acc7b81436ffe4ad20800e242ccaff6',
    }).then(function(buffer) {
      expect(buffer.stdout).to.contain('gist.js\n');
      showBuffer(buffer);
      done();
    });
  });

  it('should support config bash-file', function(done) {
    run({
      format: 'json',
      language: 'ruby',
      code: 'puts `ls`',
      setup: [
        '# @config: github-repo jhoffner/test',
        '# @config: bash-file start.sh',
      ].join('\n'),
    }).then(function(buffer) {
      expect(buffer.stdout).to.contain('test.txt\n');
      showBuffer(buffer);
      done();
    });
  });

  it('should support additional files', function(done) {
    run({
      format: 'json',
      language: 'ruby',
      code: 'puts `ls`',
      files: {
        'myconfig.rb': 'puts 123'
      }
    }).then(function(buffer) {
      expect(buffer.stdout).to.contain('myconfig.rb');
      showBuffer(buffer);
      done();
    });
  });
});

describe('services', function() {
  it('can run redis', function(done) {
    run({
      format: 'json',
      language: 'ruby',
      solution: [
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
    }).then(function(buffer) {
      expect(buffer.stdout).to.contain('<PASSED::>Test Passed: Value == \"b\"');
      showBuffer(buffer);
      done();
    });
  });

  it('can run redis using opts.services', function(done) {
    run({
      format: 'json',
      language: 'ruby',
      solution: [
        "require 'redis'",
        'r = Redis.new',
        "r.set('a', 'b')"
      ].join('\n'),
      fixture: "Test.assert_equals(r.get('a'), 'b')",
      services: ['redis'],
      testFramework: 'cw-2'
    }).then(function(buffer) {
      expect(buffer.stdout).to.contain('<PASSED::>Test Passed: Value == \"b\"');
      showBuffer(buffer);
      done();
    });
  });
});


describe('cw-2', function() {
  it('should handle a basic assertion', function(done) {
    run({
      format: 'json',
      language: 'ruby',
      code: 'a = 1',
      fixture: 'Test.expect a == 1',
      testFramework: 'cw-2'
    }).then(function(buffer) {
      expect(buffer.stdout).to.equal('<PASSED::>Test Passed\n');
      showBuffer(buffer);
      done();
    });
  });

  it('should handle a basic description', function(done) {
    run({
      format: 'json',
      language: 'ruby',
      code: 'a = 1',
      fixture: 'describe("test") { Test.expect a == 1 }',
      testFramework: 'cw-2'
    }).then(function(buffer) {
      expect(buffer.stdout).to.contain('<DESCRIBE::>test\n<PASSED::>Test Passed\n<COMPLETEDIN::>');
      expect(buffer.stdout).to.contain('ms');
      showBuffer(buffer);
      done();
    });
  });

  describe('error handling', function() {
    it('should handle a mix of failures and successes', function(done) {
      run({
        format: 'json',
        language: 'ruby',
        code: 'a = 1',
        fixture: [
          'describe "test" do',
          '  it("test1") { Test.expect(false) }',
          '  it("test2") { Test.expect(true) }',
          'end'
        ].join('\n'),
        testFramework: 'cw-2'
      }).then(function(buffer) {
        expect(buffer.stdout).to.contain('<FAILED::>Value is not what was expected');
        expect(buffer.stdout).to.contain('<PASSED::>Test Passed');
        showBuffer(buffer);
        done();
      });
    });

    it('should gracefully handle custom errors', function(done) {
      run({
        format: 'json',
        language: 'ruby',
        code: 'a = 1',
        fixture: [
          'describe "test" do',
          '  it("test1") { raise "boom!" }',
          '  it("test2") { Test.expect(true) }',
          'end'
        ].join('\n'),
        testFramework: 'cw-2'
      }).then(function(buffer) {
        expect(buffer.stdout).to.contain('<ERROR::>');
        expect(buffer.stdout).to.contain('boom!');
        expect(buffer.stdout).to.contain('<PASSED::>Test Passed');
        showBuffer(buffer);
        done();
      });
    });

    it('should gracefully handle reference errors', function(done) {
      run({
        format: 'json',
        language: 'ruby',
        code: 'a = 1',
        fixture: [
          'describe "test" do',
          '  it("test1") { a.idontexist() }',
          '  it("test2") { Test.expect(true) }',
          'end'
        ].join('\n'),
        testFramework: 'cw-2'
      }).then(function(buffer) {
        expect(buffer.stdout).to.contain('<ERROR::>');
        expect(buffer.stdout).to.contain('<:LF:>');
        expect(buffer.stdout).to.contain('NoMethodError:');
        expect(buffer.stdout).to.not.contain('from /cli-runner/');
        // expect(buffer.stdout).to.not.contain('-e:');
        // expect(buffer.stdout).to.not.contain('cw-2.rb');
        expect(buffer.stdout).to.contain('<PASSED::>Test Passed');
        showBuffer(buffer);
        done();
      });
    });

    it('should prevent short circuiting', function(done) {
      run({
        format: 'json',
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
      }).then(function(buffer) {
        expect(buffer.stdout).to.contain('<ERROR::>');
        showBuffer(buffer);
        done();
      });
    });
  });

  describe('Example Challenges', function() {
    const examples = yaml.safeLoad(fs.readFileSync(__dirname + '/fixtures/cw-2-examples.yml', 'utf8'));
    if (!examples) return;

    for (const name of Object.keys(examples)) {
      const example = examples[name];
      it('should define an initial code block', function() {
        expect(example.initial).to.be.a('string');
      });

      it('should have a passing ' + name + ' example', function(done) {
        run({
          format: 'json',
          testFramework: 'cw-2',
          setup: example.setup,
          code: example.answer,
          fixture: example.fixture,
        }).then(function(buffer) {
          expect(buffer.stdout).to.not.contain('<FAILED::>');
          expect(buffer.stdout).to.not.contain('<ERROR::>');
          showBuffer(buffer);
          done();
        });
      });
    }
  });
});


describe('rspec', function() {
  it('should handle a basic assertion', function(done) {
    run({
      format: 'json',
      language: 'ruby',
      code: '$a = 1',
      fixture: [
        'describe "test" do',
        '  it("test2") { expect($a).to eq(1) }',
        'end'
      ].join('\n'),
      testFramework: 'rspec'
    }).then(function(buffer) {
      expect(buffer.stdout).to.equal('<DESCRIBE::>test\n<IT::>test2\n<PASSED::>Test Passed\n<COMPLETEDIN::>\n<COMPLETEDIN::>\n');
      showBuffer(buffer);
      done();
    });
  });

  it('should support let', function(done) {
    run({
      format: 'json',
      language: 'ruby',
      code: '$a = 1',
      fixture: [
        'describe "test" do',
        '  let(:b) { $a }',
        '  it("test2") { expect(b).to eq(1) }',
        'end'
      ].join('\n'),
      testFramework: 'rspec'
    }).then(function(buffer) {
      expect(buffer.stdout).to.equal('<DESCRIBE::>test\n<IT::>test2\n<PASSED::>Test Passed\n<COMPLETEDIN::>\n<COMPLETEDIN::>\n');
      showBuffer(buffer);
      done();
    });
  });

  it('should handle a basic failed assertion', function(done) {
    run({
      format: 'json',
      language: 'ruby',
      code: '$a = 1',
      fixture: [
        'describe "test" do',
        '  it("test2") { expect($a).to eq(2) }',
        'end'
      ].join('\n'),
      testFramework: 'rspec'
    }).then(function(buffer) {
      expect(buffer.stdout).to.contain('<DESCRIBE::>test\n<IT::>test2');
      expect(buffer.stdout).to.contain('<FAILED::>');
      expect(buffer.stdout).to.not.contain('<PASSED::>');
      expect(buffer.stdout).to.not.contain('simplified backtrace');
      showBuffer(buffer);
      done();
    });
  });

  it('should handle errored code', function(done) {
    run({
      format: 'json',
      language: 'ruby',
      code: 'a = 1',
      fixture: [
        'describe "test" do',
        '  it("test1") { a.idontexist() }',
        '  it("test2") { expect(true) }',
        'end',
      ].join('\n'),
      testFramework: 'rspec'
    }).then(function(buffer) {
      expect(buffer.stdout).to.contain('<DESCRIBE::>test');
      expect(buffer.stdout).to.contain('<IT::>test1');
      expect(buffer.stdout).to.contain('<IT::>test2');
      expect(buffer.stdout).to.contain('<ERROR::>');
      showBuffer(buffer);
      done();
    });
  });

  it('should prevent short circuiting', function(done) {
    run({
      format: 'json',
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
    }).then(function(buffer) {
      expect(buffer.stdout).to.contain('<ERROR::>');
      showBuffer(buffer);
      done();
    });
  });
});

// TODO: Testing this way prevents us from logging because JSON.parse() will fail
function run(opts) {
  // shovel.js: MAX_BUFFER=1500*1024, MAX_DATA_BUFFER=50*1024
  const out = new WritableStreamBuffer({
    initialSize: 500 * 1024,
    incrementAmount: 50 * 1024
  });
  return docker.run('kazk/codewars-ruby-runner', ['run-json', JSON.stringify(opts)], out)
  .then(function(container) {
    container.remove();
    out.end();
    return JSON.parse(out.getContentsAsString('utf8'));
  })
  .catch(function(err) {
    console.log(err);
  });
}

function showBuffer(buffer) {
  if (buffer.stdout != '') {
    process.stdout.write('-'.repeat(32) + ' STDOUT ' + '-'.repeat(32) + '\n');
    process.stdout.write(buffer.stdout);
    process.stdout.write('-'.repeat(72) + '\n');
  }

  if (buffer.stderr != '') {
    process.stdout.write('-'.repeat(32) + ' STDERR ' + '-'.repeat(32) + '\n');
    process.stdout.write(buffer.stderr);
    process.stdout.write('-'.repeat(72) + '\n');
  }
}

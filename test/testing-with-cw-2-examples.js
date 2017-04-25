"use strict";

const fs = require('fs');
const expect = require('chai').expect;
const yaml = require('js-yaml');
const run = require('../');

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
        testFramework: 'cw-2',
        setup: example.setup,
        code: example.answer,
        fixture: example.fixture,
      }, function(buffer) {
        expect(buffer.stdout).to.not.contain('<FAILED::>');
        expect(buffer.stdout).to.not.contain('<ERROR::>');
        if (buffer.stderr) console.log(buffer.stderr);
        done();
      });
    });
  }
});

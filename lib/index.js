"use strict";

const runner = require('@kazk/codewars-runner');
const shovel = runner.shovel;
const prepareRSpec = require('./prepare-rspec');
const prepareCw2 = require('./prepare-cw-2');

module.exports = function run(opts, cb) {
  shovel.start(opts, cb, {
    modifyOpts() {
      // if a github repo was provided, add the workspace to the load path so that requires work correctly
      if (opts.githubRepo || opts.files || opts.gist) {
        opts.setup = `$LOAD_PATH << '/home/codewarrior'\n${opts.setup || ''}`;
      }
    },
    solutionOnly(runCode) {
      var code = opts.solution;
      if (opts.setup) code = opts.setup + '\n' + code;
      runCode({name: 'ruby', args: ['-e', code], options: {cwd: opts.dir}});
    },
    testIntegration(runCode) {
      switch (opts.testFramework) {
        case 'cw':
        case 'cw-2':
          return prepareCw2(opts, runCode);
        case 'rspec':
          return prepareRSpec(opts, runCode);

        default:
          throw 'Test framework is not supported';
      }
    },
    sanitizeStdErr(error) {
      return error.replace(/[\w/-]*(cw-2.rb):[\d]*:in( `(measure|wrap_error|it|describe)'<:LF:>)?/g, '').replace(/-e:[\d]*:in/g, '').replace('  ', ' ').replace(/<:LF:> `(block in )?(<main>|describe|it)'/g, '').replace('  ', ' ');
    },
    sanitizeStdOut(stdout) {
      return this.sanitizeStdErr(stdout);
    }
  });
};

module.exports.prepareRSpec = prepareRSpec;
module.exports.prepareCw2 = prepareCw2;

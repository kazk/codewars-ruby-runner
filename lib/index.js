"use strict";

const runner = require('@kazk/codewars-runner');
const shovel = runner.shovel;
const prepareRSpec = require('./prepare-rspec');
const prepareCw2 = require('./prepare-cw-2');

module.exports = function run(opts) {
  return shovel.start(opts, {
    modifyOpts(opts) {
      // if a github repo was provided, add the workspace to the load path so that requires work correctly
      if (opts.githubRepo || opts.files || opts.gist) {
        opts.setup = `$LOAD_PATH << '${opts.dir}'\n${opts.setup || ''}`;
      }
      if (opts.timeout == null) opts.timeout = 12000;
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
    },

    startService(service, opts) {
      if (service == 'redis') return startRedis(opts);
      return Promise.resolve();
    }
  });
};

module.exports.prepareRSpec = prepareRSpec;
module.exports.prepareCw2 = prepareCw2;

const cp = require('child_process');
function startRedis(opts) {
  return new Promise((resolve, reject) => {
    opts.publish('status', 'Starting redis-server');
    const rs = cp.spawn('redis-server', ['--dir', opts.dir]);
    rs.stdout.on('data', (data) => {
      if (data && data.includes('Running')) resolve();
    });
    rs.on('error', reject);
    setTimeout(() => reject('timeout'), 2000);
  }).catch(err => {
    console.log(err);
  });
}

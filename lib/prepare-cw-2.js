"use strict";

const prepareEntryFile = require('./prepare-entry-file');

module.exports = function prepareCw2(opts, exec) {
  const requireFramework = "require('/runner/frameworks/ruby/cw-2')";
  // by default cw-2 concatenates files so this special option causes separate files to be used instead
  if (opts.entryPath || opts.useSeparateFiles) {
    exec({
      name: 'ruby',
      args: [prepareEntryFile(opts, requireFramework)],
      options: {cwd: opts.dir}
    });
  }
  else {
    const code = [requireFramework];
    if (opts.setup) code.push(opts.setup);
    code.push(opts.solution);
    code.push(opts.fixture);
    exec({
      name: 'ruby',
      args: ['-e', code.join('\n')],
      options: {cwd: opts.dir}
    });
  }
};

"use strict";

const runner = require('@kazk/codewars-runner');
const codeWriteSync = runner.util.codeWriteSync;

// used when a single file will be used as the entry point. It will include the other files separately
module.exports = function prepareEntryFile(opts, require) {
  // if there is no require and an entryPath is provided than just use that file directly
  if (!require && opts.entryPath) return opts.entryPath;

  var entry = [
    "`rm -rf /workspace/entry.rb`",
    require || ''
  ];
  if (opts.entryPath) {
    entry.push(`require "${opts.entryPath}"`);
  }
  else {
    if (opts.setup) {
      entry.push(`require "${codeWriteSync('ruby', opts.setup, opts.dir, 'setup.rb')}"`);
      // have the file remove itself from the file system after it is loaded, so that it cannot be read by users trying to solve
      entry.push("`rm -rf /workspace/setup.rb`");
    }
    entry.push(`require "${codeWriteSync('ruby', opts.solution, opts.dir, 'solution.rb')}"`);
    if (opts.fixture) {
      entry.push(`require "${codeWriteSync('ruby', opts.fixture, opts.dir, '.spec.rb')}"`);
    }
  }
  return codeWriteSync('ruby', entry.join('\n'), opts.dir, '.entry.rb');
};

#!/usr/bin/env node
// diff-coverage.mjs — changed-line coverage of assets/js/core/ via diff-cover over the lcov
// written by `npm run test:coverage`. Compares against origin/main.
// Exit: diff-cover's code; 2 if the lcov is missing (run test:coverage first).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const LCOV = 'coverage/lcov.info';
const FAIL_UNDER = '80';

if (!existsSync(LCOV)) {
  console.error(`diff-coverage: ${LCOV} not found — run "npm run test:coverage" first`);
  process.exit(2);
}
if (!readFileSync(LCOV, 'utf8').includes('SF:')) {
  console.log('diff-coverage: no core modules yet — nothing to measure');
  process.exit(0);
}
try {
  execFileSync('git', ['rev-parse', '--verify', '--quiet', 'origin/main'], { stdio: 'ignore' });
} catch {
  // Before the first push there is no branch to diff against; the whole-module
  // thresholds in test:coverage still apply to every line.
  console.log('diff-coverage: origin/main does not exist yet — whole-module thresholds apply');
  process.exit(0);
}
try {
  execFileSync('pipx', ['run', 'diff-cover', LCOV, '--compare-branch=origin/main',
    `--fail-under=${FAIL_UNDER}`, '--include', 'assets/js/core/*'], { stdio: 'inherit' });
} catch (e) {
  process.exit(typeof e.status === 'number' ? e.status : 2);
}

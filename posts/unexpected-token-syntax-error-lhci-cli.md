---
title: Lighthouse CLI error in CI - Unexpected token .
description: What to do when you get the error Unexpected token . when running Lighthouse in CI
---

We(on [MDN Web Docs](https://developer.mozilla.org)) recently started seeing the following error for our [Lighthouse](https://developers.google.com/web/tools/lighthouse/) tests running via [GitHub Actions](https://github.com/features/actions):

```bash
+ @lhci/cli@0.9.0
added 312 packages from 203 contributors in 12.847s
✅  .lighthouseci/ directory writable
⚠️   Configuration file not found
✅  Chrome installation found
Healthcheck passed!

Running Lighthouse 3 time(s) on http://localhost:5042/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach/
Error: Lighthouse failed with exit code 1
Run #1...failed!
    at ChildProcess.<anonymous> (/opt/hostedtoolcache/node/12.22.10/x64/lib/node_modules/@lhci/cli/src/collect/node-runner.js:120:21)
    at ChildProcess.emit (events.js:314:20)
    at Process.ChildProcess._handle.onexit (internal/child_process.js:276:12)
file:///opt/hostedtoolcache/node/12.22.10/x64/lib/node_modules/@lhci/cli/node_modules/lighthouse/lighthouse-cli/run.js:261

    if (runnerResult?.lhr.runtimeError) {
                     ^

SyntaxError: Unexpected token '.'
```

In out `performance.yml` workflow file we had the following:

```yml
- name: Setup Node.js environment
    uses: actions/setup-node@v2.5.1
    with:
        node-version: "12"
```

We are always installing the latest version of Lighthouse and, with the [release of version 0.9.0](https://github.com/GoogleChrome/lighthouse-ci/releases/tag/v0.9.0), one of the breaking changes was that the project dropped support for [Nodejs](https://nodejs.org) versions lower than 14. Aha! And in that lies the problem.

The fix was trivial. All that we needed to do was bump the version of Nodejs to 14.

```yml
- name: Setup Node.js environment
    uses: actions/setup-node@v2.5.1
    with:
        node-version: "14"
```

And with that, everything works again. A better fix in this case would probably be to actually stick to a specific release instead of always installing the latest version. However, should you run into this error, now you know how to fix it!

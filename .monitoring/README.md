# Adobe CC Express Monitoring Automation

## How it works

1. Switch to the `ops` branch: monitoring automation is restricted to this branch.
2. Define which New Relic monitors are created or updated in the `operations` job in `.circleci/config.yaml`. See the [`helix-post-deploy` orb documentation](https://circleci.com/developer/orbs/orb/adobe/helix-post-deploy) for available parameters.
3. Add or change the scripts to execute in New Relic in `.monitoring/*.js`. See the documenttation for [scripted browsers](https://docs.newrelic.com/docs/synthetics/new-relic-synthetics/scripting-monitors/writing-scripted-browsers) or [API tests](https://docs.newrelic.com/docs/synthetics/new-relic-synthetics/scripting-monitors/write-synthetics-api-tests).

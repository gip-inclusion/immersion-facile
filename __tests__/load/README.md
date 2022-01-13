# Load Testing Framework

This directory contains a simple load testing framework for the immersion-facile project. It currently contains a stress test and a spike test of the `/search-immersion` endpoint of the back-end API but can easily be extended to test other endpoints or servers.

## Setup

We use the [k6](http://k6.io) performance testing tool and write our testing script using typescript.

### Bundling & Cross-compilation

Since k6 expects javascript, and we want to be able to use modules so that we can reuse some of our existing code, we need to use a bundler that also transpiles our scripts to JavaScript ES2015/ES6. We used the webpack/babel approach described on the [k6 website](https://k6.io/docs/using-k6/modules/#setting-up-the-bundler).

## Project Structure

### Scaffolding

All of the scaffolding files can be found in the root directory `__tests__/load/`.

- The [.babelrc](./.babelrc), [tsconfig.json](./tsconfig.json), and [webpack.config.js](./webpack.config.js) files are mostly copy-pasted from the [k6 instructions](https://k6.io/docs/using-k6/modules/#setting-up-the-bundler) and [template project](https://github.com/grafana/k6-template-typescript).

- The [.prettierrc.js](./.prettierrc.js) file is copy-pasted from [back/.prettierrc.js](../../back/.prettierrc.js)

- The [package.json](./package.json) file is based on [front/package.json](../../front/package.json) but with significant modifications to support the building and execution of load tests. The main similarity is the symlinking of `back/src/shared/` to `__tests__/load/src/shared` which allows us to use the Dto types in test scripts.

### Load Test Scripts

A test script descibes the actions of a single 'virtual user' (VU). In most cases, this will be a single request, but could also consist of more complex use cases in the future.

The test script can be executed in conjuction with a Scenario which specifies the traffic shaping (how many VUs, for how long, etc.).

- [src/search-immersion.load.test.ts](./src/search-immersion.load.test.ts) ... makes 1 randomized searches on the `/search-immersion` backend endpoint and sleeps for 1s. This means that 1 VU generates about 1 QPS of traffic.

### Scenarios

A scenario describes how to shape the traffic. We currently have the following shared scenarios:

- default (no scenario specified): 1 VU performing a single action.
- `debug`: 10 VUs performing repeated actions for 10 seconds.
- `stresstest`: A ramp-up starting with 10 VU and gradually increasing the number of VUs. Stops when the rate of server errors exceeds 5%.
- `spiketest`: Generates background traffic of 10 VUs interspresed with short spikes of ever increasing load.

## Test Execution

1. Ensure that you have installed k6 on your machine. You can find installation instructions on the [k6 website](https://k6.io/docs/getting-started/installation/).

2. Ensure that the system under test is running.

   **WARNING**: make sure that you understand the consequences of running this test! For example:

   - **DON'T inadvertedly launch a denial-of-service attach against our external APIs**! If you have include external APIs in the load test, then make sure to get explicit consent from the API owners. You can also disable or stub out such calls, for example by specifying the `ENABLE_LBB_FETCH_ON_SEARCH=false` environment variable in the system under test, but this will of course affect the measurements and system behaviour.
   - **DON'T load test our production environment!** At least not unless the rest of the team agrees that you should. You may be negatively affecting our users. Furthermore, your test may generate large amounts of test data in the database. Make sure that you will be able to restore the production database to its original state.

3. Execute the load test.

   ```
   immersion-facile$ cd __test__/load/
   load$ TEST_HOST=localhost:80 TEST_SCENARIO=stresstest npm run loadtest:search-immersion
   ```

### Environment Variables

- `TEST_HOST`: (required) The host:port of the system under test, e.g. `localhost:80`.
- `TEST_SCENARIO`: (optional) The test scenario to apply.
- `TEST_SEED`: (optional) The seed with which to initialize the random number generator. If not specified, the current unix timestamp is used. The used seed is printed as part of the output.

  In general it makes sense to use a different seed for every run. However, should you wish to rerun the exact same sequence of randomized requests, you can specifiy the seed used during a previous test run. This can be especially useful for debugging purposes.

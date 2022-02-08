You need node 12+ to use the app :

**Install**

```
npm install
```

**Env variables**
Copy (or simlink) the .env from the root to here.

```
cp ../.env.sample ./env
```

**To test the app :**

```
npm run test:all
```

You can run in watch mode individually :
Unit tests :

```
npm run test:unit
```

Integration tests :
  1. Ensure that you have a docker daemon/agent running on your machine.

  1. Clear out any old data to ensure you initialize the database with the latest schema and test data.
     ```sh
     immersion-facile$ rm -rf docker-data/
     ```

  1. At the very least you will need to run the `postgres` container as well as the `back` container which initializes the database at startup:
     ```sh
     immersion-facile$ docker-compose -f docker-compose.resources.yml up --build
     ```
     Observe the log output to ensure the database has been properly initialized.
  1. Run DB migration : 
    ```sh
    npm run migrate up
    ```
  1. Execute the integration tests in a separate shell"
     ```
     immersion-facile$ cd back
     back$ npm run test:integration
     ```

End to end tests :

```
npm run test:e2e
```

# Running local back-end instances

The simplest way to get a back-end up and running is using the command:

```sh
immersion-facile$ cd back/
back$ npm start
```
If you're using PG repositories and you're running locally, you need to set PG_URL host to `localhost` (see commented lines in .env.sample file) 


The back-end will be accessible on `http://localhost:1234`. The default behaviour when no environment variables are specified (see below) is as follows:

- fake in-memory versions of all secondary adapters are used
- event crawling is disabled
- all log messages of level `info` or higher are printed to the console


### Generating JWT keys

A pair of assymmetric keys is used for signing JWTs. These are kept in JWT_PRIVATE_KEY and JWT_PUBLIC_KEY env variables (see below). You can use the following command to generate them:

```
openssl ecparam -name prime256v1 -genkey -noout -out private.ec.key && openssl ec -in private.ec.key -pubout -out public.pem
```

Note that this requires OpenSSL (`brew install openssl`);  you can generate an EC key pair through any other cryptographic tool.

You can then copy-paste the variable contents into `.env`, or export it:

```
export JWT_PRIVATE_KEY=$(cat ./private.ec.key) JWT_PUBLIC_KEY=$(cat ./public.pem)
```

### Rotation of JWT keys

If the JWT keys need to be changed, it should be done by :
- setting the old keys in the variables `JWT_PREVIOUS_PUBLIC_KEY` and `JWT_PREVIOUS_PRIVATE_KEY`,
- creating a new pair of keys (like explained just before), and putting them in the variables : `JWT_PUBLIC_KEY` and `JWT_PRIVATE_KEY` 


### Specifying environment variables

The back-end behaviour is controlled by environment variables. They can be specified in mulitple ways:

- in your `back/.env` file (most recommended)

  ```sh
  back$ cat .env
  REPOSITORIES=PG
  JWT_PRIVATE_KEY=...
  JWT_PUBLIC_KEY=...

  back$ npm run
  ```

- prefixed to the `npm start` command

  ```sh
  back$ REPOSITORIES=PG npm start
  ```

- persistently in your shell (least recommended)
  ```sh
  back$ export REPOSITORIES=PG
  back$ npm start
  ```

### Controlling the log output

To change the **granularity of the log output**, use the `LOG_LEVEL` environment variable. Valid values in descending order of granularity are: `fatal`, `error`, `warn`, `info` (default), `debug`, `trace`.

See [logger.ts](./src/utils/logger.ts) for the full logger configuration.

Example:

```sh
back$ LOG_LEVEL=debug npm start
```

By default, every log statement is printed on a single line. Setting `LOGGER_MULTI_LINE=yes` will **pretty-print JSON** using indentation and line breaks.

Example:

```sh
back$ LOGGER_MULTI_LINE=yes npm start
[2021-10-19 06:07:54.610] INFO (startServer.ts):
    featureFlags: {
      "enableAdminUi": false,
    }
...
```

**SIDE NOTE:** This also works during test execution, e.g.

```sh
back$ LOG_LEVEL=debug npm run test:unit
back$ LOGGER_MULTI_LINE=yes npm run test:all
```

### Adding new metrics (aka prometheus counters)

We use the [prom-client](https://github.com/siimon/prom-client) library for metric exports. See [their documentation](https://github.com/siimon/prom-client#readme) for thev different metric types (counters, histograms, etc.)

Adding new counters is very simple, just follow the example in [merge request 327](!327).

# Working with `AppConfig`

The [appConfig.ts](./src/adapters/primary/appConfig.ts) file encapsulates all configuration parameters used by the immersion facile back-end, such as feature flags, api keys, signing/encryption keys, etc. Basically anything that we want to be able to modify without code changes or that should remain secret.

In normal operation (i.e. normal server startup outside of automated tests), the config is read from environment variables, which can be defined in `.env` files or in as CI/CD variables in the GitLab settings.

This mechanism allows us to provide different server settings in different environments:

- production systems (prod, staging, dev)
- local server runs
- e2e and integration tests

## Adding new configuration parameters

Simply add a new getter method to this class, using `this.env` to access the environment variables. There are a number of helper function available to input formats (e.g. `parseStringList`) or to validate the input values (e.g. `throwIfNotInArray`).

It is strongly **recommended** to create a getter method rather than declaring a `public readonly` field that's initialized at construction time, especially when using a `throwIf...()` method to read the parameter. Using lazy fetching ensures that a missing variable in a test or local environment doesn't causes a failure unless that variable is actually read.

Example usages:

```ts
private get myNewOptionalParameter() {
  return this.env.MY_NEW_OPTIONAL_PARAMETER || "default_value";
}

private get myNewRequiredParameter() {
  return this.throwIfNotDefined("MY_NEW_REQUIRED_PARAMETER");
}

private get myNewMultipleChoiceParameter() {
  return throwIfNotInArray({
    processEnv: this.env,
    variableName: "MY_NEW_MULTIPLE_CHOICE_PARAMETER",
    authorizedValues: ["CHOICE_A", "CHOICE_B", "CHOICE_C"],
    defaultValue: "CHOICE_A",
  });
}
```

## Instantiation

An [AppConfig](./src/adapters/primary/appConfig.ts) instance must be provided to `createApp()` (in [server.ts](./src/adapters/primary/server.ts)) in order to create a new instance of the back-end server. This is typically done as follows:

1. **Server startup**: [startServer.ts](./src/adapters/primary/startServer.ts) creates an instance that populated from the environment variables after taking into account the `back/.env` file.

   Example usage:

   ```ts
   const appConfig = AppConfig.createFromEnv();
   const { app } = await createApp(appConfig)
   app.listen(port);
   ```

2. **e2e tests**: The test files use [AppConfigBuilder.ts](./src/_testBuilders/AppConfigBuilder.ts) to create one or more server instances with custom configurations as needed for the test.

   Example usage:

   ```ts
   beforeEach(async () => {
      const config = new AppConfigBuilder().enableAdminUi().build();
      const { app } = await createApp(config);
      request = supertest(app);
   });
   ```

   NOTE: [AppConfigBuilder.ts](./src/_testBuilders/AppConfigBuilder.ts) initializes the config with test-specific defaults, such backoffice credentials and JWT keys.

3. **integration tests** (special case): These sometimes rely on environment variables to create secondary adapters (e.g. a `PgImmersionApplicationRepository`).

   Example usage:

   ```ts
   beforeEach(() => {
     const appConfig = AppConfig.createFromEnv();
     repositoryUnderTest = new PgImmersionOfferRepository(
       new Client({ config.pgImmersionDbUrl })
     );
   });
   ```

## Overriding parameters in tests

Use the appropriate `with...()` or `enable...()` method in [AppConfigBuilder.ts](./src/_testBuilders/AppConfigBuilder.ts), or create a new one if the one you need doesn't exist yet. Note that the variable name used in [AppConfigBuilder.ts](./src/_testBuilders/AppConfigBuilder.ts) must match the one used in [appConfig.ts](./src/adapters/primary/appConfig.ts). (We couldn't think of a simple way to avoid this. :-( Suggestions are welcome.)

Example usage:

```ts
// in AppConfigBuilder.ts:
public withMyNewOptionalParameter(value: string): AppConfigBuilder {
   return new AppConfigBuilder({
     ...this.config,
     MY_NEW_OPTIONAL_PARAMETER: value,
   });
}

// In the e2e test:
beforeEach(async () => {
 const config = new AppConfigBuilder()
   .withMyNewOptionalParameter("test-value")
   .build();
  const { app } = await createApp(config);
  request = supertest(app);
});
```


# Asynchronous Event Processing

This section describes the workings of our event processing setup and explains how to perform various operations relating to it.

TODO(jburkhard/jfmacresy): Describe the architecture and how to schedule events.

## Quarantined Events

Quarantined events are recorded in the outbox just like regular events, but the EventBus will make no attempt to publish them.

There is currently only one way to quarantine events:
* If the event's domain topic is included in the `QUARANTINED_TOPICS` environment variable, all newly created events will automatically be marked as quarantined.

  This is meant for dealing with production issues: if we find that certain events causes bugs crashes, we can quickly disable their processing until we have fixed the bug.

 Quarantining could be used in other scenarios in the future, e.g. individual events could be quarantined after 3 unsuccessful processing attempts.

# Data Processing Pipelines

This section describes how to work with our pipelines, both locally and remotely. We will use the *establishmenBackfill* pipeline (currently our only pipeline) as an example throughout this section:

## Code structure
The source code is located in `back/src` so that it can take advantage of the adapters and other helpers implemented there.

For the *establishmenBackfill* pipeline:
  * [back/src/adapters/primary/startEstablishmentBackfill.ts](./src/adapters/primary/startEstablishmentBackfill.ts)
    * The main entry point.
    * Reads the parameters from the environment variables.
    * Creates the necessary secondary adapters.
    * Creates and starts the use case.
  * [back/src/domain/immersionOffer/useCases/UpdateEstablishmentsAndImmersionOffersFromLastSearches.ts](./src/domain/immersionOffer/useCases/UpdateEstablishmentsAndImmersionOffersFromLastSearches.ts)
    * The core business logic of the pipeline.

## Production setup

We use a docker container that is running [cron](https://en.wikipedia.org/wiki/Cron) to schedule the execution of the pipelines. The main configuration files are
  * [docker-compose.yml](../docker-compose.yml)
    * defines the `pipelines` docker container
  * [back/Dockerfile.pipelines](./Dockerfile.pipelines)
    * creates the docker image
  * [back/bin/start_pipelines_cron.sh](./bin/start_pipelines_cron.sh):
    * initializes the docker container
    * defines the execution schedule (crontab)
    * runs cron

Each pipeline has its own log file, to which log output will be appended by every new run (e.g. `docker-data/pipelines/logs/establishment-backfill.log`). The log directory is mapped to a filesystem volume in order to persist across restarts of the docker container.

## Running a pipeline locally

Each pipeline has its own `npm start` script with which it can be started:
```
back$ npm run start-establishment-backfill
```

As with the back-end, we use environment variables for parametrization.

## Running the pipelines docker container

Alternatively, you can execute it inside a local docker container:
```
immersion-facile$ docker-compose up --build pipelines
```
If you're using PG repositories and you're running with docker, you need to set PG_URL host to `postgres` (see commented lines in .env.sample file) 


Doing this will start `cron`, which will execute all registered pipelines according to their default schedules (e.g. *establishmentBackfill* is run every day at midnight).

You can **override the default schedule** by explicitly setting the `ESTABLISHMENT_BACKFILL_SCHEDULE` environment variable (see [Specifying environment variables](#Specifying-environment-variables)).

Example: To start a container that schedules a run of *establishmentBackfill* every 10 minutes:
```
immersion-facile$ ESTABLISHMENT_BACKFILL_SCHEDULE="*/10 * * * *" docker-compose up --build pipelines
```

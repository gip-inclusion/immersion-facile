You need node 12+ to use the app :

**Install**

```
npm install
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

```
npm run test:integration
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

The back-end will be accessible on `http://localhost:1234`. The default behaviour when no environment variables are specified (see below) is as follows:
  - fake in-memory versions of all secondary adapters are used
  - event crawling is disabled
  - all log messages of level `info` or higher are printed to the console

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
  ````
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
      "enableViewableApplications": false,
      "enableGenericApplicationForm": false,
      "enableBoulogneSurMerApplicationForm": false,
      "enableNarbonneApplicationForm": false,
      "enableAdminUi": false,
      "enableMagicLinks": false,
    }
...
```

**SIDE NOTE:** This also works during test execution, e.g.
 ```sh
 back$ LOG_LEVEL=debug npm run test:unit
 back$ LOGGER_MULTI_LINE=yes npm run test:all
 ```


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
     createApp(appConfig).listen(port);
     ```

  2. **e2e tests**: The test files use [AppConfigBuilder.ts](./src/_testBuilders/AppConfigBuilder.ts) to create one or more server instances with custom configurations as needed for the test.

     Example usage:
     ```ts
     beforeEach(async () => {
       const config = new AppConfigBuilder()
         .enableenableGenericApplicationForm()
         .build();
       request = superTest(await createApp(config));
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
 request = superTest(await createApp(config));
});
```

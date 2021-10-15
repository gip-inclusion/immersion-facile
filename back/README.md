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

## Start the app :

# To start with IN_MEMORY database, and an actual clock :

```
npm start
```

# With the JSON database

```
npm run start:json
```

If you want to fake that it is the morning (time during when the app is suppose to work), you can add `NODE_ENV=test`, to use the ClockImplementations. For exemple :

```
NODE_ENV=test npm run start:json
```

# Working with `AppConfig`

The `AppConfig` class encapsulates all configuration parameters used by the immersion facile back-end, such as feature flags, api keys, signing/encryption keys, etc. Basically anything that we want to be able to modify without code changes or that should remain secret.

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

An `AppConfig` instance must be provided to `createApp()` (in `server.ts`) in order to create a new instance of the back-end server. This is typically done as follows:
  1. **Server startup**: `startServer.ts` creates an instance that populated from the environment variables after taking into account the `back/.env` file.

     Example usage:
     ```ts
     const appConfig = AppConfig.createFromEnv();
     createApp(appConfig).listen(port);
     ```

  2. **e2e tests**: The test files use `AppConfigBuilder.ts` to create one or more server instances with custom configurations as needed for the test.

     Example usage:
     ```ts
     beforeEach(() => {
       const config = new AppConfigBuilder()
         .enableenableGenericApplicationForm()
         .build();
       request = superTest(createApp(config));
     });
     ```

     NOTE: `AppConfigBuilder.ts` initializes the config with test-specific defaults, such backoffice credentials and JWT keys.

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

Use the appropriate `with...()` or `enable...()` method in `AppConfigBuilder`, or create a new one if the one you need doesn't exist yet. Note that the variable name used in `AppConfigBuilder.ts` must match the one used in `AppConfig.ts`. (We couldn't think of a simple way to avoid this. :-( Suggestions are welcome.)

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
beforeEach(() => {
 const config = new AppConfigBuilder()
   .withMyNewOptionalParameter("test-value")
   .build();
 request = superTest(createApp(config));
});
```

## Frontend documentation

#### Install

**In root folder**, install all dependencies (also installs the backend dependencies):

```shell
pnpm install
```

#### Run local dev, with faked backend

```shell
pnpm dev
```

#### Run local dev, calling backend

```shell
pnpm dev-http
```

You can typecheck the project with :

```shell
pnpm typecheck
```

If you want to make sure everything is fine before pushing for exemple, you can run :

```shell
pnpm fullcheck
```

The frontend and the backend have some shared code which is located in the `shared` folder.
It is a workspace, used in front and in back

### E2E Tests with Cypress

#### Run locally

##### Linux prerequisites

```shell
sudo apt-get update && sudo apt-get install libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb
```

### Open the app

At the root of the project run :

```shell
pnpm cypress
```

## Ajouter une nouvelle slice dans le store

Nous nous basons sur [redux-toolkit](https://redux-toolkit.js.org/)

### Créer notre test

```
describe("feature flag slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("action should", () => {
    expectFeatureFlagsStateToEqual({
      ...defaultFeatureFlags,
      areFeatureFlagsLoading: true, // feature flags are loading by default
    });
    store.dispatch(featureFlagsSlice.actions.retrieveFeatureFlagsRequested());
    expectFeatureFlagsStateToEqual({
      ...defaultFeatureFlags,
      areFeatureFlagsLoading: true,
    });
    dependencies.technicalGateway.featureFlags$.next(flagsFromApi);
    expectFeatureFlagsStateToEqual({
      ...flagsFromApi,
      areFeatureFlagsLoading: false,
    });
  });
});
```

- Etude du store pour savoir ou rajouter la slice
- 0. Créer une slice vide

```typescript
import { createSlice } from "@reduxjs/toolkit";

type AgencyState = {
  agencies: AgencyDto[];
  isLoading: boolean;
};

const initialState: AgencyState = {
  agencies: [],
  isLoading: false,
};

export const agenciesSlice = createSlice({
  name: "agencies",
  initialState,
  reducers: {},
});
```

- 0.1 : Déclarer la slice dans le rootReducer dans [front/src/core-logic/storeConfig/store.ts](front/src/core-logic/storeConfig/store.ts)

- 1. Créer test initial de la slice

```
const defaultAgencies: AgencyIdAndName[] = [];

describe("Agencies in store", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("agencies list should be empty at start", () => {
    // add check not loading
    const expected: AgencyDto[] = [];
    expectToEqual(agenciesSelector(store.getState()), expected);
  });
});

```

- 1. Créer test de l'action

```
  it("can start to fetch agencies", () => {
    store.dispatch(agenciesSlice.actions.monActions)
  })
```

Le nom des actions disponibles dans la slice correspond aux clefs présentes dans les reducers.

- 2. Il faut donc rajouter l'action dans le reducer.

On ajoute l'action en rajoutant [actionName]: (state) => ({ newState })

```shell
sudo apt-get update && sudo apt-get install libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb
```

### Open the app

At the root of the project run :

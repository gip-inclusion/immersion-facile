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

## Ajouter un nouveau comportement métier
(useCase back = epic front ) Nous nous basons sur [redux-toolkit](https://redux-toolkit.js.org/)

Dans le domaine, nous allons rajouter un epic utilisateur. 'Récupérer mes objets métiers'.

1. Créer un dossier dans [domain](front/src/core-logic/domain) 

2. Un épique peut être résumé à une succession de changements d'état mais l'execution

```typescript


const getObjectMetierUseCase = (
  action$,
  _state$,
  { conventionGateway },
) =>
  action$.pipe(
    filter(conventionSlice.actions.conventionRequested.match),
  );
```



## Ajouter une nouvelle slice ObjetMetier dans le store
### Créer notre test
Etat minimal avec les dépendances techniques pour redux toolkit.

```typescript
describe("my store slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });
});
```

- Etude du store pour savoir ou rajouter la slice

## Prérequis pour avoir un état testable.

- 1. Créer une slice vide

Les trois notions qui nous intéressent sont :

- la description de la nature l'état (type)
- l'état initial
- une tranche minimale.AgencyState

```typescript
import { createSlice } from "@reduxjs/toolkit";

type ObjetMetier = {
  propriete: any;
};

// Au besoin on peut avoir un état complexe avec plusieurs notions.
type ObjetMetierState = {
  objects: ObjetMetier[];
  isLoading: boolean;
  errors: Error[];
};

const initialState: ObjetMetierState = {
  objects: [],
  isLoading: false,
};

export const objetMetierSlice = createSlice({
  name: "objectMetierName",
  initialState,
  reducers: {},
});
```

- 2. : Déclarer la slice dans le rootReducer dans [front/src/core-logic/storeConfig/store.ts](front/src/core-logic/storeConfig/store.ts)

```typescript
const rootReducer = combineReducers({
  [objetMetierSlice.name]: objetMetierSlice.reducer,
});
```

- 3. Créer test qui vérifie l'état initial de la slice

```typescript
describe("ObjetMetier in store", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("object state should be initial state at start", () => {
    // add check not loading
    const expected = {
      objects: [],
      isLoading: false,
    };
    expectToEqual(store.getState().objetMetierName, expected);
  });
});
```

## On itère sur les test pour rajouter du comportement avec des actions

- 1. Créer test de l'action

```typescript
it("action should do something", () => {
  store.dispatch(objetMetierSlice.actions.myActionStartFetch());
  expect(agenciesSelector(store.getState())).toEqual(expected);
});
```

Le nom des actions disponibles dans la slice correspond aux clefs présentes dans les reducers.

- 2. Déclarer l'action
     Pour déclarer une action, on ajoute l'action en suivant le pattern [actionName]: (currentState, previousActionIfDefined) => ({ newState });

```typescript
export const objetMetierSlice = createSlice({
  name: "objectMetierName",
  initialState,
  reducers: {
    myActionStartFetch: (state) => ({
      ...state,
      isLoading: true,
    }),
  },
});
```
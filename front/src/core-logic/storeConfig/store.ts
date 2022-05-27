import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { combineEpics, createEpicMiddleware, Epic } from "redux-observable";
import { catchError } from "rxjs";
import type { Dependencies } from "src/app/config/dependencies";
import { featureFlagsSlice } from "src/core-logic/domain/featureFlags/featureFlags.slice";
import { fetchFeatureFlagsEpic } from "src/core-logic/domain/featureFlags/featureFlags.epics";
import { romeAutocompleteEpic } from "src/core-logic/domain/romeAutocomplete/romeAutocomplete.epics";
import { romeAutocompleteSlice } from "src/core-logic/domain/romeAutocomplete/romeAutocomplete.slice";
import { searchEpics } from "src/core-logic/domain/search/search.epics";
import { searchSlice } from "src/core-logic/domain/search/search.slice";
import { siretEpics } from "src/core-logic/domain/siret/siret.epics";
import { siretSlice } from "src/core-logic/domain/siret/siret.slice";
import { homeEstablishmentSlice } from "src/infra/gateway/EstablishmentUiGateway/homeEstablishmentSlice";
import { immersionConventionEpics } from "../domain/immersionConvention/immersionConvention.epics";
import { immersionConventionSlice } from "../domain/immersionConvention/immersionConvention.slice";

const allEpics: any[] = [
  ...searchEpics,
  ...siretEpics,
  fetchFeatureFlagsEpic,
  romeAutocompleteEpic,
  ...immersionConventionEpics,
];

const rootEpic: Epic = (action$, store$, dependencies) =>
  combineEpics(...allEpics)(action$, store$, dependencies).pipe(
    catchError((error, source) => {
      //eslint-disable-next-line no-console
      console.error("combineEpic", error);
      return source;
    }),
  );

const rootReducer = combineReducers({
  [searchSlice.name]: searchSlice.reducer,
  [featureFlagsSlice.name]: featureFlagsSlice.reducer,
  [romeAutocompleteSlice.name]: romeAutocompleteSlice.reducer,
  [siretSlice.name]: siretSlice.reducer,
  [homeEstablishmentSlice.name]: homeEstablishmentSlice.reducer,
  [immersionConventionSlice.name]: immersionConventionSlice.reducer,
});

export type StoreProps = {
  dependencies: Dependencies;
  preloadedState?: Partial<RootState>;
};

export const createStore = ({ dependencies, preloadedState }: StoreProps) => {
  const epicMiddleware = createEpicMiddleware({ dependencies });
  const store = configureStore({
    preloadedState,
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => [
      ...getDefaultMiddleware({ thunk: false }),
      epicMiddleware,
    ],
  });
  epicMiddleware.run(rootEpic);
  return store;
};

export type RootState = ReturnType<typeof rootReducer>;
export const createRootSelector = <T>(selector: (state: RootState) => T) =>
  selector;

export type ReduxStore = ReturnType<typeof createStore>;
// export type RootState2 = ReturnType<Store["getState"]>;
export type AppDispatch = ReduxStore["dispatch"];

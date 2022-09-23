import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { combineEpics, createEpicMiddleware, Epic } from "redux-observable";
import { catchError } from "rxjs";
import type { Dependencies } from "src/app/config/dependencies";
import { adminAuthEpics } from "src/core-logic/domain/admin/adminAuth/adminAuth.epics";
import { adminAuthSlice } from "src/core-logic/domain/admin/adminAuth/adminAuth.slice";
import { dashboardUrlsEpics } from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.epics";
import { dashboardUrlsSlice } from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.slice";
import { sentEmailsEpics } from "src/core-logic/domain/admin/sentEmails/sentEmails.epics";
import { sentEmailsSlice } from "src/core-logic/domain/admin/sentEmails/sentEmails.slice";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { establishmentEpics } from "src/core-logic/domain/establishmentPath/establishment.epics";
import { featureFlagsSlice } from "src/core-logic/domain/featureFlags/featureFlags.slice";
import { featureFlagEpics } from "src/core-logic/domain/featureFlags/featureFlags.epics";
import { romeAutocompleteEpic } from "src/core-logic/domain/romeAutocomplete/romeAutocomplete.epics";
import { romeAutocompleteSlice } from "src/core-logic/domain/romeAutocomplete/romeAutocomplete.slice";
import { searchEpics } from "src/core-logic/domain/search/search.epics";
import { searchSlice } from "src/core-logic/domain/search/search.slice";
import { siretEpics } from "src/core-logic/domain/siret/siret.epics";
import { siretSlice } from "src/core-logic/domain/siret/siret.slice";
import { establishmentSlice } from "../domain/establishmentPath/establishment.slice";
import { immersionAssessmentEpics } from "../domain/immersionAssessment/immersionAssessment.epics";
import { immersionAssessmentSlice } from "../domain/immersionAssessment/immersionAssessment.slice";
import { conventionEpics } from "../domain/convention/convention.epics";
import { conventionSlice } from "../domain/convention/convention.slice";
import { authEpics } from "../domain/auth/auth.epics";
import { agenciesEpics } from "../domain/agencies/agencies.epics";
import { agenciesSlice } from "../domain/agencies/agencies.slice";

const allEpics: any[] = [
  ...dashboardUrlsEpics,
  ...sentEmailsEpics,
  ...adminAuthEpics,
  ...agenciesEpics,
  ...authEpics,
  ...establishmentEpics,
  ...searchEpics,
  ...siretEpics,
  ...featureFlagEpics,
  romeAutocompleteEpic,
  ...conventionEpics,
  ...immersionAssessmentEpics,
];

const rootReducer = combineReducers({
  [agenciesSlice.name]: agenciesSlice.reducer,
  [searchSlice.name]: searchSlice.reducer,
  [featureFlagsSlice.name]: featureFlagsSlice.reducer,
  [romeAutocompleteSlice.name]: romeAutocompleteSlice.reducer,
  [siretSlice.name]: siretSlice.reducer,
  [establishmentSlice.name]: establishmentSlice.reducer,
  [conventionSlice.name]: conventionSlice.reducer,
  [immersionAssessmentSlice.name]: immersionAssessmentSlice.reducer,
  [authSlice.name]: authSlice.reducer,
  admin: combineReducers({
    [adminAuthSlice.name]: adminAuthSlice.reducer,
    [dashboardUrlsSlice.name]: dashboardUrlsSlice.reducer,
    [sentEmailsSlice.name]: sentEmailsSlice.reducer,
  }),
});

const rootEpic: Epic = (action$, store$, dependencies) =>
  combineEpics(...allEpics)(action$, store$, dependencies).pipe(
    catchError((error, source) => {
      //eslint-disable-next-line no-console
      console.error("combineEpic", error);
      return source;
    }),
  );

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
export type AppDispatch = ReduxStore["dispatch"];

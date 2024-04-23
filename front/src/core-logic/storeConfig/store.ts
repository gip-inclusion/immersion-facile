import { combineReducers, configureStore } from "@reduxjs/toolkit";
import * as Sentry from "@sentry/browser";
import { Epic, combineEpics, createEpicMiddleware } from "redux-observable";
import { catchError } from "rxjs";
import type { Dependencies } from "src/config/dependencies";
import { agenciesAdminEpics } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.epics";
import { agencyAdminSlice } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";
import { dashboardUrlsEpics } from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.epics";
import { dashboardUrlsSlice } from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.slice";
import { icUsersAdminEpics } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.epics";
import { icUsersAdminSlice } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { notificationsEpics } from "src/core-logic/domain/admin/notifications/notifications.epics";
import { notificationsSlice } from "src/core-logic/domain/admin/notifications/notificationsSlice";
import { apiConsumerEpics } from "src/core-logic/domain/apiConsumer/apiConsumer.epics";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { assessmentEpics } from "src/core-logic/domain/assessment/assessment.epics";
import { assessmentSlice } from "src/core-logic/domain/assessment/assessment.slice";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { establishmentLeadEpics } from "src/core-logic/domain/establishmentLead/establishmentLead.epics";
import { establishmentLeadSlice } from "src/core-logic/domain/establishmentLead/establishmentLead.slice";
import { establishmentEpics } from "src/core-logic/domain/establishmentPath/establishment.epics";
import { featureFlagEpics } from "src/core-logic/domain/featureFlags/featureFlags.epics";
import { featureFlagsSlice } from "src/core-logic/domain/featureFlags/featureFlags.slice";
import { inclusionConnectedEpics } from "src/core-logic/domain/inclusionConnected/inclusionConnected.epics";
import { inclusionConnectedSlice } from "src/core-logic/domain/inclusionConnected/inclusionConnected.slice";
import { rootAppEpics } from "src/core-logic/domain/rootApp/rootApp.epics";
import { rootAppSlice } from "src/core-logic/domain/rootApp/rootApp.slice";
import { searchEpics } from "src/core-logic/domain/search/search.epics";
import { searchSlice } from "src/core-logic/domain/search/search.slice";
import { siretEpics } from "src/core-logic/domain/siret/siret.epics";
import { siretSlice } from "src/core-logic/domain/siret/siret.slice";
import { agenciesEpics } from "../domain/agencies/agencies.epics";
import { agenciesSlice } from "../domain/agencies/agencies.slice";
import { authEpics } from "../domain/auth/auth.epics";
import { conventionEpics } from "../domain/convention/convention.epics";
import { conventionSlice } from "../domain/convention/convention.slice";
import { discussionEpics } from "../domain/discussion/discussion.epics";
import { discussionSlice } from "../domain/discussion/discussion.slice";
import { establishmentBatchEpics } from "../domain/establishmentBatch/establishmentBatch.epics";
import { establishmentBatchSlice } from "../domain/establishmentBatch/establishmentBatch.slice";
import { establishmentSlice } from "../domain/establishmentPath/establishment.slice";
import { geosearchEpics } from "../domain/geosearch/geosearch.epics";
import { geosearchSlice } from "../domain/geosearch/geosearch.slice";
import { partnersErroredConventionEpics } from "../domain/partnersErroredConvention/partnersErroredConvention.epics";
import { partnersErroredConventionSlice } from "../domain/partnersErroredConvention/partnersErroredConvention.slice";
import { AppEpic } from "./redux.helpers";

const allEpics: AppEpic<any>[] = [
  ...agenciesAdminEpics,
  ...agenciesEpics,
  ...apiConsumerEpics,
  ...assessmentEpics,
  ...authEpics,
  ...conventionEpics,
  ...dashboardUrlsEpics,
  ...discussionEpics,
  ...establishmentBatchEpics,
  ...establishmentEpics,
  ...establishmentLeadEpics,
  ...featureFlagEpics,
  ...geosearchEpics,
  ...icUsersAdminEpics,
  ...inclusionConnectedEpics,
  ...notificationsEpics,
  ...partnersErroredConventionEpics,
  ...rootAppEpics,
  ...searchEpics,
  ...siretEpics,
];

const appReducer = combineReducers({
  admin: combineReducers({
    [agencyAdminSlice.name]: agencyAdminSlice.reducer,
    [icUsersAdminSlice.name]: icUsersAdminSlice.reducer,
    [dashboardUrlsSlice.name]: dashboardUrlsSlice.reducer,
    [notificationsSlice.name]: notificationsSlice.reducer,
    [apiConsumerSlice.name]: apiConsumerSlice.reducer,
  }),
  [agencyAdminSlice.name]: agencyAdminSlice.reducer,
  [agenciesSlice.name]: agenciesSlice.reducer,
  [assessmentSlice.name]: assessmentSlice.reducer,
  [authSlice.name]: authSlice.reducer,
  [conventionSlice.name]: conventionSlice.reducer,
  [discussionSlice.name]: discussionSlice.reducer,
  [establishmentBatchSlice.name]: establishmentBatchSlice.reducer,
  [establishmentLeadSlice.name]: establishmentLeadSlice.reducer,
  [establishmentSlice.name]: establishmentSlice.reducer,
  [featureFlagsSlice.name]: featureFlagsSlice.reducer,
  [geosearchSlice.name]: geosearchSlice.reducer,
  [inclusionConnectedSlice.name]: inclusionConnectedSlice.reducer,
  [partnersErroredConventionSlice.name]: partnersErroredConventionSlice.reducer,
  [searchSlice.name]: searchSlice.reducer,
  [siretSlice.name]: siretSlice.reducer,
});

const rootReducer: typeof appReducer = (state, action) =>
  appReducer(
    action.type === rootAppSlice.actions.appResetRequested.type
      ? undefined
      : state,
    action,
  );

const rootEpic: Epic = (action$, store$, dependencies) =>
  combineEpics(...allEpics)(action$, store$, dependencies).pipe(
    catchError((error, source) => {
      //eslint-disable-next-line no-console
      console.error("combineEpic", error);
      Sentry.captureException(error);
      return source;
    }),
  );

type StoreProps = {
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

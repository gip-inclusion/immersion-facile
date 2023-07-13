import { filter, map, switchMap } from "rxjs";
import { openApiDocSlice } from "src/core-logic/domain/openApiDoc/openApiDoc.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type OpenApiDocAction = ActionOfSlice<typeof openApiDocSlice>;

const getOpenApiDocEpic: AppEpic<OpenApiDocAction> = (
  action$,
  _state$,
  { openApiDocGateway },
) =>
  action$.pipe(
    filter(openApiDocSlice.actions.fetchOpenApiDocRequested.match),
    switchMap(() => openApiDocGateway.getOpenApiDoc$()),
    map(openApiDocSlice.actions.fetchOpenApiDocSucceeded),
    catchEpicError((error) =>
      openApiDocSlice.actions.fetchOpenApiDocFailed(error.message),
    ),
  );

export const openApiDocEpics = [getOpenApiDocEpic];

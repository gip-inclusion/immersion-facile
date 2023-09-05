import { filter, map, switchMap } from "rxjs";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type ApiConsumerAction = ActionOfSlice<typeof apiConsumerSlice>;
type ApiConsumerEpic = AppEpic<ApiConsumerAction>;

const retrieveApiConsumersEpic: ApiConsumerEpic = (
  action$,
  _state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(apiConsumerSlice.actions.retrieveApiConsumersRequested.match),
    switchMap(adminGateway.getAllApiConsumers$),
    map(apiConsumerSlice.actions.retrieveApiConsumersSucceeded),
    catchEpicError((error) =>
      apiConsumerSlice.actions.retrieveApiConsumersFailed(error.message),
    ),
  );

const createApiConsumerEpic: ApiConsumerEpic = (
  action$,
  _state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(apiConsumerSlice.actions.saveApiConsumerRequested.match),
    switchMap((action) => adminGateway.saveApiConsumer$(action.payload)),
    map(apiConsumerSlice.actions.saveApiConsumerSucceeded),
    catchEpicError((error) =>
      apiConsumerSlice.actions.saveApiConsumerFailed(error.message),
    ),
  );

export const apiConsumerEpics = [
  retrieveApiConsumersEpic,
  createApiConsumerEpic,
];

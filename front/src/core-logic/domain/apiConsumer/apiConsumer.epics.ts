import { filter, map, switchMap } from "rxjs";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type ApiCOnsumerAction = ActionOfSlice<typeof apiConsumerSlice>;
type ApiConsumerEpic = AppEpic<ApiCOnsumerAction>;

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

export const apiConsumerEpics = [retrieveApiConsumersEpic];

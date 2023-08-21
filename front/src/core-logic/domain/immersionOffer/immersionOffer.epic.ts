import { filter, map, switchMap } from "rxjs";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { immersionOfferSlice } from "./immersionOffer.slice";

type ImmersionOfferAction = ActionOfSlice<typeof immersionOfferSlice>;

const fetchImmersionOfferEpic: AppEpic<ImmersionOfferAction> = (
  action$,
  _state$,
  { immersionOfferGateway },
) =>
  action$.pipe(
    filter(immersionOfferSlice.actions.fetchImmersionOfferRequested.match),
    switchMap(({ payload }) =>
      immersionOfferGateway.getImmersionOffer$(payload),
    ),
    map(immersionOfferSlice.actions.fetchImmersionOfferSucceeded),
    catchEpicError((error) =>
      immersionOfferSlice.actions.fetchImmersionOfferFailed(error.message),
    ),
  );

export const immersionOfferEpics = [fetchImmersionOfferEpic];

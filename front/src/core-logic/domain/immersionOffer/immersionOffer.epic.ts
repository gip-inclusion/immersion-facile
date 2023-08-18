import { filter } from "rxjs";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { immersionOfferSlice } from "./immersionOffer.slice";

type ImmersionOfferAction = ActionOfSlice<typeof immersionOfferSlice>;

const fetchImmersionOfferEpic: AppEpic<ImmersionOfferAction> = (
  action$,
  _state$,
) =>
  action$.pipe(
    filter(immersionOfferSlice.actions.fetchImmersionOfferRequested.match),
  );

export const immersionOfferEpics = [fetchImmersionOfferEpic];

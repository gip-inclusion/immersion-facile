import { filter, map, of, switchMap } from "rxjs";
import { SearchImmersionResultDto } from "shared";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import {
  ImmersionOfferPayload,
  immersionOfferSlice,
} from "./immersionOffer.slice";

type ImmersionOfferAction = ActionOfSlice<typeof immersionOfferSlice>;

const isSearchImmersionResultDto = (
  payload: ImmersionOfferPayload | SearchImmersionResultDto,
): payload is SearchImmersionResultDto =>
  (payload as SearchImmersionResultDto).name !== undefined;

const fetchImmersionOfferEpic: AppEpic<ImmersionOfferAction> = (
  action$,
  _state$,
  { immersionOfferGateway },
) =>
  action$.pipe(
    filter(immersionOfferSlice.actions.fetchImmersionOfferRequested.match),
    switchMap(({ payload }) =>
      isSearchImmersionResultDto(payload)
        ? of(payload)
        : immersionOfferGateway.getImmersionOffer$(payload),
    ),
    map(immersionOfferSlice.actions.fetchImmersionOfferSucceeded),
    catchEpicError((error) =>
      immersionOfferSlice.actions.fetchImmersionOfferFailed(error.message),
    ),
  );

export const immersionOfferEpics = [fetchImmersionOfferEpic];

import { filter, map, switchMap } from "rxjs";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { agencyInfoSlice } from "./agencyInfo.slice";

type AgencyInfoAction = ActionOfSlice<typeof agencyInfoSlice>;

const agencyInfoGetByIdEpic: AppEpic<AgencyInfoAction> = (
  action$,
  _state$,
  { agencyGateway },
) =>
  action$.pipe(
    filter(agencyInfoSlice.actions.fetchAgencyInfoRequested.match),
    switchMap((action) =>
      agencyGateway.getAgencyPublicInfoById$({ id: action.payload }),
    ),
    map((agencyInfo) =>
      agencyInfoSlice.actions.fetchAgencyInfoSucceeded(agencyInfo),
    ),
    catchEpicError((error) =>
      agencyInfoSlice.actions.fetchAgencyInfoFailed(error.message),
    ),
  );

export const agencyInfoEpics = [agencyInfoGetByIdEpic];

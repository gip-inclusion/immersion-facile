import { PayloadAction } from "@reduxjs/toolkit";
import { filter, map, switchMap } from "rxjs";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { agenciesSlice } from "./agencies.slice";

type AgencyInfoAction = ActionOfSlice<typeof agenciesSlice>;

const agencyInfoGetByIdEpic: AppEpic<AgencyInfoAction> = (
  action$,
  _state$,
  { agencyGateway },
) =>
  action$.pipe(
    filter(agenciesSlice.actions.fetchAgencyInfoRequested.match),
    switchMap((action) =>
      agencyGateway.getAgencyPublicInfoById$({ agencyId: action.payload }),
    ),
    map((agencyInfo) =>
      agenciesSlice.actions.fetchAgencyInfoSucceeded(agencyInfo),
    ),
    catchEpicError((error) =>
      agenciesSlice.actions.fetchAgencyInfoFailed(error.message),
    ),
  );

const getAgenciesByDepartmentCodeEpic: AppEpic<AgencyInfoAction> = (
  action$,
  _state$,
  dependencies,
) =>
  action$.pipe(
    filter(agenciesSlice.actions.fetchAgenciesByDepartmentCodeRequested.match),
    switchMap((action: PayloadAction<string>) =>
      dependencies.agencyGateway.listAgenciesByFilter$({
        departmentCode: action.payload,
      }),
    ),
    map(agenciesSlice.actions.fetchAgenciesByDepartmentCodeSucceeded),
    catchEpicError((error) =>
      agenciesSlice.actions.fetchAgenciesByDepartmentCodeFailed(error.message),
    ),
  );

const addAgencyEpic: AppEpic<AgencyInfoAction> = (
  action$,
  _state$,
  dependencies,
) =>
  action$.pipe(
    filter(agenciesSlice.actions.addAgencyRequested.match),
    switchMap((action) =>
      dependencies.agencyGateway.addAgency$(action.payload),
    ),
    map(agenciesSlice.actions.addAgencySucceeded),
    catchEpicError((error) =>
      agenciesSlice.actions.addAgencyFailed(error.message),
    ),
  );

export const agenciesEpics = [
  agencyInfoGetByIdEpic,
  getAgenciesByDepartmentCodeEpic,
  addAgencyEpic,
];

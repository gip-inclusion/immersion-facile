import { PayloadAction } from "@reduxjs/toolkit";
import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { agenciesSlice } from "./agencies.slice";

type AgencyAction = ActionOfSlice<typeof agenciesSlice>;

const getAgenciesByDepartmentCodeEpic: AppEpic<AgencyAction> = (
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
  );

export const agenciesEpics = [getAgenciesByDepartmentCodeEpic];

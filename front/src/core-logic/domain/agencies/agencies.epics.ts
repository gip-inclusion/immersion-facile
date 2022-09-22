import { PayloadAction } from "@reduxjs/toolkit";
import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { agenciesSlice } from "./agencies.slice";

type AgencyAction = ActionOfSlice<typeof agenciesSlice>;

const getAgenciesUseCase: AppEpic<AgencyAction> = (
  action$,
  _state$,
  dependencies,
) =>
  action$.pipe(
    filter(agenciesSlice.actions.fetchAgenciesRequested.match),
    switchMap((action: PayloadAction<string>) =>
      dependencies.agencyGateway.listAgencies$(action.payload),
    ),
    map(agenciesSlice.actions.fetchAgenciesSucceeded),
  );

export const agenciesEpics = [getAgenciesUseCase];

import { PayloadAction } from "@reduxjs/toolkit";
import { filter, Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { Dependencies } from "src/app/config/dependencies";
import { ActionOfSlice } from "src/core-logic/storeConfig/redux.helpers";
import { agenciesSlice, AgencyState } from "./agencies.slice";

type AgencyAction = ActionOfSlice<typeof agenciesSlice>;

const getAgenciesUseCase = (
  action$: Observable<AgencyAction>,
  _state$: Observable<AgencyState>,
  dependencies: Dependencies,
) =>
  action$.pipe(
    filter(agenciesSlice.actions.fetchAgenciesRequested.match),
    switchMap((action: PayloadAction<string>) =>
      dependencies.agencyGateway.listAgencies$(action.payload),
    ),
    map(agenciesSlice.actions.fetchAgenciesSucceeded),
  );

export const agenciesEpics = [getAgenciesUseCase];

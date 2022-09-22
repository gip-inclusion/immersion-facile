import { PayloadAction } from "@reduxjs/toolkit";
import { filter, Observable } from "rxjs";
import { map, switchMap, tap } from "rxjs/operators";
import { DepartmentCode } from "shared/src/address/address.dto";
import { Dependencies } from "src/app/config/dependencies";
import { ActionOfSlice } from "src/core-logic/storeConfig/redux.helpers";
// import {
//   ActionOfSlice,
//   AppEpic,
// } from "src/core-logic/storeConfig/redux.helpers";
import { agenciesSlice, AgencyState } from "./agencies.slice";

type AgencyAction = ActionOfSlice<typeof agenciesSlice>;
//
// type AgencyEpic = AppEpic<AgencyAction>;

const getAgenciesUseCase = (
  action$: Observable<AgencyAction>,
  _state$: Observable<AgencyState>,
  dependencies: Dependencies,
) =>
  action$.pipe(
    filter(agenciesSlice.actions.fetchAgenciesRequested.match),
    switchMap((action: PayloadAction<DepartmentCode>) =>
      dependencies.agencyGateway.listAgencies$(action.payload),
    ),
    map(agenciesSlice.actions.fetchAgenciesSucceeded),
    tap((value: any) => {
      // eslint-disable-next-line no-console
      console.log(`Hello world ${JSON.stringify(value)}`);
    }),
  );

export const agenciesEpics = [getAgenciesUseCase];

import { PayloadAction } from "@reduxjs/toolkit";
import { debounceTime, distinctUntilChanged, filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { AgencyId } from "shared";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { agencyAdminSlice } from "./agencyAdmin.slice";

type AgencyAction = ActionOfSlice<typeof agencyAdminSlice>;

const agencyAdminGetByNameEpic: AppEpic<AgencyAction> = (
  action$,
  _state$,
  { agencyGateway, scheduler },
) =>
  action$.pipe(
    filter(agencyAdminSlice.actions.setAgencySearchText.match),
    debounceTime(400, scheduler),
    distinctUntilChanged(),
    switchMap((action: PayloadAction<string>) =>
      agencyGateway.listAgenciesByFilter$({ nameIncludes: action.payload }),
    ),
    map(agencyAdminSlice.actions.setAgencyOptions),
  );

const agencyAdminGetNeedingReviewEpic: AppEpic<AgencyAction> = (
  action$,
  state$,
  { agencyGateway },
) =>
  action$.pipe(
    filter(agencyAdminSlice.actions.fetchAgenciesNeedingReviewRequested.match),
    switchMap(() =>
      agencyGateway.listAgenciesNeedingReview$(
        state$.value.admin.adminAuth.adminToken || "",
      ),
    ),
    map(agencyAdminSlice.actions.setAgencyNeedingReviewOptions),
    catchEpicError((error: Error) =>
      agencyAdminSlice.actions.fetchAgenciesNeedingReviewFailed(error.message),
    ),
  );

const agencyAdminGetDetailsForStatusEpic: AppEpic<AgencyAction> = (
  action$,
  state$,
  dependencies,
) =>
  action$.pipe(
    filter(agencyAdminSlice.actions.setSelectedAgencyNeedingReviewId.match),
    switchMap((action: PayloadAction<AgencyId>) =>
      dependencies.agencyGateway.getAgencyAdminById$(
        action.payload,
        state$.value.admin.adminAuth.adminToken ?? "",
      ),
    ),
    map((agency) => agencyAdminSlice.actions.setAgencyNeedingReview(agency ?? null)),
  );

const agencyAdminGetDetailsForUpdateEpic: AppEpic<AgencyAction> = (
  action$,
  state$,
  dependencies,
) =>
  action$.pipe(
    filter(agencyAdminSlice.actions.setSelectedAgencyId.match),
    switchMap((action: PayloadAction<AgencyId>) =>
      dependencies.agencyGateway.getAgencyAdminById$(
        action.payload,
        state$.value.admin.adminAuth.adminToken ?? "",
      ),
    ),
    map((agency) => agencyAdminSlice.actions.setAgency(agency ?? null)),
  );

const updateAgencyEpic: AppEpic<AgencyAction> = (
  action$,
  state$,
  { agencyGateway },
) =>
  action$.pipe(
    filter(agencyAdminSlice.actions.updateAgencyRequested.match),
    switchMap(({ payload }) =>
      agencyGateway.updateAgency$(
        payload,
        state$.value.admin.adminAuth.adminToken || "",
      ),
    ),
    map(agencyAdminSlice.actions.updateAgencySucceeded),
    catchEpicError((error: Error) =>
      agencyAdminSlice.actions.updateAgencyFailed(error.message),
    ),
  );

export const agenciesAdminEpics = [
  agencyAdminGetByNameEpic,
  agencyAdminGetNeedingReviewEpic,
  agencyAdminGetDetailsForUpdateEpic,
  agencyAdminGetDetailsForStatusEpic,
  updateAgencyEpic,
];

import { PayloadAction } from "@reduxjs/toolkit";
import { debounceTime, distinctUntilChanged, filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import type { AgencyId } from "shared";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { agencyAdminSlice } from "./agencyAdmin.slice";

type AgencyAction = ActionOfSlice<typeof agencyAdminSlice>;

type AgencyEpic = AppEpic<AgencyAction | { type: "do-nothing" }>;

const agencyAdminGetByNameEpic: AgencyEpic = (
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

const agencyAdminGetNeedingReviewEpic: AgencyEpic = (
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

const agencyAdminGetDetailsForStatusEpic: AgencyEpic = (
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
    map((agency) =>
      agencyAdminSlice.actions.setAgencyNeedingReview(agency ?? null),
    ),
  );

const agencyAdminGetDetailsForUpdateEpic: AgencyEpic = (
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

const updateAgencyEpic: AgencyEpic = (action$, state$, { agencyGateway }) =>
  action$.pipe(
    filter(agencyAdminSlice.actions.updateAgencyRequested.match),
    switchMap(({ payload }) =>
      agencyGateway
        .updateAgency$(payload, state$.value.admin.adminAuth.adminToken || "")
        .pipe(
          map(() => agencyAdminSlice.actions.updateAgencySucceeded(payload)),
        ),
    ),
    catchEpicError((error: Error) =>
      agencyAdminSlice.actions.updateAgencyFailed(error.message),
    ),
  );

const updateAgencyNeedingReviewStatusEpic: AgencyEpic = (
  action$,
  state$,
  { agencyGateway },
) =>
  action$.pipe(
    filter(
      agencyAdminSlice.actions.updateAgencyNeedingReviewStatusRequested.match,
    ),
    switchMap(({ payload }) =>
      agencyGateway
        .validateOrRejectAgency$(
          state$.value.admin.adminAuth.adminToken || "",
          payload.id,
          payload.status,
        )
        .pipe(
          map(() =>
            agencyAdminSlice.actions.updateAgencyNeedingReviewStatusSucceeded(
              payload.id,
            ),
          ),
        ),
    ),
    catchEpicError((error: Error) =>
      agencyAdminSlice.actions.updateAgencyStatusFailed(error.message),
    ),
  );

const agencyDoesNotNeedReviewAnymoreEpic: AgencyEpic = (action$, state$) =>
  action$.pipe(
    filter(
      agencyAdminSlice.actions.updateAgencyNeedingReviewStatusSucceeded.match,
    ),
    map(({ payload }) => {
      const agencyAdminState = state$.value.admin.agencyAdmin;
      const agencyWasNeedingReviewIndex =
        agencyAdminState.agencyNeedingReviewOptions.findIndex(
          ({ id }) => id === payload,
        );
      if (agencyWasNeedingReviewIndex === -1) return { type: "do-nothing" };

      return agencyAdminSlice.actions.agencyNeedingReviewChangedAfterAnUpdate({
        agencyNeedingReviewOptions:
          agencyAdminState.agencyNeedingReviewOptions.filter(
            ({ id }) => id !== payload,
          ),
        agencyNeedingReview: null,
      });
    }),
  );

export const agenciesAdminEpics = [
  agencyAdminGetByNameEpic,
  agencyAdminGetNeedingReviewEpic,
  agencyAdminGetDetailsForUpdateEpic,
  agencyAdminGetDetailsForStatusEpic,
  updateAgencyEpic,
  updateAgencyNeedingReviewStatusEpic,
  agencyDoesNotNeedReviewAnymoreEpic,
];

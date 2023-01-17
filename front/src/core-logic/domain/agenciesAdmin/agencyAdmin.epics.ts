import { PayloadAction } from "@reduxjs/toolkit";
import { debounceTime, distinctUntilChanged, filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { AgencyId, replaceArrayElement } from "shared";
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

const agencyDoesNotNeedReviewAnymoreEpic: AgencyEpic = (action$, state$) =>
  action$.pipe(
    filter(agencyAdminSlice.actions.updateAgencySucceeded.match),
    map(({ payload }) => {
      const agencyAdminState = state$.value.admin.agencyAdmin;
      const agencyWasNeedingReviewIndex =
        agencyAdminState.agencyNeedingReviewOptions.findIndex(
          ({ id }) => id === payload.id,
        );
      if (agencyWasNeedingReviewIndex === -1) return { type: "do-nothing" };

      if (payload.status === "needsReview") {
        return agencyAdminSlice.actions.agencyNeedingReviewChangedAfterAnUpdate(
          {
            agencyNeedingReviewOptions: replaceArrayElement(
              agencyAdminState.agencyNeedingReviewOptions,
              agencyWasNeedingReviewIndex,
              {
                id: payload.id,
                name: payload.name,
              },
            ),
            agencyNeedingReview: payload,
          },
        );
      }

      return agencyAdminSlice.actions.agencyNeedingReviewChangedAfterAnUpdate({
        agencyNeedingReviewOptions:
          agencyAdminState.agencyNeedingReviewOptions.filter(
            ({ id }) => id !== payload.id,
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
  agencyDoesNotNeedReviewAnymoreEpic,
];

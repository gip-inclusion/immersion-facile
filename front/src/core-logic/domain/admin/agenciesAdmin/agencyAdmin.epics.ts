import { PayloadAction } from "@reduxjs/toolkit";
import { debounceTime, distinctUntilChanged, filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { type AgencyId, looksLikeSiret } from "shared";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { type IcUsersAdminAction } from "../icUsersAdmin/icUsersAdmin.epics";
import { icUsersAdminSlice } from "../icUsersAdmin/icUsersAdmin.slice";
import { agencyAdminSlice } from "./agencyAdmin.slice";

export type AgencyAction = ActionOfSlice<typeof agencyAdminSlice>;

type AgencyEpic = AppEpic<AgencyAction | { type: "do-nothing" }>;

const agencyAdminGetByNameEpic: AgencyEpic = (
  action$,
  _state$,
  { agencyGateway, scheduler },
) =>
  action$.pipe(
    filter(agencyAdminSlice.actions.setAgencySearchQuery.match),
    debounceTime(400, scheduler),
    distinctUntilChanged(),
    switchMap((action: PayloadAction<string>) =>
      agencyGateway.listAgencyOptionsByFilter$({
        [looksLikeSiret(action.payload) ? "siret" : "nameIncludes"]:
          action.payload,
      }),
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
      agencyGateway.listAgencyOptionsNeedingReview$(
        getAdminToken(state$.value),
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
        getAdminToken(state$.value),
      ),
    ),
    map((agency) =>
      agencyAdminSlice.actions.setAgencyNeedingReview(agency ?? null),
    ),
    catchEpicError((error: Error) =>
      agencyAdminSlice.actions.setSelectedAgencyNeedingReviewIdFailed(
        error.message,
      ),
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
        getAdminToken(state$.value),
      ),
    ),
    map((agency) => agencyAdminSlice.actions.setAgency(agency ?? null)),
  );

const updateAgencyEpic: AgencyEpic = (action$, state$, { agencyGateway }) =>
  action$.pipe(
    filter(agencyAdminSlice.actions.updateAgencyRequested.match),
    switchMap(({ payload }) =>
      agencyGateway
        .updateAgency$(payload, getAdminToken(state$.value))
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
        .validateOrRejectAgency$(getAdminToken(state$.value), payload)
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

const fetchAgencyOnIcUserUpdatedEpic: AppEpic<
  IcUsersAdminAction | AgencyAction
> = (action$) =>
  action$.pipe(
    filter(
      (action) =>
        icUsersAdminSlice.actions.updateUserOnAgencySucceeded.match(action) ||
        icUsersAdminSlice.actions.removeUserFromAgencySucceeded.match(action) ||
        icUsersAdminSlice.actions.createUserOnAgencySucceeded.match(action),
    ),
    map((action) =>
      agencyAdminSlice.actions.setSelectedAgencyId(action.payload.agencyId),
    ),
  );

export const agenciesAdminEpics = [
  agencyAdminGetByNameEpic,
  agencyAdminGetNeedingReviewEpic,
  agencyAdminGetDetailsForUpdateEpic,
  agencyAdminGetDetailsForStatusEpic,
  updateAgencyEpic,
  updateAgencyNeedingReviewStatusEpic,
  agencyDoesNotNeedReviewAnymoreEpic,
  fetchAgencyOnIcUserUpdatedEpic,
];

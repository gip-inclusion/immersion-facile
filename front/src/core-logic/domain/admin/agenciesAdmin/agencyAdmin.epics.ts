import type { PayloadAction } from "@reduxjs/toolkit";
import { debounceTime, distinctUntilChanged, filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { type AgencyId, allAgencyStatuses, looksLikeSiret } from "shared";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { closeAgencyAndTransferConventionsSlice } from "../../agencies/close-agency-and-transfert-conventions/closeAgencyAndTransferConventions.slice";
import type { ConnectedUsersAdminAction } from "../connectedUsersAdmin/connectedUsersAdmin.epics";
import { connectedUsersAdminSlice } from "../connectedUsersAdmin/connectedUsersAdmin.slice";
import { agencyAdminSlice } from "./agencyAdmin.slice";

export type AgencyAction = ActionOfSlice<typeof agencyAdminSlice>;
type CloseAgencyAndTransfertConventionsAction = ActionOfSlice<
  typeof closeAgencyAndTransferConventionsSlice
>;

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
        status: [...allAgencyStatuses],
        [looksLikeSiret(action.payload) ? "siret" : "nameIncludes"]:
          action.payload,
      }),
    ),
    map(agencyAdminSlice.actions.setAgencyOptions),
  );

const agencyAdminGetDetailsForStatusEpic: AgencyEpic = (
  action$,
  state$,
  dependencies,
) =>
  action$.pipe(
    filter(agencyAdminSlice.actions.setSelectedAgencyNeedingReviewId.match),
    switchMap((action: PayloadAction<AgencyId>) =>
      dependencies.agencyGateway.getAgencyById$(
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
      dependencies.agencyGateway.getAgencyById$(
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
  | ConnectedUsersAdminAction
  | AgencyAction
  | CloseAgencyAndTransfertConventionsAction
> = (action$) =>
  action$.pipe(
    filter(
      (action) =>
        connectedUsersAdminSlice.actions.updateUserOnAgencySucceeded.match(
          action,
        ) ||
        connectedUsersAdminSlice.actions.removeUserFromAgencySucceeded.match(
          action,
        ) ||
        connectedUsersAdminSlice.actions.createUserOnAgencySucceeded.match(
          action,
        ) ||
        closeAgencyAndTransferConventionsSlice.actions.closeAgencyAndTransferConventionsSucceeded.match(
          action,
        ),
    ),
    map((action) =>
      agencyAdminSlice.actions.setSelectedAgencyId(action.payload.agencyId),
    ),
  );

export const agenciesAdminEpics = [
  agencyAdminGetByNameEpic,
  agencyAdminGetDetailsForUpdateEpic,
  agencyAdminGetDetailsForStatusEpic,
  updateAgencyEpic,
  updateAgencyNeedingReviewStatusEpic,
  agencyDoesNotNeedReviewAnymoreEpic,
  fetchAgencyOnIcUserUpdatedEpic,
];

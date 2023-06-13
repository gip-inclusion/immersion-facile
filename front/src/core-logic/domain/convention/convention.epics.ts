import { concatMap, filter, map, switchMap } from "rxjs";
import { isEstablishmentTutorIsEstablishmentRepresentative } from "shared";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { conventionSlice } from "./convention.slice";

type ConventionAction = ActionOfSlice<typeof conventionSlice>;

type ConventionEpic = AppEpic<ConventionAction>;

const saveConventionEpic: ConventionEpic = (
  action$,
  state$,
  { conventionGateway },
) =>
  action$.pipe(
    filter(conventionSlice.actions.saveConventionRequested.match),
    switchMap(({ payload }) => {
      const conventionState = state$.value.convention;
      const { jwt } = conventionState;
      return jwt
        ? conventionGateway.updateConvention$(payload, jwt)
        : conventionGateway.newConvention$(payload);
    }),
    map(conventionSlice.actions.saveConventionSucceeded),
    catchEpicError((error: Error) =>
      conventionSlice.actions.saveConventionFailed(error.message),
    ),
  );

const getConventionEpic: ConventionEpic = (
  action$,
  _state$,
  { conventionGateway },
) =>
  action$.pipe(
    filter(conventionSlice.actions.fetchConventionRequested.match),
    switchMap(({ payload }) => conventionGateway.retrieveFromToken$(payload)),
    map(conventionSlice.actions.fetchConventionSucceeded),
    catchEpicError((error: Error) =>
      conventionSlice.actions.fetchConventionFailed(error.message),
    ),
  );

const reflectFetchedConventionOnFormUi: ConventionEpic = (action$, state$) =>
  action$.pipe(
    filter(conventionSlice.actions.fetchConventionSucceeded.match),
    concatMap((action) => [
      conventionSlice.actions.isTutorEstablishmentRepresentativeChanged(
        action.payload
          ? isEstablishmentTutorIsEstablishmentRepresentative(action.payload)
          : state$.value.convention.formUi.isTutorEstablishmentRepresentative,
      ),
      conventionSlice.actions.isMinorChanged(
        action.payload
          ? !!action.payload.signatories.beneficiaryRepresentative
          : state$.value.convention.formUi.isMinor,
      ),
      conventionSlice.actions.isCurrentEmployerChanged(
        action.payload
          ? !!action.payload.signatories.beneficiaryCurrentEmployer
          : state$.value.convention.formUi.hasCurrentEmployer,
      ),
    ]),
  );

const signConventionEpic: ConventionEpic = (
  action$,
  _,
  { conventionGateway },
) =>
  action$.pipe(
    filter(conventionSlice.actions.signConventionRequested.match),
    switchMap(({ payload: { jwt, role, signedAt } }) =>
      conventionGateway
        .signConvention$(jwt)
        .pipe(
          map(() =>
            conventionSlice.actions.signConventionSucceeded({ role, signedAt }),
          ),
        ),
    ),
    catchEpicError((error: Error) =>
      conventionSlice.actions.signConventionFailed(error.message),
    ),
  );

const conventionStatusChangeEpic: ConventionEpic = (
  action$,
  _,
  { conventionGateway },
) =>
  action$.pipe(
    filter(conventionSlice.actions.statusChangeRequested.match),
    switchMap(({ payload }) =>
      conventionGateway
        .updateConventionStatus$(
          payload.updateStatusParams,
          payload.conventionId,
          payload.jwt,
        )
        .pipe(
          map(() =>
            conventionSlice.actions.statusChangeSucceeded(payload.feedbackKind),
          ),
        ),
    ),
    catchEpicError((error: Error) =>
      conventionSlice.actions.statusChangeFailed(error.message),
    ),
  );

const getConventionStatusDashboardUrl: ConventionEpic = (
  action$,
  _,
  { conventionGateway },
) =>
  action$.pipe(
    filter(conventionSlice.actions.conventionStatusDashboardRequested.match),
    switchMap(({ payload }) =>
      conventionGateway.getConventionStatusDashboardUrl$(payload),
    ),
    map(conventionSlice.actions.conventionStatusDashboardSucceeded),
    catchEpicError((error: Error) =>
      conventionSlice.actions.conventionStatusDashboardFailed(error.message),
    ),
  );

const getPreselectAgencyId: ConventionEpic = (action$, _, { agencyGateway }) =>
  action$.pipe(
    filter(conventionSlice.actions.preselectedAgencyIdRequested.match),
    switchMap(() => agencyGateway.getImmersionFacileAgencyId$()),
    map((agencyId) =>
      conventionSlice.actions.preselectedAgencyIdSucceeded(agencyId || null),
    ),
    catchEpicError((error: Error) =>
      conventionSlice.actions.preselectedAgencyIdFailed(error.message),
    ),
  );

export const conventionEpics = [
  saveConventionEpic,
  getConventionEpic,
  signConventionEpic,
  conventionStatusChangeEpic,
  reflectFetchedConventionOnFormUi,
  getConventionStatusDashboardUrl,
  getPreselectAgencyId,
];

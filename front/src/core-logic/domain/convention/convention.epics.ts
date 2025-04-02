import { concatMap, filter, map, switchMap } from "rxjs";
import { isEstablishmentTutorIsEstablishmentRepresentative } from "shared";
import { conventionActionSlice } from "src/core-logic/domain/convention/convention-action/conventionAction.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
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
      const conventionGatewayAction$ = jwt
        ? conventionGateway.updateConvention$(payload.convention, jwt)
        : conventionGateway.createConvention$(payload);

      return conventionGatewayAction$.pipe(
        map(conventionSlice.actions.saveConventionSucceeded),
        catchEpicError((error: Error) =>
          conventionSlice.actions.saveConventionFailed(error.message),
        ),
      );
    }),
  );

const getSimilarConventionsEpic: ConventionEpic = (
  action$,
  _state$,
  { conventionGateway },
) =>
  action$.pipe(
    filter(conventionSlice.actions.getSimilarConventionsRequested.match),
    switchMap(({ payload }) =>
      conventionGateway.getSimilarConventions$(payload),
    ),
    map(conventionSlice.actions.getSimilarConventionsSucceeded),
    catchEpicError((error: Error) =>
      conventionSlice.actions.getSimilarConventionsFailed(error.message),
    ),
  );

const getConventionEpic: ConventionEpic = (
  action$,
  _state$,
  { conventionGateway },
) =>
  action$.pipe(
    filter(
      (action) =>
        conventionSlice.actions.fetchConventionRequested.match(action) ||
        conventionActionSlice.actions.signConventionSucceeded.match(action) ||
        conventionActionSlice.actions.acceptByCounsellorSucceeded.match(
          action,
        ) ||
        conventionActionSlice.actions.acceptByValidatorSucceeded.match(
          action,
        ) ||
        conventionActionSlice.actions.deprecateConventionSucceeded.match(
          action,
        ) ||
        conventionActionSlice.actions.rejectConventionSucceeded.match(action) ||
        conventionActionSlice.actions.editConventionSucceeded.match(action) ||
        conventionActionSlice.actions.cancelConventionSucceeded.match(action) ||
        conventionActionSlice.actions.transferConventionToAgencySucceeded.match(
          action,
        ),
    ),
    switchMap((action) => {
      if ("updateStatusParams" in action.payload) {
        return conventionGateway.retrieveFromToken$({
          conventionId: action.payload.updateStatusParams.conventionId,
          jwt: action.payload.jwt,
        });
      }
      if ("transferConventionToAgencyParams" in action.payload) {
        return conventionGateway.retrieveFromToken$({
          conventionId:
            action.payload.transferConventionToAgencyParams.conventionId,
          jwt: action.payload.jwt,
        });
      }
      return conventionGateway.retrieveFromToken$(action.payload);
    }),
    map((convention) => {
      return conventionSlice.actions.fetchConventionSucceeded(convention);
    }),
    catchEpicError((error: Error) => {
      return conventionSlice.actions.fetchConventionFailed(error.message);
    }),
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
    map(({ url }) =>
      conventionSlice.actions.conventionStatusDashboardSucceeded(url),
    ),
    catchEpicError((error: Error) =>
      conventionSlice.actions.conventionStatusDashboardFailed(error.message),
    ),
  );

export const conventionEpics = [
  saveConventionEpic,
  getConventionEpic,
  reflectFetchedConventionOnFormUi,
  getConventionStatusDashboardUrl,
  getSimilarConventionsEpic,
];

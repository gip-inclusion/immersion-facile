import { concatMap, delay, filter, map, switchMap } from "rxjs";
import { isEstablishmentTutorIsEstablishmentRepresentative } from "shared";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { transferConventionToAgencySlice } from "src/core-logic/domain/convention/transfer-convention-to-agency/transferConventionToAgency.slice";
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
        conventionSlice.actions.signConventionSucceeded.match(action) ||
        conventionSlice.actions.statusChangeSucceeded.match(action) ||
        transferConventionToAgencySlice.actions.transferConventionToAgencySucceeded.match(
          action,
        ),
    ),
    switchMap((action) => {
      const params = conventionSlice.actions.statusChangeSucceeded.match(action)
        ? {
            conventionId: action.payload.updateStatusParams.conventionId,
            jwt: action.payload.jwt,
          }
        : action.payload;
      return conventionGateway.retrieveFromToken$(params);
    }),
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
    switchMap(({ payload }) =>
      conventionGateway
        .signConvention$(payload.conventionId, payload.jwt)
        .pipe(
          map(() => conventionSlice.actions.signConventionSucceeded(payload)),
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
        .updateConventionStatus$(payload.updateStatusParams, payload.jwt)
        .pipe(
          map(() => conventionSlice.actions.statusChangeSucceeded(payload)),
          catchEpicError((error: Error) => {
            if (
              error.message.includes(
                "Convention should be reviewed by counsellor",
              )
            )
              return conventionSlice.actions.statusChangeSucceeded({
                ...payload,
                feedbackKind: "missingCounsellorValidationError",
              });

            return conventionSlice.actions.statusChangeFailed(error.message);
          }),
        ),
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
    map(({ url }) =>
      conventionSlice.actions.conventionStatusDashboardSucceeded(url),
    ),
    catchEpicError((error: Error) =>
      conventionSlice.actions.conventionStatusDashboardFailed(error.message),
    ),
  );

const renewConventionEpic: ConventionEpic = (
  action$,
  _,
  { conventionGateway },
) =>
  action$.pipe(
    filter(conventionSlice.actions.renewConventionRequested.match),
    switchMap(({ payload }) =>
      conventionGateway.renewConvention$(payload.params, payload.jwt),
    ),
    map(conventionSlice.actions.renewConventionSucceeded),
    catchEpicError((error: Error) =>
      conventionSlice.actions.renewConventionFailed(error.message),
    ),
  );

const minimumDelayBeforeItIsPossibleToBroadcastAgainMs = 10_000;

const broadcastConventionAgainEpic: ConventionEpic = (
  action$,
  state$,
  { conventionGateway, scheduler },
) =>
  action$.pipe(
    filter(conventionSlice.actions.broadcastConventionToPartnerRequested.match),
    switchMap(({ payload }) =>
      conventionGateway
        .broadcastConventionAgain$(
          { conventionId: payload.conventionId },
          getAdminToken(state$.value),
        )
        .pipe(
          delay(minimumDelayBeforeItIsPossibleToBroadcastAgainMs, scheduler),
          map(() =>
            conventionSlice.actions.broadcastConventionToPartnerSucceeded({
              feedbackTopic: payload.feedbackTopic,
            }),
          ),
          catchEpicError((error: Error) => {
            const isJsonError = error.message[0] === "{";
            return conventionSlice.actions.broadcastConventionToPartnerFailed({
              errorMessage: isJsonError
                ? JSON.parse(error.message).message
                : error.message,
              feedbackTopic: payload.feedbackTopic,
            });
          }),
        ),
    ),
  );

export const conventionEpics = [
  saveConventionEpic,
  getConventionEpic,
  signConventionEpic,
  conventionStatusChangeEpic,
  reflectFetchedConventionOnFormUi,
  getConventionStatusDashboardUrl,
  renewConventionEpic,
  getSimilarConventionsEpic,
  broadcastConventionAgainEpic,
];

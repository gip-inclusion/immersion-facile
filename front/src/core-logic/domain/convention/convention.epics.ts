import { concatMap, filter, map, switchMap } from "rxjs";
import type { Observable } from "rxjs";
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
    switchMap((action) => {
      const conventionState = state$.value.convention;
      const { jwt } = conventionState;
      const conventionGatewayAction$ = jwt
        ? conventionGateway.updateConvention$(action.payload.convention, jwt)
        : conventionGateway.createConvention$(action.payload);

      return conventionGatewayAction$.pipe(
        map(() =>
          conventionSlice.actions.saveConventionSucceeded({
            convention: action.payload.convention,
            discussionId: action.payload.discussionId,
            feedbackTopic: action.payload.feedbackTopic,
          }),
        ),
        catchEpicError((error: Error) =>
          conventionSlice.actions.saveConventionFailed({
            errorMessage: error.message,
            feedbackTopic: action.payload.feedbackTopic,
          }),
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
    switchMap((action) =>
      conventionGateway.getSimilarConventions$(action.payload).pipe(
        map((similarConventionIds) =>
          conventionSlice.actions.getSimilarConventionsSucceeded({
            similarConventionIds,
            feedbackTopic: action.payload.feedbackTopic,
          }),
        ),
        catchEpicError((error: Error) =>
          conventionSlice.actions.getSimilarConventionsFailed({
            errorMessage: error.message,
            feedbackTopic: action.payload.feedbackTopic,
          }),
        ),
      ),
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
    switchMap((action): Observable<ConventionAction> => {
      if ("updateStatusParams" in action.payload) {
        return conventionGateway
          .retrieveFromToken$({
            conventionId: action.payload.updateStatusParams.conventionId,
            jwt: action.payload.jwt,
          })
          .pipe(
            map((convention) =>
              conventionSlice.actions.fetchConventionSucceeded({
                convention,
                feedbackTopic: action.payload.feedbackTopic,
              }),
            ),
          );
      }
      if ("transferConventionToAgencyParams" in action.payload) {
        return conventionGateway
          .retrieveFromToken$({
            conventionId:
              action.payload.transferConventionToAgencyParams.conventionId,
            jwt: action.payload.jwt,
          })
          .pipe(
            map((convention) =>
              conventionSlice.actions.fetchConventionSucceeded({
                convention,
                feedbackTopic: action.payload.feedbackTopic,
              }),
            ),
          );
      }
      return conventionGateway
        .retrieveFromToken$({
          conventionId: action.payload.conventionId,
          jwt: action.payload.jwt,
        })
        .pipe(
          map((convention) =>
            conventionSlice.actions.fetchConventionSucceeded({
              convention,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
          catchEpicError((error: Error) => {
            return conventionSlice.actions.fetchConventionFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            });
          }),
        );
    }),
    filter((action): action is ConventionAction => action !== undefined),
  );

const reflectFetchedConventionOnFormUi: ConventionEpic = (action$, state$) =>
  action$.pipe(
    filter(conventionSlice.actions.fetchConventionSucceeded.match),
    concatMap((action) => [
      conventionSlice.actions.isTutorEstablishmentRepresentativeChanged(
        action.payload.convention
          ? isEstablishmentTutorIsEstablishmentRepresentative(
              action.payload.convention,
            )
          : state$.value.convention.formUi.isTutorEstablishmentRepresentative,
      ),
      conventionSlice.actions.isMinorChanged(
        action.payload.convention
          ? !!action.payload.convention.signatories.beneficiaryRepresentative
          : state$.value.convention.formUi.isMinor,
      ),
      conventionSlice.actions.isCurrentEmployerChanged(
        action.payload.convention
          ? !!action.payload.convention.signatories.beneficiaryCurrentEmployer
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
    switchMap((action) =>
      conventionGateway
        .getConventionStatusDashboardUrl$(action.payload.jwt)
        .pipe(
          map(({ url }) =>
            conventionSlice.actions.conventionStatusDashboardSucceeded({
              url,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
          catchEpicError((error: Error) =>
            conventionSlice.actions.conventionStatusDashboardFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

export const conventionEpics = [
  saveConventionEpic,
  getConventionEpic,
  reflectFetchedConventionOnFormUi,
  getConventionStatusDashboardUrl,
  getSimilarConventionsEpic,
];

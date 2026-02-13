import { filter, map, switchMap } from "rxjs";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { conventionTemplateSlice } from "./conventionTemplate.slice";

type ConventionTemplateAction = ActionOfSlice<typeof conventionTemplateSlice>;
type ConventionTemplateEpic = AppEpic<ConventionTemplateAction>;

const createOrUpdateConventionTemplateEpic: ConventionTemplateEpic = (
  action$,
  _state$,
  { conventionGateway },
) =>
  action$.pipe(
    filter(
      conventionTemplateSlice.actions.createOrUpdateConventionTemplateRequested
        .match,
    ),
    switchMap((action) =>
      conventionGateway
        .createOrUpdateConventionTemplate$(
          action.payload.conventionTemplate,
          action.payload.jwt,
        )
        .pipe(
          map(() =>
            conventionTemplateSlice.actions.createOrUpdateConventionTemplateSucceeded(
              {
                conventionTemplate: action.payload.conventionTemplate,
                feedbackTopic: action.payload.feedbackTopic,
              },
            ),
          ),
          catchEpicError((error: Error) =>
            conventionTemplateSlice.actions.createOrUpdateConventionTemplateFailed(
              {
                errorMessage: error.message,
                feedbackTopic: action.payload.feedbackTopic,
              },
            ),
          ),
        ),
    ),
  );

const fetchConventionTemplatesEpic: ConventionTemplateEpic = (
  action$,
  _state$,
  { conventionGateway },
) =>
  action$.pipe(
    filter(
      conventionTemplateSlice.actions.fetchConventionTemplatesRequested.match,
    ),
    switchMap((action) =>
      conventionGateway
        .getConventionTemplatesForCurrentUser$(action.payload.jwt)
        .pipe(
          map((conventionTemplates) =>
            conventionTemplateSlice.actions.fetchConventionTemplatesSucceeded({
              conventionTemplates,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
          catchEpicError((error: Error) =>
            conventionTemplateSlice.actions.fetchConventionTemplatesFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

const deleteConventionTemplateEpic: ConventionTemplateEpic = (
  action$,
  _state$,
  { conventionGateway },
) =>
  action$.pipe(
    filter(
      conventionTemplateSlice.actions.deleteConventionTemplateRequested.match,
    ),
    switchMap((action) =>
      conventionGateway
        .deleteConventionTemplate$(
          action.payload.conventionTemplateId,
          action.payload.jwt,
        )
        .pipe(
          map(() =>
            conventionTemplateSlice.actions.deleteConventionTemplateSucceeded({
              conventionTemplateId: action.payload.conventionTemplateId,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
          catchEpicError((error: Error) =>
            conventionTemplateSlice.actions.deleteConventionTemplateFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

export const conventionTemplateEpics = [
  createOrUpdateConventionTemplateEpic,
  fetchConventionTemplatesEpic,
  deleteConventionTemplateEpic,
];

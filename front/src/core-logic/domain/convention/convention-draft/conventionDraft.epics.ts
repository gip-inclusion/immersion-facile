import { filter, map, switchMap } from "rxjs";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { conventionDraftSlice } from "./conventionDraft.slice";

type ConventionDraftAction = ActionOfSlice<typeof conventionDraftSlice>;
type ConventionDraftEpic = AppEpic<ConventionDraftAction>;

const fetchConventionDraftEpic: ConventionDraftEpic = (
  action$,
  _state$,
  { conventionGateway },
) =>
  action$.pipe(
    filter(conventionDraftSlice.actions.fetchConventionDraftRequested.match),
    switchMap((action) =>
      conventionGateway
        .getConventionDraftById$(action.payload.conventionDraftId)
        .pipe(
          map((conventionDraft) =>
            conventionDraftSlice.actions.fetchConventionDraftSucceeded({
              conventionDraft,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
          catchEpicError((error: Error) =>
            conventionDraftSlice.actions.fetchConventionDraftFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

const shareConventionDraftByEmailEpic: ConventionDraftEpic = (
  action$,
  _state$,
  { conventionGateway },
) =>
  action$.pipe(
    filter(
      conventionDraftSlice.actions.shareConventionDraftByEmailRequested.match,
    ),
    switchMap((action) =>
      conventionGateway.shareConventionDraftByEmail(action.payload).pipe(
        map(() =>
          conventionDraftSlice.actions.shareConventionDraftByEmailSucceeded(
            action.payload,
          ),
        ),
        catchEpicError((error: Error) =>
          conventionDraftSlice.actions.shareConventionDraftByEmailFailed({
            errorMessage: error.message,
            feedbackTopic: action.payload.feedbackTopic,
          }),
        ),
      ),
    ),
  );

export const conventionDraftEpics = [
  fetchConventionDraftEpic,
  shareConventionDraftByEmailEpic,
];

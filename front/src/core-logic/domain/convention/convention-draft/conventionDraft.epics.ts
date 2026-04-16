import { filter, map, switchMap, tap } from "rxjs";
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
  { conventionGateway, navigationGateway },
) =>
  action$.pipe(
    filter(
      conventionDraftSlice.actions.saveConventionDraftThenRedirectRequested
        .match,
    ),
    switchMap((action) => {
      const { feedbackTopic, redirectUrl, ...shareDraftDto } = action.payload;
      return conventionGateway.shareConventionDraftByEmail(shareDraftDto).pipe(
        tap(() => {
          if (redirectUrl) navigationGateway.goToUrl(redirectUrl);
        }),
        map(() =>
          conventionDraftSlice.actions.saveConventionDraftThenRedirectSucceeded(
            action.payload,
          ),
        ),
        catchEpicError((error: Error) =>
          conventionDraftSlice.actions.saveConventionDraftThenRedirectFailed({
            errorMessage: error.message,
            feedbackTopic,
          }),
        ),
      );
    }),
  );

export const conventionDraftEpics = [
  fetchConventionDraftEpic,
  shareConventionDraftByEmailEpic,
];

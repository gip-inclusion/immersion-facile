import { filter, map, switchMap } from "rxjs";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { partnersErroredConventionSlice } from "./partnersErroredConvention.slice";

type PartnersErroredConvention = ActionOfSlice<
  typeof partnersErroredConventionSlice
>;

type PartnersErroredConventionEpic = AppEpic<PartnersErroredConvention>;

const markPartnersErroredConventionAsHandledEpic: PartnersErroredConventionEpic =
  (action$, _, { inclusionConnectedGateway }) =>
    action$.pipe(
      filter(
        partnersErroredConventionSlice.actions.markAsHandledRequested.match,
      ),
      switchMap(({ payload }) =>
        inclusionConnectedGateway
          .markPartnersErroredConventionAsHandled$(
            payload.markAsHandledParams,
            payload.jwt,
          )
          .pipe(
            map(() =>
              partnersErroredConventionSlice.actions.markAsHandledSucceeded({
                feedbackTopic: "partner-conventions",
              }),
            ),
          ),
      ),
      catchEpicError((error: Error) =>
        partnersErroredConventionSlice.actions.markAsHandledFailed({
          feedbackTopic: "partner-conventions",
          errorMessage: error.message,
        }),
      ),
    );

export const partnersErroredConventionEpics = [
  markPartnersErroredConventionAsHandledEpic,
];

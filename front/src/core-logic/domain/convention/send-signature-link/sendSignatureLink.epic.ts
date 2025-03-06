import { filter } from "rxjs";
import { delay, map, switchMap } from "rxjs/operators";
import { sendSignatureLinkSlice } from "src/core-logic/domain/convention/send-signature-link/sendSignatureLink.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

export type SendSignatureLinkAction = ActionOfSlice<
  typeof sendSignatureLinkSlice
>;

type SendSignatureLinkEpic = AppEpic<
  SendSignatureLinkAction | { type: "do-nothing" }
>;
const minimumDelayBeforeItIsPossibleToSendSignatureLinkAgainMs = 10_000;
const sendSignatureLinkEpic: SendSignatureLinkEpic = (
  action$,
  _,
  { conventionGateway, scheduler },
) =>
  action$.pipe(
    filter(sendSignatureLinkSlice.actions.sendSignatureLinkRequested.match),
    switchMap((action) =>
      conventionGateway
        .sendSignatureLink$(action.payload, action.payload.jwt)
        .pipe(
          delay(
            minimumDelayBeforeItIsPossibleToSendSignatureLinkAgainMs,
            scheduler,
          ),
          map(() =>
            sendSignatureLinkSlice.actions.sendSignatureLinkSucceeded(
              action.payload,
            ),
          ),
          catchEpicError((error) =>
            sendSignatureLinkSlice.actions.sendSignatureLinkFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

export const sendSignatureLinkEpics = [sendSignatureLinkEpic];

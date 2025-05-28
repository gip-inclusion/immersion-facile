import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { sendSignatureLinkSlice } from "src/core-logic/domain/convention/send-signature-link/sendSignatureLink.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

export type SendSignatureLinkAction = ActionOfSlice<
  typeof sendSignatureLinkSlice
>;

type SendSignatureLinkEpic = AppEpic<
  SendSignatureLinkAction | { type: "do-nothing" }
>;

const sendSignatureLinkEpic: SendSignatureLinkEpic = (
  action$,
  _,
  { conventionGateway },
) =>
  action$.pipe(
    filter(sendSignatureLinkSlice.actions.sendSignatureLinkRequested.match),
    switchMap((action) =>
      conventionGateway
        .sendSignatureLink$(action.payload, action.payload.jwt)
        .pipe(
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

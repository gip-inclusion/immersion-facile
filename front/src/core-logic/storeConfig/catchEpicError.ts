import * as Sentry from "@sentry/browser";
import { Observable, catchError, merge, of } from "rxjs";

export const catchEpicError =
  <
    InputAction extends { type: string; payload: unknown },
    OutputAction extends { type: string; payload: unknown },
  >(
    cb: (error: Error) => OutputAction,
  ) =>
  (inputObs: Observable<InputAction>): Observable<OutputAction | InputAction> =>
    inputObs.pipe(
      catchError((error, caught) => {
        Sentry.captureException(error);
        return merge(of(cb(error)), caught);
      }),
    );

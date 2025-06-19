import * as Sentry from "@sentry/browser";
import { catchError, type Observable, of } from "rxjs";

export const catchEpicError =
  <
    InputAction extends { type: string; payload: unknown },
    OutputAction extends { type: string; payload: unknown },
  >(
    cb: (error: Error) => OutputAction,
  ) =>
  (inputObs: Observable<InputAction>): Observable<OutputAction | InputAction> =>
    inputObs.pipe(
      catchError((error) => {
        Sentry.captureException(error);
        return of(cb(error));
      }),
    );

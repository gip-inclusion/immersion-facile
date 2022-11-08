import { catchError, merge, Observable, of } from "rxjs";

export const catchEpicError =
  <
    InputAction extends { type: string; payload: unknown },
    OutputAction extends { type: string; payload: unknown },
  >(
    cb: (error: Error) => OutputAction,
  ) =>
  (inputObs: Observable<InputAction>): Observable<OutputAction | InputAction> =>
    inputObs.pipe(catchError((error, caught) => merge(of(cb(error)), caught)));

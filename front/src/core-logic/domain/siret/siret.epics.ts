import { Observable, filter, iif, map, of, switchMap } from "rxjs";
import { GetSiretInfo, GetSiretInfoError, SiretDto, siretSchema } from "shared";
import {
  SiretAction,
  siretSlice,
} from "src/core-logic/domain/siret/siret.slice";
import { FormCompletionGateway } from "src/core-logic/ports/FormCompletionGateway";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import { AppEpic } from "src/core-logic/storeConfig/redux.helpers";

type SiretEpic = AppEpic<SiretAction>;

const toggleShouldFetchEvenIfAlreadySaved: SiretEpic = (action$, state$) =>
  action$.pipe(
    filter(siretSlice.actions.setShouldFetchEvenIfAlreadySaved.match),
    map(() =>
      siretSlice.actions.siretModified({
        siret: state$.value.siret.currentSiret,
        feedbackTopic: "siret-input",
      }),
    ),
  );

const triggerSiretFetchEpic: SiretEpic = (action$) =>
  action$.pipe(
    filter(siretSlice.actions.siretModified.match),
    switchMap((action) =>
      iif(
        () => siretSchema.safeParse(action.payload.siret).success,
        of(siretSlice.actions.siretInfoRequested(action.payload)),
        of(siretSlice.actions.siretWasNotValid()),
      ),
    ),
  );

const getSiretEpic: SiretEpic = (
  action$,
  state$,
  { formCompletionGateway },
) => {
  const getSiret$ = makeGetSiret(formCompletionGateway);

  return action$.pipe(
    filter(siretSlice.actions.siretInfoRequested.match),
    switchMap((action) =>
      getSiret$({
        shouldFetchEvenIfAlreadySaved:
          state$.value.siret.shouldFetchEvenIfAlreadySaved,
        siret: action.payload.siret,
      }).pipe(
        map((siretResult) => {
          if (siretResult === null)
            return siretSlice.actions.siretInfoDisabledAndNoMatchInDbFound({
              siret: state$.value.siret.currentSiret,
            });
          return typeof siretResult === "string"
            ? siretSlice.actions.siretInfoFailed(siretResult)
            : siretSlice.actions.siretInfoSucceeded({
                siretEstablishment: siretResult,
                feedbackTopic: action.payload.feedbackTopic,
              });
        }),
        catchEpicError((error) =>
          siretSlice.actions.siretInfoFailed(
            error.message as GetSiretInfoError,
          ),
        ),
      ),
    ),
  );
};

const makeGetSiret =
  (siretGatewayThroughBack: FormCompletionGateway) =>
  ({
    shouldFetchEvenIfAlreadySaved,
    siret,
  }: {
    shouldFetchEvenIfAlreadySaved: boolean;
    siret: SiretDto;
  }): Observable<GetSiretInfo | null> =>
    shouldFetchEvenIfAlreadySaved
      ? siretGatewayThroughBack.getSiretInfo(siret)
      : siretGatewayThroughBack.getSiretInfoIfNotAlreadySaved(siret);

export const siretEpics = [
  triggerSiretFetchEpic,
  getSiretEpic,
  toggleShouldFetchEvenIfAlreadySaved,
];

import { filter, map, type Observable, switchMap } from "rxjs";
import {
  type GetSiretInfo,
  type GetSiretInfoError,
  type SiretDto,
  siretSchema,
} from "shared";
import {
  type SiretAction,
  siretSlice,
} from "src/core-logic/domain/siret/siret.slice";
import type { FormCompletionGateway } from "src/core-logic/ports/FormCompletionGateway";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type { AppEpic } from "src/core-logic/storeConfig/redux.helpers";

type SiretEpic = AppEpic<SiretAction>;

const toggleShouldFetchEvenIfAlreadySaved: SiretEpic = (action$, state$) =>
  action$.pipe(
    filter(siretSlice.actions.setShouldFetchEvenIfAlreadySaved.match),
    map((action) =>
      siretSlice.actions.siretModified({
        siret: state$.value.siret.currentSiret,
        feedbackTopic: "siret-input",
        addressAutocompleteLocator: action.payload.addressAutocompleteLocator,
      }),
    ),
  );

const triggerSiretFetchEpic: SiretEpic = (action$) =>
  action$.pipe(
    filter(siretSlice.actions.siretModified.match),
    map((action) => {
      const isValid = siretSchema.safeParse(action.payload.siret).success;
      return isValid
        ? siretSlice.actions.siretInfoRequested(action.payload)
        : siretSlice.actions.siretWasNotValid();
    }),
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
                addressAutocompleteLocator:
                  action.payload.addressAutocompleteLocator,
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
      ? siretGatewayThroughBack.getSiretInfo$(siret)
      : siretGatewayThroughBack.getSiretInfoIfNotAlreadySaved$(siret);

export const siretEpics = [
  triggerSiretFetchEpic,
  getSiretEpic,
  toggleShouldFetchEvenIfAlreadySaved,
];

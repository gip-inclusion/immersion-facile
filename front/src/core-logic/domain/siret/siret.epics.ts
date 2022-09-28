import { filter, iif, map, Observable, of, switchMap } from "rxjs";
import { GetSiretInfo, SiretDto, siretSchema } from "shared";
import {
  SiretAction,
  siretSlice,
} from "src/core-logic/domain/siret/siret.slice";
import { SiretGatewayThroughBack } from "src/core-logic/ports/SiretGatewayThroughBack";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import { AppEpic } from "src/core-logic/storeConfig/redux.helpers";

const shouldTriggerSearch = (candidate: string) => {
  try {
    siretSchema.parse(candidate);
    return true;
  } catch {
    return false;
  }
};

type SiretEpic = AppEpic<SiretAction>;

const toggleShouldFetchEvenIfAlreadySaved: SiretEpic = (action$, state$) =>
  action$.pipe(
    filter(siretSlice.actions.toggleShouldFetchEvenIfAlreadySaved.match),
    map(() =>
      siretSlice.actions.siretModified(state$.value.siret.currentSiret),
    ),
  );

const triggerSiretFetchEpic: SiretEpic = (action$) =>
  action$.pipe(
    filter(siretSlice.actions.siretModified.match),
    switchMap((action) =>
      iif(
        () => shouldTriggerSearch(action.payload),
        of(siretSlice.actions.siretInfoRequested(action.payload)),
        of(siretSlice.actions.siretWasNotValid()),
      ),
    ),
  );

const getSiretEpic: SiretEpic = (
  action$,
  state$,
  { siretGatewayThroughBack },
) => {
  const getSiret = makeGetSiret(siretGatewayThroughBack);

  return action$.pipe(
    filter(siretSlice.actions.siretInfoRequested.match),
    switchMap((action) =>
      getSiret({
        enableInseeApi: state$.value.featureFlags.enableInseeApi,
        shouldFetchEvenIfAlreadySaved:
          state$.value.siret.shouldFetchEvenIfAlreadySaved,
        siret: action.payload,
      }),
    ),
    // the condition on siretResult type should not be handled here but in the gateway
    // (with an errored observable, caught here with catchEpicError())
    map<GetSiretInfo | null, SiretAction>((siretResult) => {
      if (siretResult === null)
        return siretSlice.actions.siretInfoDisabledAndNoMatchInDbFound();
      return typeof siretResult === "string"
        ? siretSlice.actions.siretInfoFailed(siretResult)
        : siretSlice.actions.siretInfoSucceeded(siretResult);
    }),
    catchEpicError((error) =>
      siretSlice.actions.siretInfoFailed(error.message),
    ),
  );
};

const makeGetSiret =
  (siretGatewayThroughBack: SiretGatewayThroughBack) =>
  ({
    enableInseeApi,
    shouldFetchEvenIfAlreadySaved,
    siret,
  }: {
    enableInseeApi: boolean;
    shouldFetchEvenIfAlreadySaved: boolean;
    siret: SiretDto;
  }): Observable<GetSiretInfo | null> => {
    if (!enableInseeApi) {
      return siretGatewayThroughBack
        .isSiretAlreadyInSaved(siret)
        .pipe(
          map((isAlreadySaved) =>
            isAlreadySaved
              ? "Establishment with this siret is already in our DB"
              : null,
          ),
        );
    }

    return shouldFetchEvenIfAlreadySaved
      ? siretGatewayThroughBack.getSiretInfo(siret)
      : siretGatewayThroughBack.getSiretInfoIfNotAlreadySaved(siret);
  };

export const siretEpics = [
  triggerSiretFetchEpic,
  getSiretEpic,
  toggleShouldFetchEvenIfAlreadySaved,
];

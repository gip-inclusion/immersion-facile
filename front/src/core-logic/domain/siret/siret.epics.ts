import { catchError, filter, iif, map, Observable, of, switchMap } from "rxjs";
import { SiretDto, siretSchema } from "shared/src/siret";
import {
  SiretAction,
  siretSlice,
} from "src/core-logic/domain/siret/siret.slice";
import {
  GetSiretInfo,
  SiretGatewayThroughBack,
} from "src/core-logic/ports/SiretGatewayThroughBack";
import { AppEpic } from "src/core-logic/storeConfig/redux.helpers";

const shouldTriggerSearch = (candidate: string) => {
  try {
    siretSchema.parse(candidate);
    return true;
  } catch {
    return false;
  }
};

const triggerSiretFetchEpic: AppEpic<SiretAction> = (action$) =>
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

const getSiretEpic: AppEpic<SiretAction> = (
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
    // (with an errored observable, caught here with catchError())
    map<GetSiretInfo | null, SiretAction>((siretResult) => {
      if (siretResult === null)
        return siretSlice.actions.siretInfoDisabledAndNoMatchInDbFound();
      return typeof siretResult === "string"
        ? siretSlice.actions.siretInfoFailed(siretResult)
        : siretSlice.actions.siretInfoSucceeded(siretResult);
    }),
    catchError((error) =>
      of(siretSlice.actions.siretInfoFailed(error.message)),
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

export const siretEpics = [triggerSiretFetchEpic, getSiretEpic];

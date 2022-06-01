import { filter, iif, map, Observable, of, switchMap } from "rxjs";
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

const triggerSiretFetchEpic: AppEpic<SiretAction> = (action$, state$) =>
  action$.pipe(
    filter(siretSlice.actions.siretModified.match),
    switchMap((action) =>
      iif(
        () => shouldTriggerSearch(action.payload),
        of(siretSlice.actions.siretInfoRequested(action.payload)).pipe(
          filter(() => state$.value.featureFlags.featureFlags.enableInseeApi),
        ),
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
      getSiret(
        state$.value.siret.shouldFetchEvenIfAlreadySaved,
        action.payload,
      ),
    ),
    // the condition on siretResult type should not be handled here but in the gateway
    // (with an errored observable, caught here with catchError())
    map<GetSiretInfo, SiretAction>((siretResult) =>
      typeof siretResult === "string"
        ? siretSlice.actions.siretInfoFailed(siretResult)
        : siretSlice.actions.siretInfoSucceeded(siretResult),
    ),
  );
};

const makeGetSiret =
  (siretGatewayThroughBack: SiretGatewayThroughBack) =>
  (
    shouldFetchEvenIfAlreadySaved: boolean,
    siret: SiretDto,
  ): Observable<GetSiretInfo> =>
    shouldFetchEvenIfAlreadySaved
      ? siretGatewayThroughBack.getSiretInfoObservable(siret)
      : siretGatewayThroughBack.getSiretInfoIfNotAlreadySaved(siret);

export const siretEpics = [triggerSiretFetchEpic, getSiretEpic];

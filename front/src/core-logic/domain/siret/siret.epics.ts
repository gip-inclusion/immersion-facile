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
) =>
  action$.pipe(
    filter(siretSlice.actions.siretInfoRequested.match),
    switchMap((action) => {
      const getSiret = makeGetSiret(
        state$.value.siret.shouldFetchEvenIfAlreadySaved,
        siretGatewayThroughBack,
      );

      return getSiret(action.payload).pipe(
        map(siretSlice.actions.siretInfoSucceeded),
      );
    }),
  );

const makeGetSiret = (
  shouldFetchEvenIfAlreadySaved: boolean,
  siretGatewayThroughBack: SiretGatewayThroughBack,
): ((siret: SiretDto) => Observable<GetSiretInfo>) =>
  shouldFetchEvenIfAlreadySaved
    ? (siret) => siretGatewayThroughBack.getSiretInfoObservable(siret)
    : (siret) => siretGatewayThroughBack.getSiretInfoIfNotAlreadySaved(siret);

export const siretEpics = [triggerSiretFetchEpic, getSiretEpic];

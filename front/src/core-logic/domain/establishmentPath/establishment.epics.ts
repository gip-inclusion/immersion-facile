import { filter, map, switchMap, tap } from "rxjs";
import { establishmentSlice } from "src/core-logic/domain/establishmentPath/establishment.slice";
import {
  SiretAction,
  siretSlice,
} from "src/core-logic/domain/siret/siret.slice";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type EstablishmentAction = ActionOfSlice<typeof establishmentSlice>;

const requestEstablishmentModification: AppEpic<EstablishmentAction> = (
  action$,
  _,
  { establishmentGateway },
) =>
  action$.pipe(
    filter(establishmentSlice.actions.sendModificationLinkRequested.match),
    switchMap((action) =>
      establishmentGateway.requestEstablishmentModificationObservable(
        action.payload,
      ),
    ),
    map(establishmentSlice.actions.sendModificationLinkSucceeded),
  );

const redirectToEstablishmentFormPageEpic: AppEpic<
  EstablishmentAction | SiretAction
> = (action$, state$, { navigationGateway }) =>
  action$.pipe(
    filter(siretSlice.actions.siretInfoSucceeded.match),
    filter(
      () =>
        state$.value.establishment.status ===
        "READY_FOR_LINK_REQUEST_OR_REDIRECTION",
    ),
    tap((action) => {
      if (typeof action.payload !== "string") {
        navigationGateway.navigateToEstablishmentForm(action.payload.siret);
      }
    }),
    map(() => establishmentSlice.actions.navigatedAwayFromHome()),
  );

export const establishmentEpics = [
  requestEstablishmentModification,
  redirectToEstablishmentFormPageEpic,
];

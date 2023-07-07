import { filter, map, switchMap, tap } from "rxjs";
import { LegacyHttpClientError } from "shared";
import { establishmentSlice } from "src/core-logic/domain/establishmentPath/establishment.slice";
import {
  SiretAction,
  siretSlice,
} from "src/core-logic/domain/siret/siret.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
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
      establishmentGateway.requestEstablishmentModification$(action.payload),
    ),
    map(establishmentSlice.actions.sendModificationLinkSucceeded),
    catchEpicError((error) =>
      establishmentSlice.actions.sendModificationLinkFailed(
        (error as LegacyHttpClientError).data.errors,
      ),
    ),
  );

const redirectToEstablishmentFormPageEpic: AppEpic<
  EstablishmentAction | SiretAction
> = (action$, state$, { navigationGateway }) =>
  action$.pipe(
    filter(
      (action) =>
        siretSlice.actions.siretInfoSucceeded.match(action) ||
        siretSlice.actions.siretInfoDisabledAndNoMatchInDbFound.match(action),
    ),
    filter(
      () =>
        state$.value.establishment.status ===
        "READY_FOR_LINK_REQUEST_OR_REDIRECTION",
    ),
    tap(() =>
      navigationGateway.navigateToEstablishmentForm(
        state$.value.siret.currentSiret,
      ),
    ),
    map(() => establishmentSlice.actions.backToIdle()),
  );

export const establishmentEpics = [
  requestEstablishmentModification,
  redirectToEstablishmentFormPageEpic,
];

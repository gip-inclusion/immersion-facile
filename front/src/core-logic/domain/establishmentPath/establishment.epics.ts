import { filter, iif, map, of, switchMap, tap } from "rxjs";
import { JwtDto, LegacyHttpClientError } from "shared";
import {
  defaultFormEstablishmentValue,
  establishmentSlice,
} from "src/core-logic/domain/establishmentPath/establishment.slice";
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
    catchEpicError(() =>
      establishmentSlice.actions.sendModificationLinkFailed(),
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
        state$.value.establishment.feedback.kind ===
        "readyForLinkRequestOrRedirection",
    ),
    tap(() =>
      navigationGateway.navigateToEstablishmentForm(
        state$.value.siret.currentSiret,
      ),
    ),
    map(() => establishmentSlice.actions.backToIdle()),
  );

const hasPayloadJwt = (payload: unknown): payload is JwtDto =>
  "jwt" in (payload as JwtDto);

const fetchEstablishmentEpic: AppEpic<EstablishmentAction> = (
  action$,
  _state$,
  { establishmentGateway },
) =>
  action$.pipe(
    filter(establishmentSlice.actions.establishmentRequested.match),
    switchMap((action) =>
      iif(
        () => hasPayloadJwt(action.payload),
        establishmentGateway.getFormEstablishmentFromJwt$(
          action.payload.siret ? action.payload.siret : "",
          hasPayloadJwt(action.payload) ? action.payload.jwt : "",
        ),
        of({
          ...defaultFormEstablishmentValue(),
          ...action.payload,
        }),
      ),
    ),
    map(establishmentSlice.actions.establishmentProvided),
    catchEpicError((error) =>
      establishmentSlice.actions.establishmentProvideFailed(error.message),
    ),
  );

const addFormEstablishmentEpic: AppEpic<EstablishmentAction> = (
  action$,
  _state$,
  { establishmentGateway },
) =>
  action$.pipe(
    filter(establishmentSlice.actions.establishmentCreationRequested.match),
    switchMap((action) =>
      establishmentGateway.addFormEstablishment$(action.payload),
    ),
    map(establishmentSlice.actions.establishmentCreationSucceeded),
  );

export const establishmentEpics = [
  requestEstablishmentModification,
  redirectToEstablishmentFormPageEpic,
  fetchEstablishmentEpic,
  addFormEstablishmentEpic,
];

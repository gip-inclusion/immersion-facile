import { filter, map, of, switchMap, tap } from "rxjs";
import { JwtDto } from "shared";
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
      (_action) =>
        state$.value.establishment.feedback.kind ===
        "readyForLinkRequestOrRedirection",
    ),
    tap((action) => {
      if (action.payload && typeof action.payload === "object") {
        return navigationGateway.navigateToEstablishmentForm({
          siret: "siret" in action.payload ? action.payload.siret : "",
          ...("businessName" in action.payload && {
            bName: action.payload.businessName,
          }),
          ...("businessAddress" in action.payload && {
            bAddress: action.payload.businessAddress,
          }),
        });
      }
    }),
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
      hasPayloadJwt(action.payload)
        ? establishmentGateway.getFormEstablishmentFromJwt$(
            action.payload.siret ?? "",
            action.payload.jwt,
          )
        : of({
            ...defaultFormEstablishmentValue(),
            ...action.payload,
          }),
    ),
    map(establishmentSlice.actions.establishmentProvided),
    catchEpicError((error) =>
      establishmentSlice.actions.establishmentProvideFailed(error.message),
    ),
  );

const createFormEstablishmentEpic: AppEpic<EstablishmentAction> = (
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
    catchEpicError((error) =>
      establishmentSlice.actions.establishmentCreationFailed(error.message),
    ),
  );

const editFormEstablishmentEpic: AppEpic<EstablishmentAction> = (
  action$,
  _state$,
  { establishmentGateway },
) =>
  action$.pipe(
    filter(establishmentSlice.actions.establishmentEditionRequested.match),
    switchMap((action) =>
      establishmentGateway.updateFormEstablishment$(
        action.payload.formEstablishment,
        action.payload.jwt,
      ),
    ),
    map(establishmentSlice.actions.establishmentEditionSucceeded),
    catchEpicError((error) =>
      establishmentSlice.actions.establishmentEditionFailed(error.message),
    ),
  );

const deleteFormEstablishmentEpic: AppEpic<EstablishmentAction> = (
  action$,
  _state$,
  { establishmentGateway },
) =>
  action$.pipe(
    filter(establishmentSlice.actions.establishmentDeletionRequested.match),
    switchMap((action) =>
      establishmentGateway.deleteEstablishment$(
        action.payload.siret,
        action.payload.jwt,
      ),
    ),
    map(establishmentSlice.actions.establishmentDeletionSucceeded),
    catchEpicError((error) =>
      establishmentSlice.actions.establishmentDeletionFailed(error.message),
    ),
  );

export const establishmentEpics = [
  requestEstablishmentModification,
  redirectToEstablishmentFormPageEpic,
  fetchEstablishmentEpic,
  createFormEstablishmentEpic,
  editFormEstablishmentEpic,
  deleteFormEstablishmentEpic,
];

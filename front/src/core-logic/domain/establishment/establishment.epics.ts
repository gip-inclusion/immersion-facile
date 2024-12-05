import { filter, map, of, switchMap, tap } from "rxjs";
import {
  SiretAndJwtPayload,
  defaultFormEstablishmentValue,
  establishmentSlice,
} from "src/core-logic/domain/establishment/establishment.slice";
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
    switchMap((action) => {
      return establishmentGateway
        .requestEstablishmentModification$(action.payload.siret)
        .pipe(
          map(() =>
            establishmentSlice.actions.sendModificationLinkSucceeded({
              feedbackTopic: action.payload.feedbackTopic,
              siret: action.payload.siret,
            }),
          ),
          catchEpicError((error) =>
            establishmentSlice.actions.sendModificationLinkFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        );
    }),
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
    tap((action) => {
      const payload = action.payload;
      if (
        payload &&
        typeof payload === "object" &&
        "siretEstablishment" in payload &&
        state$.value.establishment.isReadyForRedirection
      ) {
        const { siretEstablishment } = payload;
        return navigationGateway.navigateToEstablishmentForm({
          siret: siretEstablishment.siret ?? "",
          bName: siretEstablishment.businessName ?? undefined,
          bAddresses: siretEstablishment.businessAddress
            ? [siretEstablishment.businessAddress]
            : undefined,
        });
      }
    }),
    map(siretSlice.actions.siretToEstablishmentRedirectionRequested),
  );

const fetchEstablishmentEpic: AppEpic<EstablishmentAction> = (
  action$,
  _state$,
  { establishmentGateway },
) =>
  action$.pipe(
    filter(establishmentSlice.actions.fetchEstablishmentRequested.match),
    switchMap((action) => {
      const establishment$ = hasPayloadJwt(
        action.payload.establishmentRequested,
      )
        ? establishmentGateway.getFormEstablishmentFromJwt$(
            action.payload.establishmentRequested.siret ?? "",
            action.payload.establishmentRequested.jwt,
          )
        : of({
            ...defaultFormEstablishmentValue(),
            ...action.payload.establishmentRequested,
          });

      return establishment$.pipe(
        map(establishmentSlice.actions.fetchEstablishmentSucceeded),
        catchEpicError((error) =>
          establishmentSlice.actions.fetchEstablishmentFailed({
            errorMessage: error.message,
            feedbackTopic: action.payload.feedbackTopic,
          }),
        ),
      );
    }),
  );

const createFormEstablishmentEpic: AppEpic<EstablishmentAction> = (
  action$,
  _state$,
  { establishmentGateway },
) =>
  action$.pipe(
    filter(establishmentSlice.actions.createEstablishmentRequested.match),
    switchMap((action) =>
      establishmentGateway
        .addFormEstablishment$(action.payload.formEstablishment)
        .pipe(
          map(() =>
            establishmentSlice.actions.createEstablishmentSucceeded({
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
          catchEpicError((error) =>
            establishmentSlice.actions.createEstablishmentFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

const editFormEstablishmentEpic: AppEpic<EstablishmentAction> = (
  action$,
  _state$,
  { establishmentGateway },
) =>
  action$.pipe(
    filter(establishmentSlice.actions.updateEstablishmentRequested.match),
    switchMap((action) =>
      establishmentGateway
        .updateFormEstablishment$(
          action.payload.establishmentUpdate.formEstablishment,
          action.payload.establishmentUpdate.jwt,
        )
        .pipe(
          map(() =>
            establishmentSlice.actions.updateEstablishmentSucceeded({
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
          catchEpicError((error) =>
            establishmentSlice.actions.updateEstablishmentFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

const deleteFormEstablishmentEpic: AppEpic<EstablishmentAction> = (
  action$,
  _state$,
  { establishmentGateway },
) =>
  action$.pipe(
    filter(establishmentSlice.actions.deleteEstablishmentRequested.match),
    switchMap((action) =>
      establishmentGateway
        .deleteEstablishment$(
          action.payload.establishmentDelete.siret,
          action.payload.establishmentDelete.jwt,
        )
        .pipe(
          map(() =>
            establishmentSlice.actions.deleteEstablishmentSucceeded({
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
          catchEpicError((error) =>
            establishmentSlice.actions.deleteEstablishmentFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
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

const hasPayloadJwt = (payload: unknown): payload is SiretAndJwtPayload =>
  "jwt" in (payload as SiretAndJwtPayload);

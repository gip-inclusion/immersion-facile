import { filter, map, of, switchMap } from "rxjs";
import { errors } from "shared";
import {
  defaultFormEstablishmentValue,
  establishmentSlice,
  type SiretAndJwtPayload,
} from "src/core-logic/domain/establishment/establishment.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type EstablishmentAction = ActionOfSlice<typeof establishmentSlice>;

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
        : of(defaultFormEstablishmentValue());

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

const fetchEstablishmentNameAndAdminEpic: AppEpic<EstablishmentAction> = (
  action$,
  _state$,
  { establishmentGateway },
) =>
  action$.pipe(
    filter(
      establishmentSlice.actions.fetchEstablishmentNameAndAdminsRequested.match,
    ),
    switchMap((action) =>
      establishmentGateway
        .getEstablishmentNameAndAdmins$(
          action.payload.siret,
          action.payload.jwt,
        )
        .pipe(
          map((establishmentNameAndAdmins) =>
            establishmentSlice.actions.fetchEstablishmentNameAndAdminSucceded({
              establishmentNameAndAdmins,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
          catchEpicError((error) =>
            error.message ===
            errors.establishment.notFound({ siret: action.payload.siret })
              .message
              ? establishmentSlice.actions.fetchEstablishmentNameAndAdminSucceded(
                  {
                    establishmentNameAndAdmins: "establishmentNotFound",
                    feedbackTopic: action.payload.feedbackTopic,
                  },
                )
              : establishmentSlice.actions.fetchEstablishmentFailed({
                  errorMessage: error.message,
                  feedbackTopic: action.payload.feedbackTopic,
                }),
          ),
        ),
    ),
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
        .addFormEstablishment$(
          action.payload.formEstablishment,
          action.payload.jwt,
        )
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
              establishmentUpdate: action.payload.establishmentUpdate,
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
  fetchEstablishmentEpic,
  fetchEstablishmentNameAndAdminEpic,
  createFormEstablishmentEpic,
  editFormEstablishmentEpic,
  deleteFormEstablishmentEpic,
];

const hasPayloadJwt = (payload: unknown): payload is SiretAndJwtPayload =>
  "jwt" in (payload as SiretAndJwtPayload);

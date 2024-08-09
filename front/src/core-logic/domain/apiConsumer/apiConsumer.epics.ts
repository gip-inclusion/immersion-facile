import { filter, map, switchMap } from "rxjs";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type ApiConsumerAction = ActionOfSlice<typeof apiConsumerSlice>;
type ApiConsumerEpic = AppEpic<ApiConsumerAction>;

const getApiConsumerNamesByConventionEpic: ApiConsumerEpic = (
  action$,
  _state$,
  { conventionGateway },
) =>
  action$.pipe(
    filter(apiConsumerSlice.actions.fetchApiConsumerNamesRequested.match),
    switchMap(({ payload }) =>
      conventionGateway
        .getApiConsumersByConvention$(
          { conventionId: payload.conventionId },
          payload.jwt,
        )
        .pipe(
          map((apiConsumerNames) =>
            apiConsumerSlice.actions.fetchApiConsumerNamesSucceeded({
              apiConsumerNames,
              feedbackTopic: payload.feedbackTopic,
            }),
          ),
          catchEpicError((error: Error) =>
            apiConsumerSlice.actions.fetchApiConsumerNamesFailed({
              errorMessage: error.message,
              feedbackTopic: payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

const retrieveApiConsumersEpic: ApiConsumerEpic = (
  action$,
  _state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(apiConsumerSlice.actions.retrieveApiConsumersRequested.match),
    switchMap((action) => adminGateway.getAllApiConsumers$(action.payload)),
    map(apiConsumerSlice.actions.retrieveApiConsumersSucceeded),
    catchEpicError(() => apiConsumerSlice.actions.retrieveApiConsumersFailed()),
  );

const createApiConsumerEpic: ApiConsumerEpic = (
  action$,
  _state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(apiConsumerSlice.actions.saveApiConsumerRequested.match),
    switchMap((action) =>
      adminGateway
        .saveApiConsumer$(action.payload.apiConsumer, action.payload.adminToken)
        .pipe(
          map((token) =>
            token
              ? apiConsumerSlice.actions.saveApiConsumerSucceeded({
                  apiConsumerJwt: token,
                  feedbackTopic: action.payload.feedbackTopic,
                })
              : apiConsumerSlice.actions.updateApiConsumerSucceeded({
                  feedbackTopic: action.payload.feedbackTopic,
                }),
          ),
          catchEpicError((error) =>
            apiConsumerSlice.actions.saveApiConsumerFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

export const apiConsumerEpics = [
  retrieveApiConsumersEpic,
  getApiConsumerNamesByConventionEpic,
  createApiConsumerEpic,
];

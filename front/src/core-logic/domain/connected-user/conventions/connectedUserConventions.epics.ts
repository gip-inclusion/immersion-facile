import { filter, map, switchMap } from "rxjs";
import { connectedUserConventionsSlice } from "src/core-logic/domain/connected-user/conventions/connectedUserConventions.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type ConnectedUserConventionsAction = ActionOfSlice<
  typeof connectedUserConventionsSlice
>;
type ConnectedUserConventionsEpic = AppEpic<ConnectedUserConventionsAction>;

const getConventionsForConnectedUserEpic: ConnectedUserConventionsEpic = (
  actions$,
  _,
  { conventionGateway },
) =>
  actions$.pipe(
    filter(
      connectedUserConventionsSlice.actions
        .getConventionsForConnectedUserRequested.match,
    ),
    switchMap((action) =>
      conventionGateway
        .getConventionsForUser$(action.payload.params, action.payload.jwt)
        .pipe(
          map((response) =>
            connectedUserConventionsSlice.actions.getConventionsForConnectedUserSucceeded(
              {
                feedbackTopic: action.payload.feedbackTopic,
                data: response.data,
                pagination: response.pagination,
              },
            ),
          ),
          catchEpicError((error) =>
            connectedUserConventionsSlice.actions.getConventionsForConnectedUserFailed(
              {
                feedbackTopic: action.payload.feedbackTopic,
                errorMessage: error.message,
              },
            ),
          ),
        ),
    ),
  );

export const connectedUserConventionsEpics = [
  getConventionsForConnectedUserEpic,
];

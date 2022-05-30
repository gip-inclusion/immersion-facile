import { filter, map, switchMap } from "rxjs";
import { establishmentSlice } from "src/core-logic/domain/establishmentPath/establishment.slice";
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

export const establishmentEpics = [requestEstablishmentModification];

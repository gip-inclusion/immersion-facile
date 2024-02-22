import { exhaustMap, filter, map } from "rxjs";
import { establishmentLeadSlice } from "src/core-logic/domain/establishmentLead/establishmentLead.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type EstablishmentLeadAction = ActionOfSlice<typeof establishmentLeadSlice>;

const createEstablishmentLeadEpic: AppEpic<EstablishmentLeadAction> = (
  action$,
  _,
  { establishmentLeadGateway },
) =>
  action$.pipe(
    filter(
      establishmentLeadSlice.actions.unsubscribeEstablishmentLeadRequested
        .match,
    ),
    exhaustMap(({ payload }) =>
      establishmentLeadGateway.rejectEstablishmentLeadRegistration$(payload),
    ),
    map(() =>
      establishmentLeadSlice.actions.unsubscribeEstablishmentLeadSucceeded(),
    ),
    catchEpicError((error) =>
      establishmentLeadSlice.actions.unsubscribeEstablishmentLeadFailed(
        error.message,
      ),
    ),
  );

export const establishmentLeadEpics = [createEstablishmentLeadEpic];

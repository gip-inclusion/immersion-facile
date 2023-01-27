import { filter, map, switchMap } from "rxjs";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { establishmentBatchSlice } from "./establishmentBatch.slice";

type EstablishmentBatchAction = ActionOfSlice<typeof establishmentBatchSlice>;

const addEstablishmentBatchEpic: AppEpic<EstablishmentBatchAction> = (
  action$,
  state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(
      establishmentBatchSlice.actions.addEstablishmentBatchRequested.match,
    ),
    switchMap((action) =>
      adminGateway.addEstablishmentBatch$(
        action.payload,
        state$.value.admin.adminAuth.adminToken || "",
      ),
    ),
    map(establishmentBatchSlice.actions.addEstablishmentBatchSucceeded),
    catchEpicError((error) =>
      establishmentBatchSlice.actions.addEstablishmentBatchErrored(
        error.message,
      ),
    ),
  );

export const establishmentBatchEpics = [addEstablishmentBatchEpic];

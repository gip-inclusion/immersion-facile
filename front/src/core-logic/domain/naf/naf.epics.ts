import { filter, map, switchMap } from "rxjs";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { nafSlice } from "./naf.slice";

type NafAction = ActionOfSlice<typeof nafSlice>;

const getAllSectionsEpic: AppEpic<NafAction> = (
  action$,
  _state$,
  { nafGateway },
) =>
  action$.pipe(
    filter(nafSlice.actions.getAllSectionsRequested.match),
    switchMap(() => nafGateway.getAllNafSections$()),
    map((suggestions) => nafSlice.actions.getAllSectionsSucceeded(suggestions)),
    catchEpicError((_error) => nafSlice.actions.getAllSectionsFailed(null)),
  );

export const nafEpics = [getAllSectionsEpic];

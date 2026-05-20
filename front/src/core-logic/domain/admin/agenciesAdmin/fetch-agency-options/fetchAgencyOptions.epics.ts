import type { PayloadAction } from "@reduxjs/toolkit";
import { debounceTime, distinctUntilChanged, filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { allAgencyStatuses, looksLikeSiret, looksLikeUuid } from "shared";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { agencyAdminSlice } from "./fetchAgencyOptions.slice";

export type AgencyAction = ActionOfSlice<typeof agencyAdminSlice>;

type AgencyEpic = AppEpic<AgencyAction | { type: "do-nothing" }>;

const agencyAdminGetByNameEpic: AgencyEpic = (
  action$,
  _state$,
  { agencyGateway, scheduler },
) =>
  action$.pipe(
    filter(agencyAdminSlice.actions.fetchAgencyOptionsRequested.match),
    debounceTime(400, scheduler),
    distinctUntilChanged(),
    switchMap((action: PayloadAction<string>) => {
      const searchTerm = action.payload;
      const isSiret = looksLikeSiret(searchTerm);
      const isAgencyId = looksLikeUuid(searchTerm);

      if (isSiret)
        return agencyGateway.listAgencyOptionsByFilter$({
          status: [...allAgencyStatuses],
          siret: searchTerm,
        });
      if (isAgencyId)
        return agencyGateway.listAgencyOptionsByFilter$({
          status: [...allAgencyStatuses],
          agencyId: searchTerm,
        });

      return agencyGateway.listAgencyOptionsByFilter$({
        status: [...allAgencyStatuses],
        nameIncludes: searchTerm,
      });
    }),
    map(agencyAdminSlice.actions.setAgencyOptions),
  );

export const agenciesAdminEpics = [agencyAdminGetByNameEpic];

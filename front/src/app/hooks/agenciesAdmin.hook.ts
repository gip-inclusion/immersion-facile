import { useDispatch } from "react-redux";
import { AgencyId } from "shared";
import { agencyAdminSlice } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.slice";

export const useAgencyAdminAutocomplete = () => {
  const dispatch = useDispatch();

  return {
    updateSearchTerm: (searchTerm: string) =>
      dispatch(agencyAdminSlice.actions.setAgencySearchText(searchTerm)),
    selectOption: (agencyId: AgencyId) =>
      dispatch(agencyAdminSlice.actions.setSelectedAgencyId(agencyId)),
  };
};

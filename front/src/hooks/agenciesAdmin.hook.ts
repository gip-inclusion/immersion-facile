import { useDispatch } from "react-redux";
import { AgencyIdAndName } from "shared";
import { agencyAdminSlice } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.slice";

export const useAgencyAdminAutocompleteEpic = () => {
  const dispatch = useDispatch();

  return {
    updateSearchTerm: (searchTerm: string) =>
      dispatch(agencyAdminSlice.actions.setAgencySearchText(searchTerm)),
    selectOption: (agencyIdAndName: AgencyIdAndName) =>
      dispatch(agencyAdminSlice.actions.setSelectedAgency(agencyIdAndName)),
  };
};

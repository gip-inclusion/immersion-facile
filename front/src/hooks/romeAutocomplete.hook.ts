import { useDispatch } from "react-redux";
import { romeAutocompleteSlice } from "src/core-logic/domain/romeAutocomplete/romeAutocomplete.slice";
import { RomeDto } from "shared";

export const useRomeAutocompleteUseCase = () => {
  const dispatch = useDispatch();

  return {
    updateSearchTerm: (searchTerm: string) =>
      dispatch(romeAutocompleteSlice.actions.setRomeSearchText(searchTerm)),
    selectOption: (romeDto: RomeDto | null) =>
      dispatch(romeAutocompleteSlice.actions.setSelectedRome(romeDto)),
  };
};

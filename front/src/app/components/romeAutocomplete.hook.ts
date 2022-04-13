import { useDispatch } from "react-redux";
import { romeAutocompleteSlice } from "src/core-logic/domain/romeAutocomplete/romeAutocomplete.slice";
import {
  RomeCode,
  RomeDto,
} from "src/shared/romeAndAppellationDtos/romeAndAppellation.dto";

export const useRomeAutocompleteUseCase = () => {
  const dispatch = useDispatch();

  return {
    updateSearchTerm: (searchTerm: string) =>
      dispatch(romeAutocompleteSlice.actions.setRomeSearchText(searchTerm)),
    selectOption: (rome: RomeDto | null) =>
      dispatch(
        romeAutocompleteSlice.actions.setSelectedRome(rome?.romeCode ?? null),
      ),
  };
};

import { useDispatch } from "react-redux";
import { SearchSortedBy } from "shared";
import { routes } from "src/app/routes/routes";
import {
  SearchPageParams,
  searchSlice,
} from "src/core-logic/domain/search/search.slice";

export interface SearchInput {
  rome?: string;
  nafDivision?: string;
  lat: number;
  lon: number;
  radiusKm: number;
  address: string;
  sortedBy?: SearchSortedBy;
}

export const useSearchUseCase = () => {
  const dispatch = useDispatch();

  return (values: SearchPageParams) => {
    dispatch(searchSlice.actions.searchRequested(values));
    routes.search(values).replace();
  };
};
